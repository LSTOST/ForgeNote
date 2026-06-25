// ForgeNote M1 — Forge 生成编排（I-02B）。
// 仅限服务端：组合 prompt → 调 OpenRouter → 解析校验 → 计算验收 → 产出 ForgeGenerationResponse。
// 失败（缺 env / 上游错误 / 解析失败）一律落 D-04 草稿（status=draft、outcome=null）。
// 依据：docs/API-CONTRACT.md §5.1 / §7、docs/DATA-SCHEMA.md §4、docs/DECISIONS.md（D-04 / 模型网关）、
//       docs/MODEL-INTEGRATION.md §5（失败降级）、docs/PRD-M1.md（F-05 / F-14 / §10.3 acceptance）。

import { z } from "zod";

import {
  callOpenRouterJSON,
  ModelNotConfiguredError,
  ModelRequestError,
  type ChatMessage,
} from "./openrouter-client";
import type {
  Assumption,
  AssumptionConfidence,
  ContentPackage,
  ForgeGenerationDraft,
  ForgeGenerationRequest,
  ForgeGenerationResponse,
  GenerationErrorCode,
  RecipeDraft,
  Verification,
  VerificationCheck,
} from "./types";

/** 默认禁止 / 引流词（PRD §10.3 banned_words、F-07 默认禁止项的机器可判子集）。 */
const BANNED_WORDS = [
  "公众号",
  "微信",
  "私信",
  "加我",
  "扫码",
  "关注我领",
  "免费领取",
];

/** content_package 话题数量区间（PRD §10.3 acceptance：min 5 / max 10）。 */
const HASHTAG_MIN = 5;
const HASHTAG_MAX = 10;

// ── 模型输出 schema（只校验 outcome + recipe；verification 由本层确定性计算） ──

const cardStructureSchema = z.object({
  index: z.number(),
  type: z.string(),
  title: z.string(),
});

const cardPromptSchema = z.object({
  index: z.number(),
  prompt: z.string(),
  body: z.string().optional(),
  visualDirection: z.string().optional(),
});

const outcomeSchema = z.object({
  positioning: z.string(),
  titles: z.array(z.string()),
  body: z.string(),
  cardStructure: z.array(cardStructureSchema),
  cardPrompts: z.array(cardPromptSchema),
  hashtags: z.array(z.string()),
  commentGuide: z.string(),
});

const recipeSchema = z.object({
  name: z.string(),
  audience: z.string(),
  goal: z.string(),
  tone: z.string(),
  structure: z.array(z.string()),
  visualStyle: z.string(),
  negativeRules: z.array(z.string()),
  variables: z.array(z.string()),
  acceptance: z.array(z.string()),
});

const modelAssumptionSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.string(),
  rationale: z.string().optional(),
  confidence: z.enum(["high", "inferred", "unsure"]).optional(),
});

const modelOutputSchema = z.object({
  assumptions: z.array(modelAssumptionSchema).optional(),
  outcome: outcomeSchema,
  recipe: recipeSchema,
});

/**
 * 主入口：根据请求调用真实模型生成内容包。
 * 成功 → ForgeGenerationSuccess；任何失败 → ForgeGenerationFailure（含 D-04 草稿）。
 * 本函数不接数据库、不持久化 session（I-02B 边界）。
 */
export async function generateContentPackage(
  request: ForgeGenerationRequest,
): Promise<ForgeGenerationResponse> {
  let rawContent: string;
  try {
    rawContent = await callOpenRouterJSON(buildMessages(request));
  } catch (error) {
    if (error instanceof ModelNotConfiguredError) {
      return failure(request, "MODEL_NOT_CONFIGURED", error.message, false);
    }
    if (error instanceof ModelRequestError) {
      return failure(request, "GENERATION_FAILED", error.message, true);
    }
    return failure(request, "GENERATION_FAILED", "生成失败，请稍后重试", true);
  }

  // 解析 + 结构校验：任一失败都按 GENERATION_FAILED 降级（不白屏）。
  let parsed: z.infer<typeof modelOutputSchema>;
  try {
    parsed = modelOutputSchema.parse(JSON.parse(rawContent));
  } catch {
    return failure(
      request,
      "GENERATION_FAILED",
      "模型返回内容无法解析为预期结构",
      true,
    );
  }

  const outcome: ContentPackage = parsed.outcome;
  const recipe: RecipeDraft = {
    ...parsed.recipe,
    // intentType 以请求为准，避免模型回填错误类型。
    intentType: request.intentType,
  };
  const verification = verifyOutcome(outcome);

  return {
    ok: true,
    intentType: request.intentType,
    assumptions: normalizeAssumptions(request, parsed.assumptions),
    questions: [],
    outcome,
    recipe,
    verification,
  };
}

/** 组装 system + user 两条消息，强约束 JSON 输出结构。 */
function buildMessages(request: ForgeGenerationRequest): ChatMessage[] {
  const assumptionLines =
    request.assumptions.length > 0
      ? request.assumptions
          .filter((a) => a.state !== "dismissed")
          .map((a) => {
            const confidence = a.confidence ? `；置信度：${a.confidence}` : "";
            const rationale = a.rationale ? `；依据：${a.rationale}` : "";
            return `- ${a.label}：${a.value}${confidence}${rationale}`;
          })
          .join("\n")
      : "（无显式假设，请基于输入合理推断）";

  const accountPostLine = request.accountPost
    ? `\n\n用户贴过的一条过往帖（只用于本次账号语气/受众推断，不要在结果中逐字复述）：\n${request.accountPost}`
    : "";

  const system = [
    "你是 ForgeNote 的内容锻造引擎，把模糊想法整理成可直接发布的图文内容方案。",
    "只输出一个 JSON 对象，不要输出 JSON 以外的任何文字、解释或 markdown 代码块围栏。",
    "JSON 结构必须严格为：",
    "{",
    '  "assumptions": [',
    '    { "key": string, "label": string, "value": string, "rationale": string, "confidence": "high" | "inferred" | "unsure" }',
    "  ],",
    '  "outcome": {',
    '    "positioning": string,            // 内容定位',
    '    "titles": string[],               // 标题备选，至少 2 条',
    '    "body": string,                   // 发布正文（可含换行）',
    '    "cardStructure": [ { "index": number, "type": string, "title": string } ],',
    '    "cardPrompts": [ { "index": number, "prompt": string, "body": string, "visualDirection": string } ],',
    `    "hashtags": string[],             // ${HASHTAG_MIN}-${HASHTAG_MAX} 个话题，不带 # 号`,
    '    "commentGuide": string            // 评论区引导句',
    "  },",
    '  "recipe": {',
    '    "name": string,                   // 配方名称',
    '    "audience": string,               // 目标受众',
    '    "goal": string,                   // 内容目标',
    '    "tone": string,                   // 语气风格',
    '    "structure": string[],            // 结构方式',
    '    "visualStyle": string,            // 视觉规范',
    '    "negativeRules": string[],        // 禁止项',
    '    "variables": string[],            // 可替换变量',
    '    "acceptance": string[]            // 验收标准',
    "  }",
    "}",
    "cardStructure 与 cardPrompts 的条目数量必须一致且 index 一一对应，数量必须为 5-8 页。",
    "cardPrompts.prompt 字段保留兼容，但现在必须写该页可直接上卡片的文案，不要写绘图提示词。",
    "cardPrompts.body 必须写该页卡片正文/要点，适合直接复制到图文卡片；visualDirection 必须写该页配图方向。",
    "结果要像可发布初稿：正文可直接作为发布文案起点，每页卡片有标题、正文/要点、配图方向，recipe.acceptance 写发布前检查项。",
    "assumptions 只输出 3 条：受众、内容形式、表达角度。每条必须有 rationale 和 confidence。",
    "如果用户已提供已确认假设，assumptions 要回显这些假设，不要擅自改写用户已改的值。",
    "正文与卡片禁止出现公众号 / 微信 / 私信领取等引流话术，禁止焦虑营销。",
  ].join("\n");

  // I-16：仅当请求带 outputLocale 时，追加一条最小输出语言/表达偏好约束；
  // 无 outputLocale 时这一段为空，现有输出行为完全不变。
  const localeLine = request.outputLocale
    ? `\n\n目标输出语言 / 表达偏好：${request.outputLocale}\n请用该语言 / 表达风格产出 outcome 文案（positioning / titles / body / cardStructure / cardPrompts / hashtags / commentGuide）；不改变 JSON 结构与字段名。`
    : "";

  const user = [
    `用户原始想法：\n${request.rawInput}`,
    accountPostLine,
    "",
    `内容类型：${request.intentType}`,
    "",
    `已确认的上下文假设：\n${assumptionLines}`,
    localeLine,
  ].join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

function normalizeAssumptions(
  request: ForgeGenerationRequest,
  modelAssumptions:
    | Array<{
        key: string;
        label: string;
        value: string;
        rationale?: string;
        confidence?: AssumptionConfidence;
      }>
    | undefined,
): Assumption[] {
  if (request.assumptions.length > 0) {
    return request.assumptions.map((a) => ({
      ...a,
      rationale: a.rationale ?? `${a.label} 来自本次生成前的方向确认。`,
      confidence: a.confidence ?? (a.source === "manual" ? "high" : "inferred"),
    }));
  }

  if (!modelAssumptions || modelAssumptions.length === 0) return [];

  return modelAssumptions.slice(0, 3).map((a) => ({
    key: a.key,
    label: a.label,
    value: a.value,
    valueType: "text",
    source: "inferred",
    state: "default",
    editable: true,
    rationale: a.rationale,
    confidence: a.confidence ?? "inferred",
  }));
}

/**
 * 确定性验收（机器可判，PRD F-14 / §10.3）。
 * 不信任模型自报验收，由本层基于产出结构计算。
 */
function verifyOutcome(outcome: ContentPackage): Verification {
  const checks: VerificationCheck[] = [];

  checks.push({
    key: "has_title",
    label: "有标题",
    passed: outcome.titles.length > 0,
    message:
      outcome.titles.length > 0 ? "已包含标题备选" : "缺少标题备选",
  });

  checks.push({
    key: "has_body",
    label: "有正文",
    passed: outcome.body.trim().length > 0,
    message: outcome.body.trim().length > 0 ? "已包含发布正文" : "缺少正文",
  });

  checks.push({
    key: "has_card_prompts",
    label: "有画面说明",
    passed: outcome.cardPrompts.length > 0,
    message:
      outcome.cardPrompts.length > 0
        ? `已包含 ${outcome.cardPrompts.length} 页卡片文案`
        : "缺少逐页卡片文案",
  });

  const cardCount = outcome.cardPrompts.length;
  const cardCountOk = cardCount >= 5 && cardCount <= 8;
  checks.push({
    key: "card_count",
    label: "逐页卡片数量（5-8）",
    passed: cardCountOk,
    message: cardCountOk
      ? `已规划 ${cardCount} 页`
      : `当前 ${cardCount} 页，需在 5-8 页之间`,
  });

  const structureIndexes = new Set(outcome.cardStructure.map((card) => card.index));
  const cardsAligned =
    outcome.cardStructure.length === outcome.cardPrompts.length &&
    outcome.cardPrompts.every((card) => structureIndexes.has(card.index));
  checks.push({
    key: "cards_aligned",
    label: "卡片标题与文案一一对应",
    passed: cardsAligned,
    message: cardsAligned ? "每页都有标题和文案" : "卡片结构与逐页文案未对齐",
  });

  const cardsHaveBody = outcome.cardPrompts.every(
    (card) => (card.body ?? card.prompt).trim().length > 0,
  );
  checks.push({
    key: "cards_have_copy",
    label: "每页有可复制文案",
    passed: cardsHaveBody,
    message: cardsHaveBody ? "每页都有正文/要点" : "存在缺少正文/要点的卡片",
  });

  const cardsHaveVisualDirection = outcome.cardPrompts.every((card) => {
    if (card.visualDirection !== undefined) {
      return card.visualDirection.trim().length > 0;
    }
    return hasVisualDirection(card.prompt);
  });
  checks.push({
    key: "cards_have_visual_direction",
    label: "每页有配图方向",
    passed: cardsHaveVisualDirection,
    message: cardsHaveVisualDirection
      ? "每页都有配图方向"
      : "存在缺少配图方向的卡片",
  });

  const hashtagCount = outcome.hashtags.length;
  const hashtagOk = hashtagCount >= HASHTAG_MIN && hashtagCount <= HASHTAG_MAX;
  checks.push({
    key: "has_hashtags",
    label: `话题数量（${HASHTAG_MIN}-${HASHTAG_MAX}）`,
    passed: hashtagOk,
    message: hashtagOk
      ? `已包含 ${hashtagCount} 个话题`
      : `当前 ${hashtagCount} 个，需在 ${HASHTAG_MIN}-${HASHTAG_MAX} 之间`,
  });

  const hit = findBannedWord(outcome);
  checks.push({
    key: "no_diversion",
    label: "无引流 / 禁用词",
    passed: hit === null,
    message: hit === null ? "未命中默认禁用词" : `命中禁用词：${hit}`,
  });

  return {
    overallPassed: checks.every((c) => c.passed),
    checks,
  };
}

/** 在正文、标题、评论引导中扫描默认禁用词，命中返回该词。 */
function findBannedWord(outcome: ContentPackage): string | null {
  const haystack = [
    outcome.body,
    outcome.commentGuide,
    ...outcome.titles,
    ...outcome.cardPrompts.flatMap((card) => [
      card.prompt,
      card.body ?? "",
      card.visualDirection ?? "",
    ]),
  ].join("\n");
  return BANNED_WORDS.find((word) => haystack.includes(word)) ?? null;
}

function hasVisualDirection(value: string): boolean {
  const text = value.trim();
  if (text.length === 0) return false;
  return ["配图", "画面", "视觉", "背景", "图标", "插图", "排版"].some((word) =>
    text.includes(word),
  );
}

/** 构造失败响应：保留输入与假设的 D-04 草稿。 */
function failure(
  request: ForgeGenerationRequest,
  code: GenerationErrorCode,
  message: string,
  retryable: boolean,
): ForgeGenerationResponse {
  const draft: ForgeGenerationDraft = {
    rawInput: request.rawInput,
    intentType: request.intentType,
    assumptions: request.assumptions,
    status: "draft",
    outcome: null,
    errorCode: code,
  };
  return {
    ok: false,
    error: { code, message, retryable },
    draft,
  };
}
