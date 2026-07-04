// ForgeNote M2-10 — Recipe 保存 / 复用（纯核心，可离线测）。
//
// 依据：CODEX-REVIEW.md（Recipe 只存 schema/生产方法，禁存正文；只能从 stable structure 保存）、
//       方向文档 v3.16、migration 0003。
//
// 两个操作：
//   buildRecipeFromStructure：stable 结构 → RecipeSchema（抽 machine_key 骨架，剥离疑似正文）。
//   applyRecipeToStructure：RecipeSchema + 新任务 → 复用同一生产方法的结构骨架（换输入）。

import { evaluateStability } from "@/lib/structure/stability";
import { VOCAB_VERSION } from "@/lib/structure/registry";
import type { StructureDocument } from "@/lib/structure/types";
import type { PerformanceSignalRef, RecipeSchema, RendererPolicy, SlotSchemaEntry } from "./types";

/** 疑似正文阈值：策略/提示值超过此长度视为夹带正文，剥离。 */
const MAX_HINT_LEN = 120;

export interface BuildRecipeResult {
  ok: boolean;
  recipe?: RecipeSchema;
  errorCode?: "STRUCTURE_UNSTABLE" | "EMPTY_SCHEMA";
  errorMessage?: string;
}

/**
 * 从 stable 结构抽取 RecipeSchema。
 * - 只能从 stable 结构保存（CODEX §3；unstable 直接拒绝）。
 * - 只取有 strategy 的 slot（生产方法 = 已定策略的骨架）。
 * - rendererPolicy / signalRefs 经反正文清洗。
 */
export function buildRecipeFromStructure(
  structure: Readonly<StructureDocument>,
  opts: { name: string; rendererPolicy?: RendererPolicy; performanceSignalRefs?: PerformanceSignalRef[] },
): BuildRecipeResult {
  const stability = evaluateStability(structure);
  if (!stability.stable) {
    return { ok: false, errorCode: "STRUCTURE_UNSTABLE", errorMessage: `结构未稳定，不能保存为配方：${stability.blockers.join("；")}` };
  }

  const slotSchema: SlotSchemaEntry[] = structure.slots
    .filter((s): s is { key: string; strategyKey: string } => Boolean(s.strategyKey))
    .map((s) => ({ slotKey: s.key, strategyKey: s.strategyKey }));

  if (slotSchema.length === 0) {
    return { ok: false, errorCode: "EMPTY_SCHEMA", errorMessage: "结构无已定策略的 slot，配方为空" };
  }

  const recipe: RecipeSchema = {
    name: opts.name,
    vocabVersion: structure.vocabVersion || VOCAB_VERSION,
    prototypeKey: structure.prototypeKey,
    modalityStack: [...structure.modalityStack],
    slotSchema,
    rendererPolicy: sanitizePolicy(opts.rendererPolicy ?? {}),
    // 只存引用；ref 也做长度保护，避免把表现原文塞进来。
    performanceSignalRefs: (opts.performanceSignalRefs ?? [])
      .filter((r) => r.ref.length <= MAX_HINT_LEN)
      .map((r) => ({ ref: r.ref, kind: r.kind })),
  };

  return { ok: true, recipe };
}

/** 清洗输出策略：剥离超长（疑似正文）字符串值，只保留短机器提示。 */
function sanitizePolicy(policy: RendererPolicy): RendererPolicy {
  const short = (v?: string) => (v && v.length <= MAX_HINT_LEN ? v : undefined);
  const hints: Record<string, string> = {};
  for (const [k, v] of Object.entries(policy.hints ?? {})) {
    if (typeof v === "string" && v.length <= MAX_HINT_LEN) hints[k] = v;
  }
  const out: RendererPolicy = {};
  const dr = short(policy.defaultRenderer);
  const tn = short(policy.tone);
  const lh = short(policy.lengthHint);
  if (dr) out.defaultRenderer = dr;
  if (tn) out.tone = tn;
  if (lh) out.lengthHint = lh;
  if (Object.keys(hints).length) out.hints = hints;
  return out;
}

/**
 * 用配方复用生产方法：产出携带同一 slot_schema 的结构骨架，绑定新任务。
 * "换输入"= 新任务/新选题，同一结构方法；正文由后续生成/渲染为新选题填充。
 * 结构本身只含 machine_key，天然无正文。
 */
export function applyRecipeToStructure(recipe: RecipeSchema, ctx: { taskId: string }): StructureDocument {
  const doc: StructureDocument = {
    id: crypto.randomUUID(),
    taskId: ctx.taskId,
    vocabVersion: recipe.vocabVersion,
    prototypeKey: recipe.prototypeKey,
    modalityStack: [...recipe.modalityStack],
    slots: recipe.slotSchema.map((e) => ({ key: e.slotKey, strategyKey: e.strategyKey })),
    pendingDecisions: [],
    stabilityStatus: "unstable",
    structureHash: undefined,
  };
  // 复用配方通常直接稳定（骨架已定）；回填稳定态与 hash。
  const stability = evaluateStability(doc);
  return { ...doc, stabilityStatus: stability.stable ? "stable" : "unstable", structureHash: stability.structureHash };
}

/** 反正文守卫：扫描配方内是否夹带疑似正文（供 CI / 落库前断言）。返回问题列表（空=干净）。 */
export function auditRecipeNoContent(recipe: RecipeSchema): string[] {
  const problems: string[] = [];
  const BANNED_KEYS = new Set(["content", "text", "article", "draft", "body", "full_text"]);
  const scan = (obj: unknown, path: string) => {
    if (typeof obj === "string") {
      if (obj.length > MAX_HINT_LEN) problems.push(`${path} 值超长（疑似正文，${obj.length} 字）`);
      return;
    }
    if (obj && typeof obj === "object") {
      for (const [k, v] of Object.entries(obj)) {
        if (BANNED_KEYS.has(k)) problems.push(`${path}.${k} 为禁用正文键`);
        scan(v, `${path}.${k}`);
      }
    }
  };
  scan(recipe.rendererPolicy, "rendererPolicy");
  scan(recipe.performanceSignalRefs, "performanceSignalRefs");
  scan(recipe.slotSchema, "slotSchema");
  return problems;
}
