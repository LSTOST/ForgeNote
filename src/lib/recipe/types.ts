// ForgeNote M2-10 — RecipeSchema 域类型（Recipe = Structure Schema，禁存正文）。
//
// 依据：CODEX-REVIEW.md §"M2 架构基线"、migration 0003（recipe_schemas）、方向文档 v3.16。
// Recipe 只保存"内容生产方法"：原型 + 结构骨架(machine_key) + 输出策略 + 表现信号引用。
// 铁律：不含任何正文 / 成稿 / 完整文章。正文属于 render_artifacts / Content Asset。

import type { ModalityStack } from "@/lib/structure/types";

/** 结构骨架的一条：slot + 选中的 strategy（都是 machine_key）。 */
export interface SlotSchemaEntry {
  slotKey: string;
  strategyKey: string;
}

/** 输出策略（短机器提示，非正文）：默认平台、语气、长度习惯等。 */
export interface RendererPolicy {
  defaultRenderer?: string;
  tone?: string;
  lengthHint?: string;
  /** 其他短提示（值必须短，运行时会剥离疑似正文）。 */
  hints?: Record<string, string>;
}

/** 表现信号引用（只存引用，原始表现记录留 performance_records）。 */
export interface PerformanceSignalRef {
  ref: string;
  kind?: string;
}

/** 结构配方（应用层，镜像 recipe_schemas 行；刻意不含任何正文字段）。 */
export interface RecipeSchema {
  name: string;
  vocabVersion: string;
  prototypeKey: string;
  modalityStack: ModalityStack;
  slotSchema: SlotSchemaEntry[];
  rendererPolicy: RendererPolicy;
  performanceSignalRefs: PerformanceSignalRef[];
}
