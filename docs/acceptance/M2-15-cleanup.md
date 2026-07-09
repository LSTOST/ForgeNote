# M2-15 旧路径与旧 copy 清理 — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: M2-15 清理旧 /recipes、旧 eval/metrics、旧 copy
未触及: Owner 浏览器路径验收；旧 DB 表 drop（roadmap 明确另票）

## 实现验收

- [x] 旧 `/forge` 运行时页面/API/组件路径不存在。
- [x] 旧 `/recipes` 运行时页面/API/组件路径不存在。
- [x] 旧 `/api/render` route 不存在，避免继续走 M1 render path。
- [x] `package.json` 不再提供 `smoke:api` / `eval:forge` 旧脚本。
- [x] `src/lib/copy/*` 清理旧 `nav.forge` / `nav.recipes` / `forge` / `recipes` / `recipeDetail` / `recipePanel` 文案树。
- [x] `lib/recipe` domain core 保留，原因是 M2-10 仍复用 RecipeSchema 保存/换输入能力。
- [x] 新增 `npm run check:m2-cleanup`，把旧路径、旧脚本、旧 copy 作为可重复验证项。

## 自动验证

- [x] npm run check:m2-cleanup -> 通过
- [x] npm run lint -> 通过
- [x] npm run typecheck -> 通过
- [x] npm run doctor -> 通过
- [x] npm run build -> 通过
- [x] npm run progress -> 通过，无 drift warning

## Owner 浏览器验收

未执行。待 Owner 用真实浏览器确认旧 `/forge`、`/recipes`、`/api/render` 不再作为产品入口使用，并确认 `/workspace` 为唯一工作台路径。

## 残余风险

- 旧 DB 表 drop 未执行，按 M2-15 done 标准标注为另票；本票只保证运行时代码停写。
- `intentTypes.content_package` 仍保留，因为 `/profile` 偏好设置和 API 契约仍在使用该历史枚举；贸然删除会破坏现有用户偏好。
