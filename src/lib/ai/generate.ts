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

const modelOutputSchema = z.object({
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
    // I-02B 不做 classifyIntent / buildAssumptions（属 I-09/I-10），原样回传输入假设。
    assumptions: request.assumptions,
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
          .map((a) => `- ${a.label}：${a.value}`)
          .join("\n")
      : "（无显式假设，请基于输入合理推断）";

  const system = [
    "你是 ForgeNote 的内容锻造引擎，把模糊想法整理成可直接发布的小红书图文内容包。",
    "只输出一个 JSON 对象，不要输出 JSON 以外的任何文字、解释或 markdown 代码块围栏。",
    "JSON 结构必须严格为：",
    "{",
    '  "outcome": {',
    '    "positioning": string,            // 内容定位',
    '    "titles": string[],               // 标题备选，至少 2 条',
    '    "body": string,                   // 小红书正文（可含换行）',
    '    "cardStructure": [ { "index": number, "type": string, "title": string } ],',
    '    "cardPrompts": [ { "index": number, "prompt": string } ],',
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
    "cardStructure 与 cardPrompts 的条目数量必须一致且 index 一一对应。",
    "正文与卡片禁止出现公众号 / 微信 / 私信领取等引流话术，禁止焦虑营销。",
  ].join("\n");

  // I-16：仅当请求带 outputLocale 时，追加一条最小输出语言/表达偏好约束；
  // 无 outputLocale 时这一段为空，现有输出行为完全不变。
  const localeLine = request.outputLocale
    ? `\n\n目标输出语言 / 表达偏好：${request.outputLocale}\n请用该语言 / 表达风格产出 outcome 文案（positioning / titles / body / cardStructure / cardPrompts / hashtags / commentGuide）；不改变 JSON 结构与字段名。`
    : "";

  const user = [
    `用户原始想法：\n${request.rawInput}`,
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
    message: outcome.body.trim().length > 0 ? "已包含小红书正文" : "缺少正文",
  });

  checks.push({
    key: "has_card_prompts",
    label: "有卡片 Prompt",
    passed: outcome.cardPrompts.length > 0,
    message:
      outcome.cardPrompts.length > 0
        ? `已包含 ${outcome.cardPrompts.length} 张卡片 Prompt`
        : "缺少卡片 Prompt",
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
  ].join("\n");
  return BANNED_WORDS.find((word) => haystack.includes(word)) ?? null;
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
