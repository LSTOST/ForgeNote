# DSN-03 — Core UX Map + Design System Baseline

> Purpose: define ForgeNote's project-level UX map and design baseline before more implementation tickets.
> Owner decision: the project should stop using local fix tickets as the primary product driver.
> Codex role: define correctness, review the design artifact, and split implementation only after DSN-03 passes.

## Problem

ForgeNote has been moving through local fixes instead of a stable product experience model.

Evidence:

- `/login` has gone through many V-01-FIX rounds: auth method, copy, complexity, visual proportion, design fidelity, mode clarity.
- `/forge` first shipped as a vertical flow, then moved toward the left / center / right / bottom workbench.
- This is not mainly an engineering problem. It is a missing project-level UX / IA / design system baseline.

DSN-03 exists to stop that pattern.

## Goal

Create a project-level experience mother map for M1:

- core user paths
- information architecture
- state map
- design system baseline
- design debt triage
- implementation slices

After DSN-03, a new implementation ticket must cite the relevant path, state, and design-system rule.

## Non-Goals

- Do not write product code.
- Do not redesign the database, API, RLS, prompt, or generation contract.
- Do not create a marketing landing page.
- Do not add asset library, visual rendering, content calendar, auto-learning, Stripe, or runtime i18n.
- Do not treat this as a substitute for V-01 real-user validation.

## Design Inputs

Read these first:

- `docs/OPERATING-MODEL.md`
- `docs/ForgeNote_修订版方向.md`
- `docs/TICKETS.md`
- `docs/PROJECT-STATUS.md`
- `docs/acceptance/V-01.md`
- `docs/design/dsn-01-open-design/handoff.md`
- `docs/design/dsn-01-open-design/codex-review.md`
- `docs/design/dsn-02-login-auth/brief.md` if PR #24 is merged or available

Do not use untracked `原型图/` unless Owner explicitly asks to document those files.

## Required User Paths

Cover at least these M1 paths.

### Path 1: First Entry

```text
Anonymous visitor
→ login/register
→ email/password or Google
→ /forge
→ sees what to do next
```

Define:

- what the user sees first
- how login/register states relate to ForgeNote brand
- where auth recovery lives
- what must not distract from first generation

### Path 2: First Generation

```text
Logged-in user
→ enters fuzzy idea
→ sees account/current assumptions
→ edits or confirms one assumption
→ generates content plan
```

Define:

- desktop workbench layout
- mobile fallback
- current task hierarchy
- assumption editing affordance
- generation loading / failure / retry behavior

### Path 3: Content Plan To Recipe

```text
Generated content plan
→ user evaluates whether it is worth saving
→ saves recipe
→ sees recipe detail entry
```

Define:

- result hierarchy
- save value moment
- success state
- empty/error states

### Path 4: Recipe Reuse

```text
Recipe detail
→ user changes input
→ reruns
→ lands back on /forge?session=
→ understands what was reused
```

Define:

- recipe detail structure
- rerun input placement
- continuity back to Forge workspace
- session identity and recovery states

### Path 5: Return And Feedback

```text
Returning user
→ finds previous recipes/results
→ records performance
→ later sees performance still attached
```

Define:

- where history lives in M1
- relationship between recipes, sessions, and performance
- minimal feedback loop UI
- what is postponed

## Required IA Output

Create an IA map for:

- `/login`
- `/forge`
- `/recipes`
- `/recipes/[id]`
- `/profile`
- future history/performance surface if needed

For `/forge`, use this as the current north star:

```text
left   = account context / content assets / saved context
center = current task input + content plan
right  = assumptions / generation controls / recipe save
bottom = current session / reuse / performance continuity
```

Do not flatten the desktop workbench back into a single top-to-bottom document.

## Required State Map

Cover these states:

- anonymous
- login/register
- email unconfirmed
- password recovery pending
- empty workspace
- typing idea
- direction pending
- assumption edited
- generating
- generated
- generation failed with draft
- session restored from URL
- recipe save pending
- recipe saved
- recipe detail empty/error
- rerun pending
- rerun generated
- performance empty
- performance saved

Each state must include:

- visible user message
- primary action
- secondary action
- recovery path
- data continuity expectation

## Design System Baseline

Define ForgeNote's visual language as a hierarchy, not a mood board.

Required decision:

```text
1. Workbench clarity and repeated-use efficiency
2. Warm paper-like brand surface
3. Small amount of lively character / motion for entry and empty states
```

Rules:

- Workbench screens must stay dense, scannable, and calm.
- Warm paper texture can carry brand atmosphere, but must not reduce contrast.
- Character/eye/illustration motion is allowed only for login, onboarding, empty states, or gentle transitions.
- Character motion must not compete with assumptions, generated content, or recipe controls.
- No one-note beige/brown/orange palette.
- No decorative card piles.
- No hidden primary action.

Define:

- color roles
- type hierarchy
- spacing scale
- button hierarchy
- input style
- panel/section style
- status/error style
- motion principles
- mobile layout rules

## Design Debt Triage

Produce a table with these buckets:

```text
Block V-01
Next implementation
Later polish
Do not do
```

For each item:

- affected path
- why it matters
- evidence source
- proposed owner: Claude Design / Claude Code / Codex / Owner

## Implementation Slices

Propose follow-up tickets, but do not implement them.

Each slice must include:

- ticket id proposal
- path/state covered
- files likely touched
- explicit non-goals
- Gate 3 acceptance path

Slices must be larger than tiny button fixes, but smaller than full redesigns.

## Deliverables

Create these files under `docs/design/dsn-03-core-ux-map/`:

- `ux-map.md`
- `ia.md`
- `state-map.md`
- `design-system-baseline.md`
- `design-debt.md`
- `implementation-slices.md`
- `handoff.md`

Codex will then create:

- `codex-review.md`

## Acceptance

DSN-03 passes only if:

- at least five M1 paths are mapped end to end
- desktop and mobile IA are both specified
- core states include visible copy, actions, recovery, and data continuity
- design language is specific enough to prevent another login-style patch spiral
- implementation slices are traceable to UX paths and states
- Codex review says Pass or Conditional Pass

DSN-03 fails if:

- it is only a visual mood board
- it only redesigns `/login`
- it only describes `/forge`
- it proposes implementation before states are mapped
- it hides real product uncertainty behind aesthetics

## Current Scheduling

DSN-03 may start as a design track now.

It must not be used as an excuse to avoid V-01 evidence. The project still needs at least one real non-builder user path on Production.

No new broad product implementation should start from scratch until DSN-03 has been reviewed.
