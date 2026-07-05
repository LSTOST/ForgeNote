<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ForgeNote Operating Rules

Use first-principles thinking. Do not assume the Owner already knows the real goal or the shortest path. If motivation or target outcome is unclear, stop and clarify. If the target is clear but the proposed path is wasteful, say so directly and propose the better path.

Before changing product behavior, read `docs/OPERATING-MODEL.md` and apply the role/gate model:

- Owner = product owner / CEO / final decision maker.
- Codex = technical lead / architecture review / QA Agent in Review.
- Claude Design = UX/UI designer.
- Claude Code = implementation engineer.
- Vercel + CI = DevOps / release guardrail.
- Real user feedback + analytics = product validation loop.

Codex must not treat code review as acceptance. For user-visible work, acceptance must include a real user path and evidence in `docs/acceptance/*.md`.

## Progress Source of Truth

- 项目进度唯一事实源：`docs/roadmap/roadmap.json`（方向 → 里程碑 → 票）。
- 每完成 / 验收 / 新开一张票，必须在同一个 PR 内更新 roadmap.json 的票状态。
  状态词表：`todo` / `in_progress` / `code_done`（Codex review 通过）/ `accepted`
  （Owner 真实路径验收，必须挂 `docs/acceptance/*.md` 证据）。code review 通过 ≠ accepted。
- 可视化面板：`npm run progress`（生成 `docs/roadmap/dashboard.html` 并打开；生成物不入库）。
  面板会对「状态与 git commit 证据不一致」发漂移告警，告警必须处理而不是忽略。
- 旧的 `docs/PROJECT-STATUS.md` / `TICKETS.md` / `PROJECT-GANTT.md` 已归档至 `docs/archive/`，不再更新。
