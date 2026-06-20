// ForgeNote M1 共享常量。
// 来源：PRD §10.5（输入上限 8000）、UIUX §4.1/§5.3/§5.4。

export const PRODUCT_NAME = "ForgeNote 内容锻造台";
export const SLOGAN = "把模糊想法，锻造成可发布内容";

/** 单次想法输入上限（PRD §10.5）。 */
export const MAX_INPUT_CHARS = 8000;

/** Forge 输入框占位文案（UIUX §5.3）。 */
export const IDEA_PLACEHOLDER =
  "写下你的模糊想法，比如：想做一组第一次独居备用金清单的小红书卡片";

/** 默认示例想法（UIUX §5.4）。点击后填入输入框，不自动生成。 */
export const EXAMPLE_IDEAS = [
  "想做一组小红书卡片，主题是第一次独居备用金清单",
  "昆明树景房今天出太阳了，帮我写一篇小红书",
  "帮我把这个生活经验做成可收藏的图文笔记",
] as const;
