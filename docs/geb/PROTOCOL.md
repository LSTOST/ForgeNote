# GEB Lite Protocol

## Rule 1: Minimal Context

Agents start from `AGENTS.md`, `docs/geb/CONTEXT.md`, `docs/geb/MAP.md`, and the task card or user request.

Only read the mapped semantic document for the code area being changed.

## Rule 2: Code And Map Sync

When code behavior changes, update the mapped semantic document.

When only implementation details change and public behavior is unchanged, do not edit product docs just to create motion.

## Rule 3: Archive Is Evidence

`docs/archive/**`, design archives, acceptance files, and agent-run logs are not default context. Use them only when researching history, proving acceptance, or debugging a regression tied to old behavior.

## Rule 4: Validation Is The Judge

A task is incomplete until mapped validation commands pass or failures are explicitly reported.

Do not mark a roadmap ticket `accepted`; only Owner can accept after a real-path check with evidence.

## Rule 5: Handoff Must Be Small

Every handoff must include:

- Changed files
- Changed behavior
- Validation result
- Open risk
- Next agent instruction
