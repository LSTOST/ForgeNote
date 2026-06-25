# DSN-01 Codex Review

## 结论

- Verdict: Conditional Pass
- 是否允许拆 I-20: Yes, but only for onboarding-first input + account-level assumption chips. Do not implement workspace terminal layout from this prototype.
- 残余风险: Prototype needed multiple correction loops. It proves the interaction direction, not final visual quality or code quality.

## Gate 1: Product Intent

- 是否兑现「第一次就显得懂」: Mostly yes. The strongest part is the direction state: summary first, then three editable assumptions.
- 是否只服务 M1 主路径「模糊想法 → 内容」: Yes. No content library, publishing, calendar, or rewrite-existing-note path is introduced.
- 是否避免内容库 / 配方库 / 历史 / 表现回填过早出现: Yes in onboarding path. Workspace terminal reference mentions future zones only as low-fidelity reference.

## 可实现性

- UI 状态是否清楚: Core states are clear enough for I-20: input, thinking, no-context scheme, with-context scheme, edit popover, edited count, failure, result placeholder.
- 需要新增/修改的组件: Forge shell, idea/prior-post input, direction summary, assumption chips, assumption edit popover, rationale disclosure, failure/retry state.
- 需要新增/修改的 API: `POST /api/forge` request should accept optional `accountPost` / `account_post` after naming is settled.
- 需要新增/修改的类型: Assumption type needs `rationale` and `confidence: "high" | "inferred" | "unsure"`.
- 需要新增/修改的 prompt: Generation prompt must infer assumptions from current idea plus optional prior post and return rationale/confidence.
- 是否需要 migration: No obvious migration for DSN-01 itself. Autosave draft can start client-side/local; server persistence needs a separate decision if required.

## 边界检查

- 是否要求视觉渲染卡片: No.
- 是否重设计内容包: No, only a placeholder.
- 是否引入复杂账号建模: No, only one optional pasted prior post.
- 是否触碰配方 / 学习闭环 / 发布 / 日历 / 多账号: No.
- 是否暴露内部 taxonomy: Final accepted artifact no longer contains `小红书` or emoji nav. Implementation must still avoid `内容包 / 卡片 Prompt / M1 / schema / RLS` in user-facing UI.

## I-20 建议

- 票名: I-20 — Onboarding-first forge shell + account-level assumption chips
- 目标: Make first-run `/forge` feel like ForgeNote already understands the content direction, while preserving the existing generate pipeline.
- 范围内: App shell, draft autosave, optional prior post input, thinking state, scheme state, assumption chip edits, rationale/confidence display, no-context fallback, failure retry.
- 范围外: Result area redesign, workspace terminal layout, recipe/history/performance surfaces, visual rendering cards, automatic learning loop.
- 验收路径: New user enters vague idea → sees thinking state → sees complete scheme → edits one chip → count becomes `1/3` → proceeds to generate placeholder / existing result path.
- 验证命令: `npm run doctor`, `npm run lint`, `npm run typecheck`, `npm run build`; then browser QA for the affected `/forge` path.

## 不允许直接复用

Open Design generated HTML/CSS/JS does not enter ForgeNote source. Claude Code / Codex must rebuild inside the existing Next.js / Tailwind structure and respect current API/auth/RLS boundaries.
