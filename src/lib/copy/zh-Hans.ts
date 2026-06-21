// ForgeNote M1 — I-17 UI copy 资源（zh-Hans，**规范源**）。
//
// 设计：
//   - 本文件是 copy 的**唯一规范结构**与默认语言；值为当前线上中文文案，逐字迁移、不改产品含义。
//   - `Copy = typeof zhHans`（不使用 `as const`，值类型收敛为 string）→ `en` 必须实现同一组 key，
//     从而在编译期保证两套 copy **key 不漂移**（缺 key / 多 key / 改 key 都会类型报错）。
//   - 这是 scaffold：不引入 i18n 运行时 / 不做语言切换 / 默认仍 zh-Hans，行为不变。
//   - 已在 `constants.ts` 集中的产品级文案（PRODUCT_NAME / SLOGAN / POSITIONING / 示例想法等）
//     不在此重复，避免双源漂移；本资源覆盖其余稳定 UI 文案。

export const zhHans = {
  nav: {
    forge: "Forge",
    recipes: "配方库",
    profile: "偏好",
    signOut: "退出",
    signOutTitle: "退出登录",
  },
  login: {
    googleButton: "使用 Google 登录",
    emailDivider: "或使用邮箱",
    sendMagicLink: "发送登录链接",
    sending: "发送中…",
    footerNote: "登录后可保存配方和偏好。",
  },
  forge: {
    outputLocaleLabel: "输出语言 / 表达偏好",
    optionalSuffix: "（可选）",
  },
  recipes: {
    title: "配方库",
    description: "查看、搜索、筛选和删除已保存的内容配方。",
    newRecipe: "新建配方",
  },
  recipeDetail: {
    backToLibrary: "返回配方库",
    fieldsTitle: "配方字段",
    rerunTitle: "换输入重跑",
  },
  profile: {
    title: "偏好",
    description:
      "记住你常用的内容假设（受众、语气、视觉风格等）。下次在 Forge 生成时会自动作为假设带出，可随时编辑或删除。",
  },
  outcome: {
    positioning: "内容定位",
    titles: "标题备选",
    body: "发布正文",
    cardStructure: "卡片结构",
    cardPrompts: "卡片 Prompt",
    hashtags: "发布话题",
    commentGuide: "评论区引导",
    emptyTitle: "生成结果会出现在这里",
  },
  recipePanel: {
    emptyTitle: "内容配方会出现在这里",
  },
  assumptions: {
    title: "内容假设",
    regenerate: "应用修改并重新生成",
  },
};

/** copy 的规范结构（key 固定、值为 string）。`en` 必须实现同一组 key。 */
export type Copy = typeof zhHans;
