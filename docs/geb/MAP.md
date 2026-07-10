# ForgeNote Code To Semantic Map

Use this file to choose the minimum context for a task.

## Account Intake

Code:
- `src/lib/account/**`
- `src/app/api/account/**`
- `src/components/account/**`
- `src/app/account/**`
- `src/app/first-run/**`
- `src/components/home/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/DATA-SCHEMA-M2.md` when persistence changes
- `docs/API-CONTRACT-M2.md` when API behavior changes

Validation:
- `npm run check:intake`
- `npm run lint`
- `npm run typecheck`

## Topic Radar

Code:
- `src/lib/radar/**`
- `src/app/radar/**`
- `src/components/radar/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/API-CONTRACT-M2.md` when API behavior changes

Validation:
- `npm run check:radar`
- `npm run lint`
- `npm run typecheck`

## Structure Engine

Code:
- `src/lib/structure/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/DATA-SCHEMA-M2.md` when token or structure types change

Validation:
- `npm run check:structure`
- `npm run lint`
- `npm run typecheck`

## Main Content Pipeline

Code:
- `src/lib/content/**`
- `src/app/api/content/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/API-CONTRACT-M2.md` when endpoints change
- `docs/DATA-SCHEMA-M2.md` when saved shapes change

Validation:
- `npm run check:main-content`
- `npm run check:derive`
- `npm run lint`
- `npm run typecheck`

## Renderers

Code:
- `src/lib/render/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/API-CONTRACT-M2.md` when renderer output contracts change

Validation:
- `npm run check:renderers`
- `npm run lint`
- `npm run typecheck`

## Recipe Schema

Code:
- `src/lib/recipe/**`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/DATA-SCHEMA-M2.md`

Validation:
- `npm run check:recipe`
- `npm run lint`
- `npm run typecheck`

## Workspace UI

Code:
- `src/app/workspace/**`
- `src/components/workspace/**`

Semantic docs:
- `docs/UIUX-M2.md`
- `docs/PRD-M2.md` when behavior changes

Validation:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Auth And Profile

Code:
- `src/app/login/**`
- `src/components/auth/**`
- `src/app/auth/**`
- `src/app/profile/**`
- `src/components/profile/**`
- `src/lib/auth/**`
- `src/lib/supabase/**`

Semantic docs:
- `docs/API-CONTRACT-M2.md` when route behavior changes
- `docs/UIUX-M2.md` when user flow changes

Validation:
- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Gate 0 And Evaluation

Code:
- `src/app/gate0/**`
- `src/app/api/gate0/**`
- `eval/**`
- `scripts/check-gate0*.mjs`
- `scripts/check-baseline-eval.mjs`

Semantic docs:
- `docs/PRD-M2.md`
- `docs/OPERATING-MODEL.md` when acceptance rules change

Validation:
- `npm run check:gate0`
- `npm run check:gate0-pack`
- `npm run check:baseline-eval`
