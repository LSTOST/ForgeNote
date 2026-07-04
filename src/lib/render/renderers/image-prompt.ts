// ForgeNote M2-08 — 图片 Prompt renderer（配图方向，不做媒体生成）。
// 需要 visual 模态：hook→封面图 prompt；visual_hierarchy→层级图；layout→分页配图。
// format=image_prompt。

import type { Renderer, RenderPlan, RendererFill, RendererInput, RenderUnit } from "@/lib/render/contract";
import type { StructureDocument } from "@/lib/structure/types";
import { defaultFill, runRender } from "./shared";

const ID = "image_prompt" as const;
const VERSION = "0.1.0";

/** 纯计划：封面图(hook) + 层级图(visual_hierarchy) + 分页配图(layout)。仅覆盖存在的 slot。 */
export function planImagePrompt(structure: Readonly<StructureDocument>): RenderPlan {
  const have = new Set(structure.slots.map((s) => s.key));
  const units: RenderUnit[] = [];
  if (have.has("hook")) units.push({ role: "cover_image", slotKeys: ["hook"] });
  if (have.has("visual_hierarchy")) units.push({ role: "hierarchy_image", slotKeys: ["visual_hierarchy"] });
  if (have.has("layout")) units.push({ role: "page_images", slotKeys: ["layout"] });
  return { format: "image_prompt", units };
}

export function createImagePromptRenderer(fill: RendererFill = defaultFill): Renderer {
  return {
    id: ID,
    version: VERSION,
    // 图片 prompt 需要视觉结构（对齐 stability RENDERER_REQUIRES.image_prompt = ["visual"]）。
    supports: (structure) => structure.modalityStack.includes("visual"),
    render: (input: RendererInput) =>
      runRender({ rendererId: ID, rendererVersion: VERSION, input, plan: planImagePrompt(input.structure), platformNote: "图片生成 Prompt（配图方向）", fill }),
  };
}
