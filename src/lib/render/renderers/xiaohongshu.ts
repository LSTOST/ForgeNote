// ForgeNote M2-08 — 小红书图文 renderer。
// hook→封面；context/evidence/insight→拆解卡；resolution→总结卡。visual+layout 时布局进覆盖。
// format=carousel_copy。narrative 基座即可（visual 可选，用于分页节奏）。

import type { Renderer, RenderPlan, RendererFill, RendererInput, RenderUnit } from "@/lib/render/contract";
import type { StructureDocument } from "@/lib/structure/types";
import { defaultFill, presentSlotsInOrder, runRender } from "./shared";

const ID = "xiaohongshu" as const;
const VERSION = "0.1.0";

const CARD_SLOTS = ["context", "evidence", "insight"] as const;

/** 纯计划：封面(hook) + 拆解卡(context/evidence/insight) + 总结(resolution)；有 visual 则纳入 layout。 */
export function planXiaohongshu(structure: Readonly<StructureDocument>): RenderPlan {
  const have = new Set(structure.slots.map((s) => s.key));
  const units: RenderUnit[] = [];

  if (have.has("hook")) units.push({ role: "cover", slotKeys: ["hook"] });
  for (const k of presentSlotsInOrder(structure, CARD_SLOTS)) units.push({ role: "card", slotKeys: [k] });
  if (have.has("resolution")) units.push({ role: "summary", slotKeys: ["resolution"] });

  // 视觉模态：布局参与渲染（分页节奏），slot 覆盖纳入 layout（不丢）。
  if (structure.modalityStack.includes("visual") && have.has("layout")) {
    units.push({ role: "layout_note", slotKeys: ["layout"] });
  }

  return { format: "carousel_copy", units };
}

export function createXiaohongshuRenderer(fill: RendererFill = defaultFill): Renderer {
  return {
    id: ID,
    version: VERSION,
    supports: (structure) => structure.modalityStack.includes("narrative"),
    render: (input: RendererInput) =>
      runRender({ rendererId: ID, rendererVersion: VERSION, input, plan: planXiaohongshu(input.structure), platformNote: "小红书图文", fill }),
  };
}
