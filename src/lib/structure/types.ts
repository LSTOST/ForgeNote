// ForgeNote M2-03 — Structure 层共享类型（应用层镜像 DB 的 structure_documents jsonb 形状）。
//
// 依据：CODEX-REVIEW.md §3/§4、migration 0003_structure_core.sql、方向文档 v3.16 §2。
// 纯 TS：仅类型 + 纯函数，不引用 Next / Supabase / 浏览器 API。
// 原则：结构只存 machine_key（registry），不存 human label、不存正文。

import type { TokenKind } from "./registry";

/** 表达模态 key（对齐 registry modality）。M1 只用 narrative / visual；temporal 保留但 disabled。 */
export type ModalityKey = "narrative" | "visual" | "temporal";

/** 模态栈：叙事为基座，视觉/时间为叠加层（如 ["narrative"] 或 ["narrative","visual"]）。 */
export type ModalityStack = readonly ModalityKey[];

/** 结构槽位实例：只记 machine_key（slot + 选中的 strategy），不含正文。 */
export interface StructureSlot {
  /** slot machine_key（registry slot，如 hook / context）。 */
  key: string;
  /** 选中的 strategy machine_key（registry strategy，如 loss_open）；未定义=待定。 */
  strategyKey?: string;
}

/** 待决策生命周期（CODEX §3）。 */
export type PendingDecisionStatus =
  | "detected"
  | "defaulted"
  | "accepted_default"
  | "user_resolved"
  | "dismissed_as_optional"
  | "locked_for_render";

/** 待决策：AI 拿不准、需要用户或默认裁决的结构级选择。 */
export interface PendingDecision {
  /** 决策 key（如 context.granularity）。 */
  key: string;
  status: PendingDecisionStatus;
  /** 是否阻塞渲染（只有影响真实性/平台适配/结构完整性的才 required）。 */
  required: boolean;
  /** 候选项（machine_key，如 ["exact","vague"]）。 */
  options?: readonly string[];
  /** 已解析值（machine_key）；用了默认时同时标注。 */
  resolvedValue?: string;
  usedDefault?: boolean;
}

/** 结构稳定性（CODEX §3）。 */
export type StabilityStatus = "unstable" | "stable";

/** 结构文档：右栏结构控制的事实源，也是 renderer 的只读输入。 */
export interface StructureDocument {
  id: string;
  taskId: string;
  /** registry 词表版本（machine_key 稳定性锚点）。 */
  vocabVersion: string;
  prototypeKey: string;
  modalityStack: ModalityStack;
  slots: readonly StructureSlot[];
  pendingDecisions: readonly PendingDecision[];
  stabilityStatus: StabilityStatus;
  /** stable 时生成；render artifact 记录该 hash 溯源。unstable 时可为 undefined。 */
  structureHash?: string;
}

/** token 引用（machine_key + 类别），用于把结构里散落的 key 交给 registry 校验。 */
export interface TokenRef {
  key: string;
  kind: TokenKind;
}
