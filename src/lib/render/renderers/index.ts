// ForgeNote M2-08 — M1 三个 renderer 的登记表。加平台=在此新增一行 + 新模块。

import type { Renderer, RendererId } from "@/lib/render/contract";
import { createXThreadRenderer } from "./x-thread";
import { createXiaohongshuRenderer } from "./xiaohongshu";
import { createImagePromptRenderer } from "./image-prompt";

export { planXThread } from "./x-thread";
export { planXiaohongshu } from "./xiaohongshu";
export { planImagePrompt } from "./image-prompt";
export { artifactCoverage } from "./shared";
export { createXThreadRenderer, createXiaohongshuRenderer, createImagePromptRenderer };

/** 默认 renderer（走真实模型）。M1 三个。 */
export const M1_RENDERERS: Record<RendererId, Renderer> = {
  x_thread: createXThreadRenderer(),
  xiaohongshu: createXiaohongshuRenderer(),
  image_prompt: createImagePromptRenderer(),
};

/** 取某 renderer（M1 范围内）。 */
export function getRenderer(id: RendererId): Renderer {
  return M1_RENDERERS[id];
}
