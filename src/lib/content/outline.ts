// ForgeNote M2-09 Step 1 — 内容提纲 + 形态（确定性、纯函数、可客户端引入）。
//
// 从 main-content.ts 拆出：这些不调模型、不依赖服务端，供客户端中区在「生成主内容前」
// 即时展示人类可读的内容方向 + 提纲（Stage A）。generateMainContent（含 LLM/fill）留在 main-content.ts。

import { getLabel } from "@/lib/structure/registry";
import { NARRATIVE_ORDER, presentSlotsInOrder } from "@/lib/render/slot-order";
import type { StructureDocument } from "@/lib/structure/types";

/** 主内容形态（由模态决定，用户不直接选）：叙事→连贯正文 / 视觉→卡片流 / 时间→脚本节拍。 */
export type MainContentForm = "prose" | "cards" | "script";

/** 提纲的一条（人类可读，确定性从结构派生，无需模型）。 */
export interface OutlinePoint {
  slotKey: string;
  label: string;
  strategyLabel: string | null;
}

/** 内容方向 + 提纲（Stage A：生成主内容前，中区先展示的人类可读计划；确定性、零模型成本）。 */
export interface ContentOutline {
  /** 人类可读的内容方向（原型 + 模态，自然语言）。 */
  direction: string;
  points: OutlinePoint[];
}

/** 由模态推断主内容形态（视觉优先卡片，时间优先脚本，否则正文）。 */
export function mainContentForm(structure: Readonly<StructureDocument>): MainContentForm {
  if (structure.modalityStack.includes("visual")) return "cards";
  if (structure.modalityStack.includes("temporal")) return "script";
  return "prose";
}

/**
 * 确定性提纲（Stage A）：从结构 machine_key 映射为人类可读的方向 + 提纲点。
 * 不调模型——即时、免费、稳定；供「刚开始」的中区展示可读计划。
 */
export function buildOutline(structure: Readonly<StructureDocument>): ContentOutline {
  const direction = `${getLabel(structure.prototypeKey, "zh-Hans")} · ${structure.modalityStack
    .map((m) => getLabel(m, "zh-Hans"))
    .join(" + ")}`;
  const points = presentSlotsInOrder(structure, NARRATIVE_ORDER).map((key) => {
    const slot = structure.slots.find((s) => s.key === key);
    return {
      slotKey: key,
      label: getLabel(key, "zh-Hans"),
      strategyLabel: slot?.strategyKey ? getLabel(slot.strategyKey, "zh-Hans") : null,
    };
  });
  return { direction, points };
}
