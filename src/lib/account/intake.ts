// ForgeNote M2-05 — 账号接入编排（域核心：prompt + 解析 + 反编造校验 + freshness）。
//
// 依据：CODEX-REVIEW.md §M2-05 / §5、方向文档 v3.16、migration 0003。
// 结构：沿用 generate.ts 的编排壳模式（buildMessages → callOpenRouterJSON → zod parse → 校验）。
// 分层：`parseAccountMemory` 为纯函数（可离线测试）；`generateAccountMemory` 为 server 编排（调 OpenRouter）。
//
// 反编造铁律（Codex §5：Owner 自用最怕"看起来像数据其实是模型编的"）：
//   - 每条记忆必须带 ledger 内的 source + 证据；否则丢弃并记入 dropped，不入账号大脑。
//   - 不接受模型返回的正文/自由文章字段；只取结构化 body（防止把成稿塞进记忆）。

import { z } from "zod";
import type { ChatMessage } from "@/lib/ai/openrouter-client";
import {
  MEMORY_KINDS,
  MEMORY_SOURCES,
  type AccountIntakeInput,
  type AccountIntakeResult,
  type AccountMemoryItem,
  type MemoryKind,
  type MemorySource,
} from "./types";

/** 模型输出 schema。刻意宽松接收，再由 parse 逐条做 ledger 校验与丢弃（不信任模型）。 */
const modelItemSchema = z.object({
  kind: z.string(),
  source: z.string(),
  body: z.record(z.string(), z.unknown()).default({}),
  evidenceCount: z.number().int().nonnegative().optional(),
  // 证据引用：来源可追溯。空数组 = 无证据 = 疑似编造，将被丢弃。
  evidenceRefs: z.array(z.string()).default([]),
});
const modelOutputSchema = z.object({
  items: z.array(modelItemSchema).default([]),
});

const KIND_SET = new Set<string>(MEMORY_KINDS);
const SOURCE_SET = new Set<string>(MEMORY_SOURCES);

/**
 * 纯函数：解析模型 JSON → 校验 → 反编造过滤 → 赋 freshness。
 * 可离线测试（无需 OpenRouter）。now 注入以便测试确定性。
 * validRefs：本次输入生成的合法证据引用集合（profile / 帖N / 表现N）；
 *   传入则强制 evidenceRefs 必须来自它（防模型伪造 [帖99]）。不传则退化为旧行为（只查数量）。
 */
export function parseAccountMemory(
  rawJson: string,
  opts?: { now?: () => Date; validRefs?: readonly string[] },
): AccountIntakeResult {
  const now = (opts?.now ?? (() => new Date()))().toISOString();
  const validRefSet = opts?.validRefs ? new Set(opts.validRefs) : null;

  let parsed: z.infer<typeof modelOutputSchema>;
  try {
    parsed = modelOutputSchema.parse(JSON.parse(rawJson));
  } catch {
    return { ok: false, items: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "模型返回无法解析为预期结构" };
  }

  const items: AccountMemoryItem[] = [];
  const dropped: { reason: string; raw: unknown }[] = [];

  for (const raw of parsed.items) {
    // ① 类别必须在封闭集合内
    if (!KIND_SET.has(raw.kind)) {
      dropped.push({ reason: `未知 kind: ${raw.kind}`, raw });
      continue;
    }
    // ② 来源必须在 ledger 内（无来源/未知来源 = 疑似编造）
    if (!SOURCE_SET.has(raw.source)) {
      dropped.push({ reason: `无效 source（不在来源账本内）: ${raw.source}`, raw });
      continue;
    }
    // ③ 证据引用：先按 ledger 过滤（伪造的 [帖99] 被剔除），再要求非 account_match 至少剩 1 条
    const rawRefs = raw.evidenceRefs ?? [];
    const evidenceRefs = validRefSet ? rawRefs.filter((r) => validRefSet.has(r)) : rawRefs;
    if (raw.source !== "account_match" && evidenceRefs.length === 0) {
      dropped.push({ reason: `来源 ${raw.source} 无有效证据引用（伪造或缺失）`, raw });
      continue;
    }
    // ④ body 递归清洗：禁用正文键（任意深度）、限字符长度、限数组长度、限深度；清洗后非空
    const body = sanitizeBody(raw.body);
    if (Object.keys(body).length === 0) {
      dropped.push({ reason: "body 为空或仅含被剥离的正文字段", raw });
      continue;
    }

    items.push({
      kind: raw.kind as MemoryKind,
      source: raw.source as MemorySource,
      body,
      evidenceRefs,
      // 证据条数 = 有效引用数（不信任模型自报）
      evidenceCount: evidenceRefs.length,
      freshnessAt: now,
      status: "active",
    });
  }

  return { ok: true, items, dropped };
}

/** 递归清洗 body（记忆只存结构化信念，不存文章）。防模型把正文藏进嵌套对象/数组。 */
const BANNED_BODY_KEYS = new Set(["content", "text", "article", "draft", "full_text", "body_text", "raw", "html", "markdown"]);
const MAX_STR = 280; // 单字符串上限（超长视为正文）
const MAX_ARR = 12; // 数组长度上限
const MAX_DEPTH = 4; // 嵌套深度上限

function sanitizeValue(v: unknown, depth: number): unknown | undefined {
  if (typeof v === "string") return v.length > MAX_STR ? undefined : v;
  if (typeof v === "number" || typeof v === "boolean" || v === null) return v;
  if (depth >= MAX_DEPTH) return undefined; // 太深，丢弃
  if (Array.isArray(v)) {
    const arr = v.slice(0, MAX_ARR).map((x) => sanitizeValue(x, depth + 1)).filter((x) => x !== undefined);
    return arr.length ? arr : undefined;
  }
  if (v && typeof v === "object") {
    const obj = sanitizeBody(v as Record<string, unknown>, depth + 1);
    return Object.keys(obj).length ? obj : undefined;
  }
  return undefined; // 函数/symbol 等一律丢
}

function sanitizeBody(body: Record<string, unknown>, depth = 0): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (BANNED_BODY_KEYS.has(k.toLowerCase())) continue;
    const cleaned = sanitizeValue(v, depth);
    if (cleaned !== undefined) out[k] = cleaned;
  }
  return out;
}

/** 组装 system + user 两条消息，强约束 JSON 输出 + 反编造要求。 */
export function buildIntakeMessages(input: AccountIntakeInput): ChatMessage[] {
  const kinds = MEMORY_KINDS.join(" / ");
  const sources = MEMORY_SOURCES.join(" / ");
  const posts = input.recentPosts.map((p, i) => `[帖${i + 1}] ${p}`).join("\n");
  const perf = (input.performanceNotes ?? []).map((p, i) => `[表现${i + 1}] ${p}`).join("\n") || "（未提供）";

  const system = [
    "你是内容账号分析器。基于用户粘贴的资料，抽取结构化的账号记忆条目（覆盖受众/声音/规律/主题/视觉偏好，不要只写互动数据）。",
    "严格要求：",
    `- 每条记忆标注 kind（${kinds}）与 source（${sources}）。`,
    "- evidenceRefs 是关键：用输入里的标记引用证据——帖子用 [帖1][帖2]…，表现数据用 [表现1][表现2]…，profile 推断用 \"profile\"。",
    "- source 怎么选：有具体帖子/表现佐证用 pasted_post；仅凭 profile 或整体印象推断（无具体帖子）用 account_match。source 只能是上面列出的值，不要用 \"profile\"。",
    "- 除 account_match 外，每条都必须至少给 1 个 evidenceRef（引用帖子或表现）。",
    "- body 只放结构化键值信念（如 {\"voice\":\"克制、具体\"}），禁止放正文、完整帖子、长段落。",
    "- 宁缺毋编：真没有证据支撑的判断不要输出。",
    "示例：",
    '{"kind":"audience","source":"pasted_post","body":{"who":"独居的年轻人","cares_about":"实用与省钱"},"evidenceRefs":["帖1","帖3"]}',
    '{"kind":"proven_pattern","source":"pasted_post","body":{"pattern":"反种草/复盘类高互动"},"evidenceRefs":["帖1","表现1"],"evidenceCount":2}',
    '仅输出 JSON：{"items":[ … ]}',
  ].join("\n");

  const user = [
    input.platform ? `平台：${input.platform}` : "",
    `Profile：\n${input.profileText}`,
    `近期内容：\n${posts}`,
    `表现数据：\n${perf}`,
  ].filter(Boolean).join("\n\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/**
 * server 编排：调 OpenRouter → parseAccountMemory。仅服务端使用（动态 import server-only 客户端）。
 * 本环境无 OPENROUTER_API_KEY 时返回 MODEL_NOT_CONFIGURED（不白屏）。
 */
export async function generateAccountMemory(
  input: AccountIntakeInput,
  opts?: { validRefs?: readonly string[] },
): Promise<AccountIntakeResult> {
  const { callOpenRouterJSON, ModelNotConfiguredError, ModelRequestError } = await import("@/lib/ai/openrouter-client");
  let rawJson: string;
  try {
    rawJson = await callOpenRouterJSON(buildIntakeMessages(input));
  } catch (error) {
    if (error instanceof ModelNotConfiguredError) {
      return { ok: false, items: [], dropped: [], errorCode: "MODEL_NOT_CONFIGURED", errorMessage: error.message };
    }
    if (error instanceof ModelRequestError) {
      return { ok: false, items: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: error.message };
    }
    return { ok: false, items: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "生成失败，请稍后重试" };
  }
  return parseAccountMemory(rawJson, { validRefs: opts?.validRefs });
}
