# DeskHolt — Agent Instructions

## Shared Project Continuity

This repository may be worked on by DSH Harness, Claude Code, Codex, or other coding agents.

Before substantial project work:

1. Read `docs/operations/ai-workflow/HANDOFF.md` if it exists.
2. Inspect the relevant repository state and Git history.
3. Read the current designated DeskHolt canonical documentation relevant to the task.
4. Verify important handoff claims against the repository before acting on them.

`HANDOFF.md` is operational state only. It is not architectural authority.

Use this authority order:

1. Repository and Git history — actual implementation state.
2. Current designated DeskHolt canonical documentation — architecture, scope, contracts, gates, invariants, and design decisions.
3. Approved feature artifacts such as Spec-Kit `spec.md`, `plan.md`, and `tasks.md` — task-level requirements and implementation intent.
4. `docs/operations/ai-workflow/HANDOFF.md` — current cross-agent workflow state.
5. Conversation context — supplemental only.

If these sources materially conflict, report the conflict instead of silently reconciling it.

---

## Handoff Discipline

Use `docs/operations/ai-workflow/HANDOFF.md` as the shared journal between agents.

Update it when work materially changes project/task state, including:

- a plan/spec is created or approved;
- implementation starts or completes;
- a commit is created for review;
- tests/lint/typecheck/build results materially change;
- review finds blockers;
- a replacement commit is created;
- review passes;
- the task is completed.

Keep HANDOFF concise and factual.

Prefer references to existing artifacts instead of duplicating long content. For example:

- Spec: `specs/<feature>/spec.md`
- Plan: `specs/<feature>/plan.md`
- Tasks: `specs/<feature>/tasks.md`
- Commit: `<sha>`

Do not turn HANDOFF into a competing architecture document.

---

## Cross-Agent Review Checkpoint

When implementation is ready for independent review, use a Git commit SHA as the review checkpoint.

Reviewers should inspect the committed snapshot rather than treating continuously changing uncommitted files as a completed review target.

A previous agent's explanation is context, not proof. Verify against Git, code, tests, and required checks.

---

## Spec-Kit Auto-Activation

For any request to build a **new feature** that does not already have an approved feature spec/plan/tasks, automatically use the installed Spec-Kit workflow in order:

1. `speckit-specify` — turn the request into a feature spec
2. `speckit-plan` — turn the spec into a design/implementation plan
3. `speckit-tasks` — break the plan into actionable tasks
4. `speckit-implement` — execute the tasks

Do not restart the full Spec-Kit workflow when the repository or HANDOFF already points to an approved spec/plan/tasks for the current work. Continue from those approved artifacts unless a material conflict is found.

Skip the full Spec-Kit workflow for:

- bug fixes;
- small edits;
- one-line changes;
- fixes for confirmed review findings;
- tasks that already have an approved implementation plan;
- cases where the user explicitly asks for a narrower action such as plan-only, review-only, or direct coding.

If the requested action is ambiguous between planning/review and implementation, use judgment and ask only when a material decision cannot be inferred safely.

---

<!-- karpathy:start -->
# Karpathy Coding Hygiene

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```text
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
<!-- karpathy:end -->

---

## Tool Availability Rule

Some repository policies require external tools such as GitNexus.

Never claim a tool or check was executed when it was not.

If a required tool is unavailable in the current environment:

- report that it is unavailable;
- do not fabricate impact-analysis, context, change-detection, or verification results;
- use the safest available repository inspection path;
- if repository policy explicitly forbids proceeding without the tool, stop before that operation unless the user resolves the blocker.

---

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **deskholt** (2712 symbols, 4422 relationships, 142 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/deskholt/context` | Codebase overview, check index freshness |
| `gitnexus://repo/deskholt/clusters` | All functional areas |
| `gitnexus://repo/deskholt/processes` | All execution flows |
| `gitnexus://repo/deskholt/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
