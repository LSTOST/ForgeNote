// ForgeNote M1 — I-17 UI copy 资源（en，scaffold）。
// 与 zh-Hans 同一组 key（`Copy` 类型在编译期强制一致）。英文为合理 scaffold，未做产品级润色。
// 当前默认语言为 zh-Hans；本文件仅作脚手架，不在运行时启用（无语言切换）。

import type { Copy } from "./zh-Hans";

export const en: Copy = {
  nav: {
    forge: "Forge",
    recipes: "Recipes",
    profile: "Preferences",
    signOut: "Sign out",
    signOutTitle: "Sign out",
  },
  login: {
    googleButton: "Continue with Google",
    emailDivider: "or use email",
    sendMagicLink: "Send login link",
    sending: "Sending…",
    footerNote: "Sign in to save recipes and preferences.",
  },
  forge: {
    outputLocaleLabel: "Output language / tone",
    optionalSuffix: " (optional)",
  },
  recipes: {
    title: "Recipes",
    description: "Browse, search, filter, and delete your saved content recipes.",
    newRecipe: "New recipe",
  },
  recipeDetail: {
    backToLibrary: "Back to recipes",
    fieldsTitle: "Recipe fields",
    rerunTitle: "Rerun with new input",
  },
  profile: {
    title: "Preferences",
    description:
      "Remember the content assumptions you use often (audience, tone, visual style, etc.). They are carried into the next Forge generation as assumptions, and you can edit or delete them anytime.",
  },
  outcome: {
    positioning: "Positioning",
    titles: "Title options",
    body: "Body",
    cardStructure: "Card structure",
    cardPrompts: "Card prompts",
    hashtags: "Hashtags",
    commentGuide: "Comment prompt",
    emptyTitle: "Your generated result will appear here",
  },
  recipePanel: {
    emptyTitle: "Your content recipe will appear here",
  },
  assumptions: {
    title: "Assumptions",
    regenerate: "Apply changes and regenerate",
  },
};
