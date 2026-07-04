// ForgeNote M2-06 — 选题雷达生成（解析 + 反编造 + 无伪热度；纯核心可离线测）。
//
// 依据：M2-00 裁决（无伪热度数字，用来源标签）、CODEX-REVIEW.md（数据诚实性）、
//       registry（prototype 校验）、migration 0003/0004。
// 结构：沿用编排壳（buildMessages → callOpenRouterJSON → parse）。
// 反编造（同 M2-05）：evidence_source 必须在枚举内、prototype 过 registry、依据必须可追溯；
//   **禁止任何数字热度/评分**（无 API/爬虫时是伪精确）。

import { z } from "zod";
import type { ChatMessage } from "@/lib/ai/openrouter-client";
import { listByKind, resolveToken } from "@/lib/structure/registry";
import {
  EVIDENCE_SOURCES,
  type EvidenceSource,
  type PrototypeKey,
  type RadarCard,
  type RadarInput,
  type RadarResult,
} from "./types";

const MAX_TOPIC = 80;
const MAX_HOOK = 140;

const cardSchema = z.object({
  topic: z.string(),
  prototypeKey: z.string().optional(),
  hookExample: z.string().optional(),
  suggestedPlatform: z.string().max(32).optional(),
  evidenceSource: z.string(),
  evidenceRefs: z.array(z.string()).default([]),
});
const modelSchema = z.object({ cards: z.array(cardSchema).default([]) });

const SOURCE_SET = new Set<string>(EVIDENCE_SOURCES);

/**
 * 纯函数：解析模型 JSON → 校验 → 反编造过滤。可离线测。
 * validRefs：本次输入生成的合法依据引用（规律N / 观察N / account）；传入则强制引用来自它。
 */
export function parseRadarCards(rawJson: string, opts?: { validRefs?: readonly string[]; count?: number }): RadarResult {
  const validRefSet = opts?.validRefs ? new Set(opts.validRefs) : null;
  const limit = opts?.count ?? 5;

  let parsed: z.infer<typeof modelSchema>;
  try {
    parsed = modelSchema.parse(JSON.parse(rawJson));
  } catch {
    return { ok: false, cards: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "模型返回无法解析为选题卡" };
  }

  const cards: RadarCard[] = [];
  const dropped: { reason: string; raw: unknown }[] = [];

  for (const raw of parsed.cards) {
    const topic = raw.topic.trim();
    // ① 主题非空、限长（防塞正文）
    if (topic.length === 0 || topic.length > MAX_TOPIC) {
      dropped.push({ reason: `主题为空或超长（${topic.length} 字）`, raw });
      continue;
    }
    // ② evidence_source 必须在枚举内（未知→丢弃；不接受伪造/数字热度）
    if (!SOURCE_SET.has(raw.evidenceSource)) {
      dropped.push({ reason: `无效来源标签: ${raw.evidenceSource}`, raw });
      continue;
    }
    const evidenceSource = raw.evidenceSource as EvidenceSource;
    // ③ prototype 可选，但给了就必须是合法 M1 原型（否则清空）
    let prototypeKey: PrototypeKey | undefined;
    if (raw.prototypeKey) {
      const res = resolveToken(raw.prototypeKey, { expectedKind: "prototype" });
      if (res.known && res.token.status === "stable") prototypeKey = res.token.key as PrototypeKey;
      else dropped.push({ reason: `未知 prototype ${raw.prototypeKey}（已清空，仍保留卡）`, raw });
    }
    // ④ 依据引用：按 ledger 过滤（伪造剔除）；account_match 允许 0 依据，其余至少 1
    const rawRefs = raw.evidenceRefs ?? [];
    const evidenceRefs = validRefSet ? rawRefs.filter((r) => validRefSet.has(r)) : rawRefs;
    if (evidenceSource !== "account_match" && evidenceRefs.length === 0) {
      dropped.push({ reason: `来源 ${evidenceSource} 无有效依据引用（伪造或缺失）`, raw });
      continue;
    }

    cards.push({
      topic,
      prototypeKey,
      hookExample: raw.hookExample ? raw.hookExample.slice(0, MAX_HOOK) : undefined,
      suggestedPlatform: raw.suggestedPlatform,
      evidenceSource,
      evidenceRefs,
      status: "proposed",
    });
    if (cards.length >= limit) break;
  }

  return { ok: true, cards, dropped };
}

/** 组装 system + user 消息：基于账号大脑出选题，强约束无热度、来源可追溯。 */
export function buildRadarMessages(input: RadarInput): ChatMessage[] {
  const protoList = listByKind("prototype").map((t) => t.key).join(" / ");
  const sources = EVIDENCE_SOURCES.join(" / ");
  const count = input.count ?? 5;
  const s = input.accountSummary;
  const patterns = (s.provenPatterns ?? []).map((p, i) => `[规律${i + 1}] ${p}`).join("\n") || "（无）";
  const obs = (input.recentObservations ?? []).map((o, i) => `[观察${i + 1}] ${o}`).join("\n") || "（无）";

  const system = [
    `你是选题雷达。基于账号大脑，为创作者产出 ${count} 个**具体**选题（不是泛泛方向）。`,
    "严格要求：",
    `- 每张卡标 prototypeKey（选一个：${protoList}）与 evidenceSource（${sources}）。`,
    "- **禁止任何数字热度/评分/排名**——无外部数据时数字是伪精确。只用来源标签说明为什么建议。",
    "- evidenceSource 选择：题材/角度符合账号→account_match；来自近期观察→recent_signal（引用[观察N]）；",
    "  账号历史该题材/结构有效→historically_effective（引用[规律N]）；试探性无验证→low_evidence。",
    "- 除 account_match 外，evidenceRefs 必须引用真实的 [规律N] 或 [观察N]，不得编造。",
    "- topic 要具体、扣账号受众；hookExample 给一句钩子。",
    '仅输出 JSON：{"cards":[{"topic","prototypeKey","hookExample","suggestedPlatform","evidenceSource","evidenceRefs":[...]}]}',
  ].join("\n");

  const user = [
    s.audience ? `受众：${s.audience}` : "",
    s.voice ? `声音：${s.voice}` : "",
    s.topics?.length ? `常做主题：${s.topics.join("、")}` : "",
    `已验证规律：\n${patterns}`,
    `近期领域观察：\n${obs}`,
  ].filter(Boolean).join("\n\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** server 编排：调 OpenRouter → parseRadarCards。仅服务端。 */
export async function generateRadarCards(input: RadarInput, opts?: { validRefs?: readonly string[] }): Promise<RadarResult> {
  const { callOpenRouterJSON, ModelNotConfiguredError, ModelRequestError } = await import("@/lib/ai/openrouter-client");
  let rawJson: string;
  try {
    rawJson = await callOpenRouterJSON(buildRadarMessages(input));
  } catch (error) {
    if (error instanceof ModelNotConfiguredError) return { ok: false, cards: [], dropped: [], errorCode: "MODEL_NOT_CONFIGURED", errorMessage: error.message };
    if (error instanceof ModelRequestError) return { ok: false, cards: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: error.message };
    return { ok: false, cards: [], dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "生成失败，请稍后重试" };
  }
  return parseRadarCards(rawJson, { validRefs: opts?.validRefs, count: input.count });
}
