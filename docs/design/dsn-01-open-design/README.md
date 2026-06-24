# DSN-01 Open Design Artifacts

> 本目录存放 Open Design POC 产物。没有通过 Codex review 前，本目录里的 HTML/CSS/JS 只代表设计参考，不能进入 ForgeNote 源码。

## 必交付

- `open-design-prompt.md`：Open Design `web-prototype` 可复制 prompt；以 DSN-01 brief v3.1 为准，视觉走暖编辑风。
- `prototype.html` 或 `screenshots/`：Open Design 原型导出或关键状态截图。
- `handoff.md`：原型到实现票的交接说明。
- `codex-review.md`：Codex 对原型的可实现性 / 边界 review。

## 执行顺序

1. 在 Open Design 中使用 `web-prototype` skill。
2. BYOK 模型走 OpenRouter / `deepseek/deepseek-chat`；不要把 Gemini 作为阻塞项。
3. 粘贴 `open-design-prompt.md` 的「Open Design 复制用 Prompt」。
4. 导出原型 HTML 或截图。
5. 填写 `handoff.md`。
6. Codex 填写 `codex-review.md`。
7. 只有 review 至少为 Conditional Pass，才允许拆 I-20。

## 拆 I-20 前置条件

只有当 `codex-review.md` 结论为 Pass 或 Conditional Pass，才能拆后续实现票。Fail 时回退 Claude Design 或重做 Open Design POC。

## 当前 POC

- Accepted artifact: `prototype.html`（Open Design `response-3.html`）
- Review verdict: Conditional Pass
- I-20 allowed scope: onboarding-first `/forge` shell + account-level assumption chips only；工作台终态示意不进入实现。
- Implementation return path: I-20 已按允许范围落地并 Done，验收记录见 `../../acceptance/I-20.md`；ForgeNote runtime OpenRouter `401` 已通过恢复应用侧 key 解除。

## 参考

- Open Design 运行/费用/交付协议：`../OPEN-DESIGN-DSN-01-RUNBOOK.md`
- DSN-01 brief：`../DSN-01-brief.md`
