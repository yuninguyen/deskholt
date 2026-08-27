# P0-A3 M-1 Worktree and Impact Baseline

Captured before implementation edits on 2026-08-25.

## Existing unrelated worktree state

The repository already contained unrelated modifications and deletions outside this feature, including documentation, GitNexus skill files, configuration, and:

```text
src/app/(public)/products/[slug]/page.tsx
```

The Product-page modification is explicitly preserved and must not be overwritten by P0-A3 work.

## Feature scope

Implementation scope is limited to the approved P0-A3 plan and `specs/004-basic-index-gate/tasks.md`. No commit is part of this phase.

## Required impact boundaries

Before editing existing indexed symbols, implementation must run GitNexus upstream impact analysis and record direct callers, affected execution flows, and risk. HIGH/CRITICAL results require a user warning and confirmation before editing. Required boundaries are tracked in T017, T031, T032, T040, T053, T054, and T055; final `gitnexus_detect_changes()` is T081.

## Hard gates

```text
M-1 → M0 → M1 → STOP M2
→ M3/M4
→ US1–US4
→ release readiness
→ STOP M5
→ M5 resolve
→ drained M6 deploy/rollout/postcheck
→ traffic restore
```

No populated database write, migration history write, or `speckit-implement` continuation may cross M2 or M5 without the exact human approval text required by `tasks.md`.
