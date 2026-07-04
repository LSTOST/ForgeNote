// ForgeNote M2-03 — Renderer 契约（渲染层接口 + structureHash + golden-test harness 骨架）。
//
// 依据：CODEX-REVIEW.md §4（renderer 接口架构）、方向文档 v3.16 §2（渲染层）、M2-BUILD-PLAN.md M2-03。
// 纯 TS：仅类型 + 纯函数，不引用 Next / Supabase / 浏览器 API。
//
// 铁律（Codex §4）：
// - renderer 是纯适配层：读 Structure + 账号上下文，输出 RenderArtifact。
// - 禁止新增 slot / 改 prototype / 改 structure token。structure 对 renderer 只读。
// - renderer 不写 DB；由 orchestration layer 持久化 artifact。
// - 每个 artifact 必须带 sourceStructureHash 溯源。
// - 加平台 = 新增 renderer module + 测试，不动结构引擎。

import type { StructureDocument } from "@/lib/structure/types";

/** M1 三个 renderer（铁线；temporal/其他平台 M1 后开放）。 */
export type RendererId = "xiaohongshu" | "x_thread" | "image_prompt";

/** artifact 输出格式。 */
export type RenderFormat = "text" | "thread" | "carousel_copy" | "image_prompt";

/** 账号大脑快照（renderer 只读；只用于格式/语气/长度/禁用词/标签习惯，不得反向改结构）。 */
export interface AccountBrainSnapshot {
  audience?: string;
  voice?: string;
  /** 平台切片：某平台的格式惯例（machine_key / 轻量文本）。renderer 只读这一片。 */
  platformSlice?: Readonly<Record<string, unknown>>;
}

/** renderer 约束（如禁用词、长度上限）。 */
export interface RendererConstraint {
  kind: string;
  value: string;
}

/** renderer 输入。structure 与 accountBrain 均只读，类型层强制 renderer 不可改结构。 */
export interface RendererInput {
  structure: Readonly<StructureDocument>;
  accountBrain: Readonly<AccountBrainSnapshot>;
  target: {
    rendererId: RendererId;
    /** 输出语言（自由文本，如 zh-Hans / en）。多语言在输出层，不在结构层。 */
    language?: string;
    lengthHint?: string;
  };
  constraints: readonly RendererConstraint[];
}

/** renderer 产物（历史输出，可含文本；不是 Recipe）。 */
export interface RenderArtifact {
  id: string;
  rendererId: RendererId;
  rendererVersion: string;
  sourceStructureId: string;
  /** 溯源：对应哪个 stable structure 的 hash（eval / 回填归因依据）。 */
  sourceStructureHash: string;
  format: RenderFormat;
  output: unknown;
  warnings: string[];
}

/** renderer 接口。加平台只新增实现，不改此契约。 */
export interface Renderer {
  id: RendererId;
  version: string;
  /** 该 renderer 是否支持此结构（如 image_prompt 需要 visual 模态）。 */
  supports(structure: Readonly<StructureDocument>): boolean;
  render(input: RendererInput): Promise<RenderArtifact>;
}

// ────────────────────────────────────────────────────────────────────────────
// structureHash —— 结构语义指纹（确定性、同步、无依赖）
// ────────────────────────────────────────────────────────────────────────────

/**
 * 生成结构语义的确定性规范串：
 *   vocabVersion | prototypeKey | 排序后的 modalityStack | 顺序保留的 slots(key:strategy)
 * 只吃 machine_key，不吃 human label / 正文；pending_decisions 不进 hash（它们是过程态，非结构定稿）。
 */
function canonicalStructureString(s: Readonly<StructureDocument>): string {
  const modalities = [...s.modalityStack].sort().join(",");
  const slots = s.slots.map((slot) => `${slot.key}:${slot.strategyKey ?? ""}`).join(">");
  return [s.vocabVersion, s.prototypeKey, modalities, slots].join("|");
}

/** FNV-1a 32-bit（确定性、同步、无外部依赖），返回 8 位十六进制。 */
function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

/** 结构语义指纹。相同语义 → 相同 hash；供 stable structure 落库 + artifact 溯源。 */
export function structureHash(s: Readonly<StructureDocument>): string {
  return fnv1a(canonicalStructureString(s));
}

// ────────────────────────────────────────────────────────────────────────────
// golden-test harness 骨架（M2-08 每个 renderer 接入；空/stub renderer 也能跑通契约）
// ────────────────────────────────────────────────────────────────────────────

/** golden 覆盖报告。 */
export interface GoldenCoverageReport {
  rendererId: RendererId;
  /** artifact.sourceStructureHash 是否等于结构的 structureHash（溯源契约）。 */
  hashMatches: boolean;
  /** 结构里的 slot 是否都在产物里被覆盖（M2-08 用 renderer 的 slotCoverage 回报）。 */
  missingSlots: string[];
  passed: boolean;
  warnings: string[];
}

/**
 * 契约级 golden 检查：跑 renderer，验证
 *   ① 产物 sourceStructureHash 与结构 hash 一致（不许偷改结构）；
 *   ② 必填 slot 全覆盖（覆盖信息由 coverageOf 从产物提取，M2-08 各 renderer 提供）。
 * 这是骨架：真实文本级 golden 断言在 M2-08 各 renderer 落地。
 */
export async function runGoldenCoverage(
  renderer: Renderer,
  input: RendererInput,
  requiredSlotKeys: readonly string[],
  coverageOf: (artifact: RenderArtifact) => readonly string[],
): Promise<GoldenCoverageReport> {
  const expectedHash = structureHash(input.structure);
  const artifact = await renderer.render(input);
  const covered = new Set(coverageOf(artifact));
  const missingSlots = requiredSlotKeys.filter((k) => !covered.has(k));
  const hashMatches = artifact.sourceStructureHash === expectedHash;
  return {
    rendererId: renderer.id,
    hashMatches,
    missingSlots,
    passed: hashMatches && missingSlots.length === 0,
    warnings: artifact.warnings,
  };
}
