# Fix flaky clickPersistence backoff test — evidence

## Root cause

The old test used `backoffMs: 1_000` and `timeoutMs: 10` with real timers. `persistClickWithRetry` calculates the backoff as `Math.min(backoffMs, remainingMs)`, so the retry wait is capped to roughly the same 10 ms deadline as the outer timeout. Two real `setTimeout` callbacks therefore raced at nearly the same wall-clock instant. If the backoff callback won OS scheduling, a second create attempt began and the test failed.

## Deterministic test change

Only `tests/clickPersistence.test.ts` changed, and only the named `backoff consuming the timeout does not start a second create` test.

- The test uses the per-test `t` context and built-in `t.mock.timers`.
- It mocks both `setTimeout` and `Date`.
- It retains `backoffMs: 1_000`, `timeoutMs: 10`, default `maxAttempts: 3`, and the same result/attempt assertions.
- `tick(10)` advances to the deadline deterministically; `tick(20)` replaces the former real 20 ms sleep.

No production code, dependency, lockfile, or other test changed.

## Reproduction and repeat verification

| Check | Result |
| --- | --- |
| Old unmodified target test, 200 invocations | 196 pass, 4 fail |
| Rewritten fake-timer target test, 200 invocations | 200 pass, 0 fail |
| Full `tests/clickPersistence.test.ts` file | 25 pass, 0 fail |
| `npm run lint` | pass |
| `npx tsc --noEmit` | pass |
| `npm test` | 310 pass, 0 fail, 8 opt-in skipped |

## Build verification

The local harness attempted `npm run build` twice after `npm install` and then `npm ci`; the second attempt stopped at a missing `@vercel/turbopack/postcss` module in the local install state. This change is test-only and does not participate in the production build graph.

An external verification run on this exact worktree used a disposable PostgreSQL database, set `DATABASE_URL`, ran `prisma migrate deploy`, and then ran `npm run build` successfully: build passed with 13/13 static pages. No dependency or build-config change is required for this test-only fix.
