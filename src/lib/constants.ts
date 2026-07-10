// ForgeNote M2 共享常量。
// 来源：PRD §10.5（输入上限 8000）、UIUX §4.1/§5.3/§5.4。

// M2：产品表述从“图文卡片内容包”收敛为“账号分析 + 内容框架 + 平台版本”的内容工作台。
export const PRODUCT_NAME = "ForgeNote 内容工作台";
export const SLOGAN = "基于账号分析，生成下一条内容的框架和平台版本";

/**
 * 一句话定位（UIUX §4.1 / §5.1）。点明 carousel 与适用平台场景，并诚实声明 M1 边界。
 * 小红书 / Instagram carousel / LinkedIn carousel 均为示例场景，不暗示已支持多语言生成或自动发布。
 */
export const POSITIONING =
  "ForgeNote 基于你的账号资料和近期内容，判断下一条做什么、为什么会成、发在哪儿。M2 不做自动发布。";

/** 单次想法输入上限（PRD §10.5）。 */
export const MAX_INPUT_CHARS = 8000;

/** I-16：输出语言 / 表达偏好的最大长度（自由文本防滥用，不是 enum、不与国家/平台绑定）。 */
export const MAX_OUTPUT_LOCALE_CHARS = 120;

/** DSN-01：可选过往帖冷启动输入上限。沿用主输入量级，避免复杂账号建模。 */
export const MAX_ACCOUNT_POST_CHARS = 8000;

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
  "写下你的想法，比如：第一次独居，厨房先买哪些东西才不浪费";

/**
 * 默认示例想法（UIUX §5.4）。点击后填入输入框，不自动生成。
 * 保留一个小红书场景，并补充更通用 / 国际的 carousel 场景（I-15）。
 */
export const EXAMPLE_IDEAS = [
  "第一次独居，厨房先买哪些东西才不浪费",
  "远程办公后，我真正保留下来的 5 个时间习惯",
  "把一条生活经验写成更容易收藏的内容",
] as const;
