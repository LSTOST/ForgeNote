# M2-13 ChatGPT Baseline Eval Harness — 验收证据

结论: Conditional Pass
日期: 2026-07-09
验收人: Codex (Tech Lead + QA Agent)
范围: Gate 1 baseline eval harness 骨架
未触及: 真实 ChatGPT 输出、ForgeNote 输出采样、外部评委盲测、Owner 发布后追踪

## 实现验收部分

- [x] 固定材料包已建立：`eval/baseline/cases/owner-gate0-week.json`，包含账号 profile、10 条 recent posts、表现 notes、领域观察。
- [x] 强 baseline prompt 已建立：`eval/baseline/prompts/chatgpt-baseline-v1.md`，要求 5 张选题卡、whyNow、whyThisAccount、evidence、suggestedStructure、firstPlatform、risk。
- [x] A/B 匿名格式已建立：`eval/baseline/templates/blinded-pair.json`，展示层隐藏 ForgeNote / ChatGPT / OpenRouter / 模型名。
- [x] judgment record 模板已建立：`eval/baseline/templates/judgment-record.json`，覆盖本周是否想做、是否懂账号、依据可信度、结构可展开度、forced choice、后续发布/回填。
- [x] README 明确 eval 目的：评选题卡和结构质量，不评“文案漂亮”。
- [x] 新增 `npm run check:baseline-eval`，用 Node 校验材料包、prompt、匿名模板和 judgment 模板。

## 自动验证部分

- [x] `npm run check:baseline-eval` -> 通过

## Owner / Gate 1 验收

未执行。后续真实评测需要：

1. 用同一材料包分别产出 ForgeNote 与 ChatGPT baseline 的 5 张卡。
2. 写入匿名 A/B pair，记录 randomization seed。
3. Owner 或外部评委逐卡评分并 forced choice。
4. 记录是否真的发布、是否回填表现。
5. Gate 1 再统计 ForgeNote 胜率与跨语言分层结果。

## 残余风险

- 当前只是 harness，不证明 ForgeNote 赢 baseline。
- Owner 自评不能当严格盲测证据，只能作为 Gate 0 决策日志。
- baseline prompt 会随模型能力变化过期，需要版本化维护。
