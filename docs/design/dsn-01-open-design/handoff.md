# DSN-01 Open Design Handoff

## 原型入口

- Local prototype: `docs/design/dsn-01-open-design/prototype.html`
- Open Design cloud project: `https://od.kyx123.com/projects/0fd280d5-bd40-4738-860e-849cef731331/conversations/6f57df22-49b6-4bb1-8616-6c48a724eb1f/files/response-3.html`
- Source artifact used: `response-3.html`

## POC 结论

- Verdict: Conditional Pass
- 使用模型 / 费用路径: Open Design UI displayed `OpenAI API`; project baseline is OpenRouter BYOK with `deepseek/deepseek-chat`. Codex did not inspect or handle API keys.
- 主要问题: Core onboarding path is usable after retries; workspace terminal reference remains weak and should not be treated as final layout. Fourth workspace-only fix attempt failed with `network error`, so `response-3.html` is the accepted artifact.

## 覆盖状态

- 输入态: Present. Warm app shell, top autosave, quiet left nav, large input, one primary CTA.
- 理解中: Present. Skeleton state appears after submit.
- 方案态（有账号上下文）: Present through the paste-prior-post path; labels imply account context.
- 方案态（无账号上下文）: Present and complete after the no-context submit path; no longer collapses to only a hint.
- 理解失败 / 重试: Present through light test link `模拟失败`.
- 已改若干项: Present. Editing one tag updates value and changes count to `已确认 1/3`.
- 工作台终态示意: Present, but low confidence. It communicates future zones, but layout polish is not enough for implementation.

## 核心交互

- 可编辑标签: `受众` / `内容形式` / `表达角度`, each as inline chip with `改`.
- 依据展开: Prototype mostly expresses rationale conceptually, not as a robust disclosure UI. I-20 must design/implement this deliberately.
- 置信度提示: Handoff-level concept is retained; prototype UI under-expresses high/inferred/unsure.
- 跳过 / 直接生成: Removed. Forward action is one `生成内容方案 →`; default text says unchanged assumptions continue.
- 贴过往帖入口: Present as `想更准？贴一条你发过的帖`.

## 数据锚点

- `rationale`: Required per assumption. Source can be current idea and optional prior post.
- `confidence`: Required per assumption. Allowed values: `high`, `inferred`, `unsure`.
- `account_post`: Optional request field for one pasted prior post during cold start.

## 与现有 `/forge` 的差异

- 保留: Protected forge flow, idea input, generate CTA, assumptions-before-generation concept.
- 替换: Current form-like assumption panel becomes inline account-level direction chips with rationale/confidence.
- 新增: App shell budget, autosave draft indicator, prior-post cold start entry, no-context and with-context scheme states, lightweight failure recovery.
- 延后: Full workbench layout, real account asset panel, recipe/history/performance surfaces, content result redesign.

## 明确不进入实现票

- Open Design generated HTML/CSS/JS.
- Any generated business logic, auth, persistence, API, schema, or routing assumptions.
- Workspace terminal layout as final UI.
- Visual card/image rendering.
- Content result area redesign.

## I-20 候选范围

- Implement onboarding-first `/forge` shell and state machine.
- Add optional `account_post` to request typing and generation input.
- Extend model output assumptions with `rationale` and `confidence`.
- Replace assumption editor UI with inline direction chips, popover edits, count feedback, and rationale disclosure.
- Add autosave draft behavior for idea and optional prior post.
