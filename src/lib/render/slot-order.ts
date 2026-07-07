// ForgeNote — 叙事 slot 规范顺序（纯函数，无服务端依赖，可客户端引入）。
//
// 从 renderers/shared.ts 抽出：shared.ts 含 defaultFill 的动态 import openrouter-client（server-only），
// 客户端组件（如中区提纲）只需要顺序逻辑，不该被 server-only 传染。故独立成纯模块。

import type { StructureDocument } from "@/lib/structure/types";

/** 叙事 slot 的规范顺序（决定正文段落 / thread / 卡片的排列）。 */
export const NARRATIVE_ORDER = ["hook", "context", "evidence", "insight", "resolution"] as const;

/** 结构中实际存在的、按规范顺序排列的 slot key。 */
export function presentSlotsInOrder(
  structure: Readonly<StructureDocument>,
  order: readonly string[],
): string[] {
  const have = new Set(structure.slots.map((s) => s.key));
  return order.filter((k) => have.has(k));
}
