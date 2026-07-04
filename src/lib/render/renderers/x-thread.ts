// ForgeNote M2-08 — X thread renderer。
// 每个叙事 slot → 一条推文，按叙事顺序成串。format=thread。narrative 基座即可，不需 visual。

import type { Renderer, RenderPlan, RendererFill, RendererInput } from "@/lib/render/contract";
import type { StructureDocument } from "@/lib/structure/types";
import { NARRATIVE_ORDER, defaultFill, presentSlotsInOrder, runRender } from "./shared";

const ID = "x_thread" as const;
const VERSION = "0.1.0";

/** 纯计划：每个存在的叙事 slot → 一条 tweet。 */
export function planXThread(structure: Readonly<StructureDocument>): RenderPlan {
  const slots = presentSlotsInOrder(structure, NARRATIVE_ORDER);
  return {
    format: "thread",
    units: slots.map((k) => ({ role: "tweet", slotKeys: [k] })),
  };
}

export function createXThreadRenderer(fill: RendererFill = defaultFill): Renderer {
  return {
    id: ID,
    version: VERSION,
    supports: (structure) => structure.modalityStack.includes("narrative"),
    render: (input: RendererInput) =>
      runRender({ rendererId: ID, rendererVersion: VERSION, input, plan: planXThread(input.structure), platformNote: "X（Twitter）thread", fill }),
  };
}
