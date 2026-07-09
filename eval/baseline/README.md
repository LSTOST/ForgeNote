# ChatGPT Baseline Eval Harness

M2-13 的目标不是现在跑真实盲测，而是把 Gate 1 会用到的评测骨架固定下来：

1. 固定材料包：账号 profile、最近内容、表现回填、领域观察。
2. 强 baseline prompt：给 ChatGPT 同样材料，要求输出 5 张选题卡 + 结构建议。
3. A/B 匿名格式：隐藏来源、模型名、产品名，只保留用户会看到的信息。
4. judgment record：逐卡记录“本周想不想做、是否懂账号、依据可信度、结构可展开度、forced choice、后续是否发布”。

硬边界：

- 不用弱 prompt 当靶子。
- 不评“文案漂亮”，只评选题卡和结构质量。
- 匿名展示层不得出现 ForgeNote / ChatGPT / OpenRouter / model name。
- judgment 可记录后续发布结果，但不能把正文原文塞进评测记录。

## 文件

- `cases/owner-gate0-week.json` — 固定材料包样例。
- `prompts/chatgpt-baseline-v1.md` — 强 baseline prompt。
- `templates/blinded-pair.json` — A/B 匿名输出格式。
- `templates/judgment-record.json` — 评分记录模板。

验证：`npm run check:baseline-eval`。
