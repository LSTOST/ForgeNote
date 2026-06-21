// ForgeNote M1 共享常量。
// 来源：PRD §10.5（输入上限 8000）、UIUX §4.1/§5.3/§5.4。

// I-15（v5 选择性折叠）：产品表述从“只做小红书”收敛为通用的“图文卡片 / carousel 内容工作台”，
// 保留小红书为适用场景之一（additive，不推翻 v4 小红书实现，不改 content_package / 生成链路）。
export const PRODUCT_NAME = "ForgeNote 图文卡片内容工作台";
export const SLOGAN = "把模糊想法，锻造成可发布的图文卡片内容包";

/**
 * 一句话定位（UIUX §4.1 / §5.1）。点明 carousel 与适用平台场景，并诚实声明 M1 边界。
 * 小红书 / Instagram carousel / LinkedIn carousel 均为示例场景，不暗示已支持多语言生成或自动发布。
 */
export const POSITIONING =
  "为图文笔记、carousel、卡片 Prompt 与发布文案沉淀可复用配方；小红书 / Instagram carousel / LinkedIn carousel 都是适用场景。M1 仍以图文卡片和发布文案为主，不做自动发布。";

/** 单次想法输入上限（PRD §10.5）。 */
export const MAX_INPUT_CHARS = 8000;

/** I-16：输出语言 / 表达偏好的最大长度（自由文本防滥用，不是 enum、不与国家/平台绑定）。 */
export const MAX_OUTPUT_LOCALE_CHARS = 120;

/** I-16：归一化 outputLocale —— trim；空串视为 null。长度上限由各 route 的 schema 校验。 */
export function normalizeOutputLocale(
  value: string | null | undefined,
): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/** Forge 输入框占位文案（UIUX §5.3）。 */
export const IDEA_PLACEHOLDER =
  "写下你的模糊想法，比如：想做一组讲第一次独居备用金清单的图文卡片";

/**
 * 默认示例想法（UIUX §5.4）。点击后填入输入框，不自动生成。
 * 保留一个小红书场景，并补充更通用 / 国际的 carousel 场景（I-15）。
 */
export const EXAMPLE_IDEAS = [
  "想做一组小红书卡片，主题是第一次独居备用金清单",
  "做一组 Instagram carousel，讲远程办公的 5 个时间管理习惯",
  "帮我把一条生活经验做成可收藏的图文卡片内容包",
] as const;
