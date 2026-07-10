# M2-14 Gate 0 验收包 — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: Gate 0 每周真实路径模板、四周总结模板、证据归档索引
未触及: Owner 连续四周真实路径执行

## 实现验收部分

- [x] `docs/gate0/week-template.md` 定义每周真实路径验收模板。
- [x] 周模板覆盖 `/radar`、`/workspace`、派生、复制/发布、`/api/performance/fill`、`/gate0`。
- [x] 周模板记录 ChatGPT fallback 次数、原因和 Owner 主观判断。
- [x] 周模板记录“验证/推翻了什么账号规律”。
- [x] `docs/gate0/four-week-summary.md` 定义四周汇总与 Gate 0 判定。
- [x] `docs/gate0/evidence-index.md` 定义证据文件命名和禁止事项。
- [x] 新增 `npm run check:gate0-pack`。

## 自动验证部分

- [x] `npm run check:gate0-pack` -> 通过

## Owner 验收

未执行。真正 accepted 需要：

1. 连续四周产生 `docs/acceptance/gate0-week-1.md` 到 `gate0-week-4.md`。
2. 每周至少一条真实内容任务。
3. 每周记录是否发布、是否回填、是否逃回 ChatGPT。
4. 四周后填写 `gate0-four-week-summary.md`。

## 残余风险

- 当前只是验收包模板，不代表 Gate 0 已过。
- 如果 Owner 不按周填写 evidence，后续 `accepted` 仍无依据。
