# ForgeNote GEB Lite Context

Read this file before touching the project. Do not read the whole docs folder.

## Current System

ForgeNote is a content structure generation engine and single-task creation operating system for solo content creators.

Core loop:

```text
Account Intake -> Topic Radar -> Structure Generation -> Main Content -> Platform Derive -> Publish -> Feedback/Re-run
```

Current phase: M2, focused on the structural generation spine and `/workspace`.

## Truth Hierarchy

1. Running code and database migrations
2. Tests, checks, and validation scripts
3. `docs/roadmap/roadmap.json`
4. `docs/geb/MAP.md`
5. Mapped semantic docs under `docs/*-M2.md`
6. Acceptance evidence under `docs/acceptance/`

## Default Reading Budget

For a normal coding task, read only:

1. `AGENTS.md`
2. `docs/geb/CONTEXT.md`
3. `docs/geb/MAP.md`
4. The task card or user request
5. One mapped semantic document relevant to the touched code

Read `docs/OPERATING-MODEL.md` only when changing product behavior, gate status, or acceptance rules.

Read `docs/DECISIONS.md` only when a task touches a settled product or architecture decision.

## Never Read By Default

- `docs/archive/**`
- M1 docs
- design archives and screenshots
- `docs/acceptance/**`
- `docs/agent-runs/**`
- generated files such as `docs/roadmap/dashboard.html`

These are evidence, not default context.
