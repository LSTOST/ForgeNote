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
