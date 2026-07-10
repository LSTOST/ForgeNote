<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# ForgeNote Agent Guide

## What ForgeNote Is

ForgeNote is a **content structure generation engine + single-task creation operating system** for solo content creators. The core promise is not "AI writes content for you" — it tells you **what to post next, why it will work, and where to post it**, based on your specific account data.

Current Slogan / Direction: "打开产品 60 秒内，它对你账号的判断比空白 ChatGPT 深一个量级."

## Current Phase

**M2 · 结构生成脊椎 + 工作台** (M1 is done, archived in `docs/archive/`).

Current Milestone: Build the structural generation spine and a 4-zone workspace where Owner can dogfood the full loop for 4 weeks (Gate 0).

## M2 Core Loop

```
Account Intake → Topic Radar → Structure Generation (stability check) → 
Main Content (editable) → Platform Derive → Publish → Feedback/Re-run
```

M2 Focus:
- Account intake (paste your account profile + recent posts)
- AI-powered account brain (readable, correctable)
- Weekly topic radar with evidence-based recommendations
- Structure generation with stability scoring
- Platform-agnostic main content (editable prose/cards/script)
- Multi-platform derive (Xiaohongshu, X/Thread, image prompts)
- Right-column human-readable controls (not raw token sliders)
- Account memory persistence

## M2 Architecture (Current Code)

| Layer | Location | Purpose |
|---|---|---|
| Account Intake | `src/lib/account/` | Paste profile → AI brain snapshot |
| Topic Radar | `src/lib/radar/` | Weekly topic cards with rationale |
| Structure Engine | `src/lib/structure/` | Generate structure, stability scoring |
| Content Pipeline | `src/lib/content/` | outline → main content → derive to platforms |
| Renderers | `src/lib/render/` | Platform-specific output formatters |
| Recipe/Schema | `src/lib/recipe/` | Save/replay content structures |
| Workspace UI | `src/app/workspace/`, `src/components/workspace/` | 4-zone editing workspace |
| Auth | Supabase SSR (email+password, Google OAuth) | `src/lib/supabase/` |

## Current Pages

| Route | Status | Purpose |
|---|---|---|
| `/` | Active | Landing page (marketing) |
| `/login` | Active | Email/password + Google OAuth |
| `/workspace` | Active (protected) | M2 4-zone content workspace (replaces old /forge) |
| `/radar` | Active (protected) | Topic radar |
| `/account` | Active (protected) | Account analysis / intake |
| `/profile` | Active (protected) | User preferences |
| `/first-run` | Active (protected) | Logged-in App Home |
| `/pricing` | Active | Marketing pricing page |
| `/blog` | Active | Marketing blog |
| `/docs` | Active | Marketing docs |

**Deleted/Archived:**
- `/forge` — replaced by `/workspace` (M2-04)
- `/recipes` — decommissioned (M2-15)

## GEB Lite Context Protocol

ForgeNote uses GEB Lite:
- Code is the machine-executable truth.
- Docs are the semantic map for AI agents.
- Code and mapped docs must stay synchronized when behavior changes.

Default reading before any task:
1. `AGENTS.md`
2. `docs/geb/CONTEXT.md`
3. `docs/geb/MAP.md`
4. The current task card or user request

Then read only the domain document mapped by `docs/geb/MAP.md`.

Do not read the whole docs folder. Do not read `docs/archive/**`, old M1 docs, design archives, acceptance evidence, or agent-run logs unless the task explicitly needs historical evidence.

## Rules

### Product Boundary (Do NOT expand without Owner decision)
- Do NOT add login methods beyond what exists
- Do NOT add billing/Stripe (M2 is free)
- Do NOT add team collaboration
- Do NOT add marketplace
- Do NOT add mobile app
- Do NOT add auto-publishing to platforms
- Do NOT add complex analytics dashboards
- Do NOT add multi-model routing
- Do NOT change the tech stack (Next.js 16 + React 19 + Supabase + Tailwind CSS 4 + OpenRouter)

### Document Sync Rules
- After changing behavior, update the mapped semantic document from `docs/geb/MAP.md`.
- After changing data structures, update `docs/DATA-SCHEMA-M2.md`.
- After changing API behavior, update `docs/API-CONTRACT-M2.md`.
- After UI/UX behavior or layout changes, update `docs/UIUX-M2.md`.
- After product scope changes, update `AGENTS.md` and the relevant M2 semantic document.
- After any ticket state change, update `docs/roadmap/roadmap.json`.
- Do not update archived M1 docs or deprecated status docs for current M2 work.
- All required doc updates must be in the same PR as the code change.

### Agent Execution Rules
- Use first-principles thinking: if motivation or goal is unclear, stop and clarify
- Before changing product behavior, read `docs/OPERATING-MODEL.md`
- Codex review ≠ Accepted. User-visible changes must include `docs/acceptance/*.md` evidence
- Keep changes small and ticket-sized
- Prefer explicit constraints over broad exploration
- Do NOT fabricate project state — write "Not verified" when unsure

## Progress Source of Truth

- 项目进度唯一事实源：`docs/roadmap/roadmap.json`（方向 → 里程碑 → 票）。
- 每完成 / 验收 / 新开一张票，必须在同一个 PR 内更新 roadmap.json 的票状态。
  状态词表：`todo` / `in_progress` / `code_done`（Codex review 通过）/ `accepted`
  （Owner 真实路径验收，必须挂 `docs/acceptance/*.md` 证据）。code review 通过 ≠ accepted。
- 可视化面板：`npm run progress`（生成 `docs/roadmap/dashboard.html` 并打开；生成物不入库）。
  面板会对「状态与 git commit 证据不一致」发漂移告警，告警必须处理而不是忽略。
- 旧的 `docs/PROJECT-STATUS.md` / `TICKETS.md` / `PROJECT-GANTT.md` 已归档至 `docs/archive/`，不再更新。

## Validation Commands

Before finishing any implementation task, run and ensure these pass:

| Command | Purpose |
|---|---|
| `npm run dev` | Start dev server |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type checking |
| `npm run build` | Production build |
| `npm run doctor` | Health check (checks structure, routes, components) |
| `npm run progress` | Progress dashboard (drift alerts) |

Domain-specific checks (run relevant ones per task):
- `npm run check:intake` — Account intake validation
- `npm run check:structure` — Structure engine validation
- `npm run check:renderers` — Renderer golden tests
- `npm run check:recipe` — Recipe schema validation
- `npm run check:radar` — Topic radar validation
- `npm run check:main-content` — Main content pipeline validation
- `npm run check:derive` — Platform derive validation

If a command does not exist, report it instead of inventing one.
