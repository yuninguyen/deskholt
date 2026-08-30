# Fix flaky clickPersistence backoff/timeout test

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close the backlog item from `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` (flaky test observed twice on PR #11 and PR #13 CI runs, unrelated to either PR's actual changes) — `tests/clickPersistence.test.ts`'s `'backoff consuming the timeout does not start a second create'` test, at line 353. This is a single, narrowly-scoped test fix — do not touch `src/lib/products/clickPersistence.ts` (the production code), do not touch any other test in the file, do not change any other test's assertions.

## Root cause (verified by reading the code, not assumed)

The test calls `persistClickWithRetry(retryOptions(create, { backoffMs: 1_000, timeoutMs: 10 }))` expecting the 10ms timeout to win before a second attempt starts. But read `clickPersistence.ts` line 139: `const delayMs = Math.min(normalizedBackoffMs, remainingMs);` — the backoff delay is capped to whatever time remains before the deadline, not the full `1_000`. With `timeoutMs: 10`, `remainingMs` is already close to 10ms by the time the first attempt's synchronous throw finishes, so the backoff's `setTimeout(~10ms)` and the outer race's `setTimeout(10ms)` (`clickPersistence.ts` line 105) end up scheduled for **nearly the same real-clock instant** — a genuine, by-construction close race between two real timers, not a "bad luck under CI load" flake. Real OS timer granularity/scheduling order under load can let the backoff timer fire first, producing `attempts: 2` instead of the expected `1`. This is exactly the class of problem fake timers exist to solve — do not "fix" it by widening the gap between `timeoutMs`/`backoffMs` (that would hide the race, not eliminate it, and would weaken what the test is actually trying to verify).

## Required fix

Rewrite **only this one test** to use Node's built-in `node:test` timer mocking (`t.mock.timers` — no new dependency; this ships in Node's test runner already used throughout this project's test suite) instead of real timers, so the timeout-vs-backoff ordering becomes deterministic:

- Enable mock timers for both `setTimeout` and `Date` (`t.mock.timers.enable({ apis: ['setTimeout', 'Date'] })`) — `Date` must be mocked too, since `clickPersistence.ts` computes `deadline = Date.now() + normalizedTimeoutMs` and later compares `Date.now()` against it; mocking only `setTimeout` while leaving `Date.now()` real would reintroduce the same race in a different form.
- Call `persistClickWithRetry(...)` with the same `backoffMs: 1_000, timeoutMs: 10` inputs (keep the test's actual scenario identical — this is a fix to *how* it's measured, not *what* it measures).
- Advance the mocked clock deterministically (`t.mock.timers.tick(...)`) to the exact point where the timeout should resolve, and assert the same outcomes the test already asserts (`{ outcome: 'exhausted', classification: 'timeout', attempts: 1 }`, then `attempts` still `1` after advancing further) — but now with a fully deterministic clock instead of a real 20ms `setTimeout` at the end (line 367).
- If `node:test`'s per-test `t` context isn't already threaded into this file's test callbacks (check — the existing tests use the bare `test(name, async () => {...})` form without a `t` parameter), add it only to this one test, not the whole file.

## Global Constraints

- Only `tests/clickPersistence.test.ts` changes, and only the one named test within it. Every other test in the file must keep passing unmodified.
- Do not touch `src/lib/products/clickPersistence.ts` — this is a test-only fix; the production retry/timeout logic is correct and already covered by P0-B's own verification (blueprint §29/§56.2).
- No new dependencies (no `sinon`, no fake-timer library) — use `node:test`'s built-in `mock.timers`.
- Full existing suite must stay green.

---

### Task 1: Convert the one flaky test to fake timers (tests first, in the TDD sense of "prove the fix actually removes the race")

**Files:** `tests/clickPersistence.test.ts`

- [ ] **Step 1:** Before changing anything, run this single test in a tight loop (e.g. `for i in 1..200`, or Node's `--test-repeat` if available in the project's Node version, or a temporary local script) against the **current, unmodified** real-timer version to confirm you can reproduce at least one failure — this proves the race is real, not just theoretical, before you "fix" it. Record the reproduction result (pass/fail count) in your own notes for the evidence file; do not commit a loop-runner script.
- [ ] **Step 2:** Rewrite the test using `t.mock.timers` per the "Required fix" section above. Keep the exact same input configuration (`backoffMs: 1_000, timeoutMs: 10`, `maxAttempts: 3` from `retryOptions`'s default) and the exact same two assertions the current test makes (immediate result is `{ outcome: 'exhausted', classification: 'timeout', attempts: 1 }`, and `attempts` is still `1` after the point where the original test did its extra real-`setTimeout(20)` check — replace that with a deterministic clock advance instead).
- [ ] **Step 3:** Run the rewritten test in the same tight loop from Step 1 (e.g. 200 iterations) against the **fixed** version and confirm zero failures — this is your proof the fix actually works, not just that it passes once.
- [ ] **Step 4:** Run the full existing test file and the full suite once: confirm no regressions to any of the other tests in `clickPersistence.test.ts` or elsewhere.

### Task 2: Verification and evidence

- [ ] **Step 1:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 2:** Record evidence in `artifacts/fix-flaky-click-persistence-test/evidence.md`: the root-cause explanation (the `Math.min(backoffMs, remainingMs)` timing collision), the Step 1 reproduction result (how many failures out of how many runs on the old version), the Step 3 confirmation result (zero failures out of how many runs on the new version), and full test/lint/typecheck/build output.
- [ ] **Step 3:** Push the branch, open a PR against `main`. Do not merge locally.

**After this lands:** the `clickPersistence.test.ts` suite no longer has a test that depends on real-timer race outcomes — CI runs of this file become deterministic, closing the backlog item logged after PR #11 and #13.
