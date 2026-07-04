// ForgeNote M2-07 — 结构生成（解析 + registry 校验；纯核心可离线测）。
//
// 依据：CODEX-REVIEW.md §1/§3、registry.ts、types.ts、方向文档 v3.16 §2。
// 结构：沿用编排壳模式（buildMessages → callOpenRouterJSON → parse）。
// 反垃圾（同 M2-05）：模型输出的 slot/strategy 必须过 registry 校验；
//   未知 strategy → 丢弃该策略（slot 变待填），不把近义漂移写进结构。

import { z } from "zod";
import type { ChatMessage } from "@/lib/ai/openrouter-client";
import { listByKind, resolveToken, VOCAB_VERSION } from "./registry";
import type {
  ModalityKey,
  ModalityStack,
  PendingDecision,
  StructureDocument,
  StructureSlot,
} from "./types";

/** M1 合法模态（temporal 不进主路径）。 */
const M1_MODALITIES = new Set<ModalityKey>(["narrative", "visual"]);

const modelSchema = z.object({
  prototypeKey: z.string(),
  modalityStack: z.array(z.string()).default(["narrative"]),
  slots: z.array(z.object({ key: z.string(), strategyKey: z.string().optional() })).default([]),
  pendingDecisions: z
    .array(z.object({ key: z.string(), required: z.boolean().default(false), options: z.array(z.string()).optional() }))
    .default([]),
});

export interface ParseStructureResult {
  ok: boolean;
  document?: StructureDocument;
  /** 被丢弃/降级的项（未知 prototype/slot/strategy），透明可审计。 */
  dropped: { reason: string; raw: unknown }[];
  errorCode?: "MODEL_NOT_CONFIGURED" | "GENERATION_FAILED";
  errorMessage?: string;
}

/**
 * 纯函数：解析模型 JSON → registry 校验 → 产出 StructureDocument（stabilityStatus 先置 unstable）。
 * 稳定性判定由 stability.ts 单独做（分离关注点）。
 */
export function parseStructure(
  rawJson: string,
  ctx: { taskId: string },
): ParseStructureResult {
  let parsed: z.infer<typeof modelSchema>;
  try {
    parsed = modelSchema.parse(JSON.parse(rawJson));
  } catch {
    return { ok: false, dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "模型返回无法解析为结构" };
  }

  const dropped: { reason: string; raw: unknown }[] = [];

  // ① prototype 必须是合法稳定原型
  const proto = resolveToken(parsed.prototypeKey, { expectedKind: "prototype" });
  if (!proto.known || proto.token.status !== "stable") {
    return { ok: false, dropped: [{ reason: `未知/非稳定 prototype: ${parsed.prototypeKey}`, raw: parsed.prototypeKey }],
      errorCode: "GENERATION_FAILED", errorMessage: "内容原型不在 M1 五类内" };
  }
  const prototypeKey = proto.token.key;

  // ② 模态栈：过滤到 M1 合法模态（temporal / 未知丢弃），去重保序，保证含 narrative 基座
  const modalityStack = normalizeModalityStack(parsed.modalityStack, dropped);

  // ③ slots：slot key 必须已知；slot 必须属于当前模态栈；strategy 必须能挂在该 slot 下
  const stackSet = new Set<string>(modalityStack);
  const slots: StructureSlot[] = [];
  for (const raw of parsed.slots) {
    const slotRes = resolveToken(raw.key, { expectedKind: "slot" });
    if (!slotRes.known) {
      dropped.push({ reason: `未知 slot: ${raw.key}`, raw });
      continue;
    }
    const slotKey = slotRes.token.key;
    // slot 的 allowedParents 是所属 modality；必须在当前栈内（防跨模态污染，如 narrative-only 塞 layout）
    const slotModalities = slotRes.token.allowedParents ?? [];
    if (slotModalities.length > 0 && !slotModalities.some((m) => stackSet.has(m))) {
      dropped.push({ reason: `slot ${slotKey} 不属于当前模态栈 [${modalityStack.join(",")}]`, raw });
      continue;
    }
    let strategyKey: string | undefined;
    if (raw.strategyKey) {
      const stratRes = resolveToken(raw.strategyKey, { expectedKind: "strategy", parent: slotKey });
      if (stratRes.known) {
        strategyKey = stratRes.token.key;
      } else {
        // 未知/越级 strategy：丢弃策略，slot 保留为待填（不写近义漂移）
        dropped.push({ reason: `strategy ${raw.strategyKey} 不适用于 slot ${slotKey}，降级为待填`, raw });
      }
    }
    slots.push({ key: slotKey, strategyKey });
  }

  // ④ pending decisions：key/options 长度与数量限流（防自由长文本夹带），透传 + 初始 detected
  const pendingDecisions: PendingDecision[] = parsed.pendingDecisions
    .filter((d) => {
      const ok = d.key.length <= 64 && (d.options ?? []).length <= 6 && (d.options ?? []).every((o) => o.length <= 40);
      if (!ok) dropped.push({ reason: `pending decision ${d.key} 超长/超量，丢弃`, raw: d });
      return ok;
    })
    .map((d) => ({
      key: d.key,
      status: "detected" as const,
      required: d.required,
      options: d.options,
    }));

  const document: StructureDocument = {
    id: crypto.randomUUID(),
    taskId: ctx.taskId,
    vocabVersion: VOCAB_VERSION,
    prototypeKey,
    modalityStack,
    slots,
    pendingDecisions,
    stabilityStatus: "unstable", // 由 stability.ts 评估后回填
    structureHash: undefined,
  };

  return { ok: true, document, dropped };
}

/** 规范化模态栈：只留 M1 合法模态、去重保序、保证 narrative 基座在首位。 */
function normalizeModalityStack(input: readonly string[], dropped: { reason: string; raw: unknown }[]): ModalityStack {
  const seen = new Set<ModalityKey>();
  const out: ModalityKey[] = [];
  for (const m of input) {
    if (!M1_MODALITIES.has(m as ModalityKey)) {
      dropped.push({ reason: `模态 ${m} 不在 M1 主路径（narrative/visual）`, raw: m });
      continue;
    }
    const key = m as ModalityKey;
    if (!seen.has(key)) {
      seen.add(key);
      out.push(key);
    }
  }
  // narrative 是基座：缺失则补在首位
  if (!seen.has("narrative")) out.unshift("narrative");
  // narrative 必须在首位
  return out.sort((a, b) => (a === "narrative" ? -1 : b === "narrative" ? 1 : 0));
}

/** 组装 system + user 消息，约束 JSON 结构 + 只用 registry token。 */
export function buildStructureMessages(input: { rawIntent: string; prototypeKey?: string }): ChatMessage[] {
  const protoList = listByKind("prototype").map((t) => t.key).join(" / ");
  const slotList = listByKind("slot").map((t) => t.key).join(" / ");
  const stratList = listByKind("strategy").map((t) => t.key).join(" / ");

  const system = [
    "你是内容结构生成器。把用户的模糊想法转成结构（只用给定的 machine_key，不要自造词）。",
    `内容原型（选一个）：${protoList}`,
    `模态栈：["narrative"] 或 ["narrative","visual"]（M1 不用 temporal）`,
    `slot key（只用这些）：${slotList}`,
    `strategy key（只用这些，且必须匹配 slot）：${stratList}`,
    "必填 slot（hook / insight / resolution）必须给出匹配的 strategyKey，不能留空；visual 模态还需 layout。",
    "拿不准的结构级选择放进 pendingDecisions（如 context.granularity）。",
    "决策默认 required=false 并给出安全默认（放进 options 第一项）；只有当它影响内容真实性、平台适配或结构完整性时才 required=true。",
    '仅输出 JSON：{"prototypeKey","modalityStack":[...],"slots":[{"key","strategyKey"}],"pendingDecisions":[{"key","required":false,"options":["默认值","备选"]}]}',
  ].join("\n");

  const user = [input.prototypeKey ? `建议原型：${input.prototypeKey}` : "", `想法：${input.rawIntent}`]
    .filter(Boolean)
    .join("\n");

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

/** server 编排：调 OpenRouter → parseStructure。仅服务端。 */
export async function generateStructure(input: { rawIntent: string; prototypeKey?: string; taskId: string }): Promise<ParseStructureResult> {
  const { callOpenRouterJSON, ModelNotConfiguredError, ModelRequestError } = await import("@/lib/ai/openrouter-client");
  let rawJson: string;
  try {
    rawJson = await callOpenRouterJSON(buildStructureMessages(input));
  } catch (error) {
    if (error instanceof ModelNotConfiguredError) return { ok: false, dropped: [], errorCode: "MODEL_NOT_CONFIGURED", errorMessage: error.message };
    if (error instanceof ModelRequestError) return { ok: false, dropped: [], errorCode: "GENERATION_FAILED", errorMessage: error.message };
    return { ok: false, dropped: [], errorCode: "GENERATION_FAILED", errorMessage: "生成失败，请稍后重试" };
  }
  return parseStructure(rawJson, { taskId: input.taskId });
}
