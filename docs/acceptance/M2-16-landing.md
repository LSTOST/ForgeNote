# M2-16 官网落地页 — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: `/` 官网首页、`/pricing`、`/blog`、`/docs` 骨架、营销导航与 CTA
未触及: Preview / Production 浏览器视觉验收、真实转化路径数据

## 实现验收部分

- [x] 根路由 `/` 已由官网首页替代旧 `redirect("/forge")`。
- [x] 首页文案使用 M2/v3 定位：内容结构生成系统，不写成通用 AI 写作工具。
- [x] 首页 CTA 指向 `/login`，没有指向旧 `/forge`。
- [x] `SiteNav` 登录与主 CTA 指向 `/login`。
- [x] `SiteFooter` 产品链接不包含 `/forge`。
- [x] `/pricing` 已实现公测免费 + 正式定价预告；组件注释明确无计费系统，两档 CTA 都指注册。
- [x] `/blog` 为诚实占位，不伪造文章列表，CTA 指向 `/login`。
- [x] `/docs` 为诚实占位，列出即将上线主题，不放空链接。
- [x] 产品展示 `WorkspacePreview` 为静态 mock，并标注只演示已存在产品形态。

## 自动验证部分

- [x] `npm run lint` -> 通过
- [x] `npm run typecheck` -> 通过
- [x] `npm run build` -> 通过，route list 包含 `/` `/pricing` `/blog` `/docs`
- [x] `npm run doctor` -> 通过，0 failed / 0 warnings
- [x] `rg` 检查营销页 CTA / 越界词 -> 未发现 `/forge` CTA、billing/Stripe/team/auto-publish 等越界承诺

## Owner 浏览器验收

未执行，待 Owner 在 Preview 或 Production 确认：

1. `/` 首屏品牌定位是否足够清楚
2. 移动端导航可用
3. Pricing 文案不会误导用户以为已经有计费系统
4. Blog / Docs 占位是否符合当前阶段
5. 所有 CTA 点击后进入 `/login`

## 残余风险

- 未做真实浏览器截图和移动端视觉验收。
- 未验证线上部署后的 Google Fonts、缓存、SEO metadata 实际表现。
- 未接入转化数据；本票只能证明页面代码与文案边界，不证明获客有效。
