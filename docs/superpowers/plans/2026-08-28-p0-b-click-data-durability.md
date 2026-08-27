# P0-B Click + Data Durability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Use superpowers:using-git-worktrees to isolate this work — it touches the live commerce redirect path (`/go/[slug]`) and must not mix with any other in-progress branch. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the P0-B blocker defined in `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §29, §56.2, §66 — "Click persistence must be idempotent, bounded, observable, and resilient to transient database failures. Merchant redirect remains available after persistence failure; attribution loss in that failure path is an explicitly accepted V1 trade-off."

**Why this is next:** Per blueprint §5/§1.3 execution gate ("Does it close a P0 blocker? NO → defer"), no P1 work (e.g. Spec 001 Admin Product Specifications) should continue until P0 is fully verified. P0-A (auth fail-closed, Basic Index Gate, offer truthfulness) is done and merged to `main`. P0-B is the one remaining P0 blocker.

## Current state (read this before writing any code)

`src/app/go/[slug]/route.ts` currently:
- generates a new `clickId` (`uuidv4()`) per request — correct per §29.1, keep this;
- pushes a click payload to a Redis list (`redis.lpush('deskholt:click_queue', ...)`) and, only if the Redis push itself throws, falls back to a direct `prisma.click.create`;
- has **no retry**, **no idempotent unique-conflict handling**, **no timeout/latency budget**, **no structured failure logging/metric** on the Postgres path.

`src/workers/clickWorker.ts` consumes that Redis list with `redis.rpop` (destructive pop) then `prisma.click.create`. If the `create` call fails after the pop, **the click payload is gone with no retry, no dead-letter, and no observability** — this is exactly the "Click queue destructive-pop pattern" the blueprint explicitly lists as a superseded assumption (§0 line ~140) that V3.1.1 no longer accepts.

Blueprint §29 explicitly states: **"V3.1.1 không bắt buộc Redis Streams/async queue ở P0"** — an async queue is not required to pass P0-B. §29.8 lists the conditions under which a durable queue becomes justified later (p95/p99 latency, connection-pool contention under burst, operationally meaningful failure rate, DB-outage survival requirement) — none of those are established today.

## Required architecture decision (do this before writing implementation code)

- [ ] **Decision step:** Run `gitnexus_impact` (or manual caller trace if the symbol isn't indexed) on `processClickQueue` and the `/go` route handler. Report direct callers, whether `clickWorker.ts` is started anywhere in production (check `package.json` scripts, any process manager config, deployment docs) and the blast radius of removing it.
- [ ] Based on that evidence, choose one of:
  - **Option A (recommended default):** Remove the Redis enqueue + `clickWorker.ts` destructive-pop path for P0. Make `/go` persist the click **synchronously and idempotently** with bounded retry/timeout, directly satisfying every §29.9 test without a queue's added failure surface. This matches "not required at P0" and eliminates the already-flagged bad pattern outright instead of patching it.
  - **Option B:** Keep the Redis queue but redesign the worker to be non-destructive and idempotent (e.g. reliable-queue pattern: claim → persist → ack → dead-letter on exhausted retry). This is materially more work and re-introduces async failure-decoupling complexity the blueprint says is not required yet.
  - **Do not silently default to Option B just because it changes less code.** If `clickWorker.ts` is not started in production today (i.e. clicks are being persisted synchronously already via the current fallback-only path, or the worker is dead code), Option A is very likely correct and lower-risk.
- [ ] Record the decision and its evidence in `artifacts/p0-b/architecture-decision.md` before proceeding to Task 1. If the evidence is ambiguous (e.g. worker's production-run status can't be confirmed from the repo), stop and ask the human operator rather than guessing.

## Global Constraints

- Do not change `clickId` generation semantics: one `clickId` per request lifecycle; a true retry-of-the-same-request reuses it; a genuinely new user click/reload gets a new one. Do not introduce user/session-level dedupe that would collapse distinct clicks (§29.1 explicitly forbids this).
- Only canonical unique-conflict responses (Prisma `P2002` / Postgres `23505` on the `click_id` unique constraint) may be interpreted as "already persisted." Never treat a generic caught error as success — that hides real schema/data/constraint bugs (§29.2).
- Retry only transient failures (connection reset, short-lived pool/connectivity issues, retryable serialization/deadlock, ambiguous-response cases). Never retry validation errors, invalid foreign keys, schema mismatches, or malformed data (§29.3). Retry must be bounded, use small backoff, be configurable, and always reuse the same `clickId`.
- Application-level timeout/abandonment does not guarantee the underlying Postgres query was cancelled — ambiguous completion is possible and expected. This is exactly why idempotent `clickId` matters; do not treat a timeout as proof of non-persistence (§29.4, §29.7).
- On exhausted persistence attempts: emit structured failure log + failure metric containing `clickId`, `clickedAt`, product/merchant/destination context, and error classification — then **the merchant redirect must still happen**. Never block or fail the redirect on persistence outcome (§29.5).
- Document the accepted V1 trade-off (attribution loss on exhausted-retry path) and the ambiguous-commit false-negative metric caveat in code comments/evidence, not as inline user-facing text (§29.6, §29.7).
- Do not build a durable async queue, dead-letter system, or new metrics infrastructure beyond a structured log line — that is explicitly out of P0 scope per §29.8 unless Option B evidence forces it.
- Do not touch `productAccessPolicy.ts` eligibility logic, the P0-A3 commerce-eligibility gate order, or the existing missing-Product/no-affiliate-link redirect-home fallback — `tests/goProductAccess.test.ts` and `tests/clickTracking.test.ts` must keep passing unchanged in behavior.
- Seed/migration items already listed under P0-B in the blueprint (partial indexes in version-controlled migration, `prisma/seed.js` removal, active seed fail-closed) were already completed and verified in P0-A3 (`artifacts/p0-a3/us1-seed-impact-and-change.md`). Re-verify they still hold; do not redo that work.

---

### Task 1: Write failing tests for the §29.9 invariant checklist

**Files:**
- Add: `tests/clickPersistence.test.ts`

**Required test cases (blueprint §29.9, verbatim list):**
- normal insert
- transient failure → retry → success
- ambiguous commit → retry same `clickId`
- duplicate/idempotent retry
- canonical unique-conflict handling
- non-unique error is NOT treated as success
- permanent failure
- timeout path
- structured failure logging/metric
- redirect continues after exhausted attempts
- new user click gets new `clickId`
- same-request retry reuses `clickId`

- [ ] **Step 1:** Write all twelve cases against a not-yet-existing `persistClickWithRetry` (or equivalent) function signature you design. Use an injectable/mockable Prisma-like client so transient vs. permanent vs. unique-conflict errors can be simulated deterministically (e.g. a fake client whose `create` throws configured errors N times then succeeds, or throws a `P2002`-shaped error, or throws a non-retryable validation-shaped error).
- [ ] **Step 2:** Run `npm test -- tests/clickPersistence.test.ts`. Expected: FAIL (module doesn't exist yet).

### Task 2: Implement idempotent bounded-retry click persistence

**Files:**
- Add: `src/lib/products/clickPersistence.ts` (or `src/lib/clickPersistence.ts` — match existing `src/lib/clickTracking.ts` location convention)

**Interfaces (design these to make Task 1 pass, adjust naming as needed):**
- A pure-ish function taking the Prisma client (or a `create` function), the click payload (including the pre-generated `clickId`/`clickedAt`), and config (`maxAttempts`, `backoffMs`, `timeoutMs`).
- Returns a discriminated result: `{ outcome: 'persisted' }` | `{ outcome: 'idempotent-duplicate' }` | `{ outcome: 'exhausted', classification, attempts }`.
- Internally classifies each error as `unique-conflict` (P2002/23505 on `click_id`) vs `transient` (retry) vs `permanent` (stop immediately, no retry).
- On `exhausted`, the caller is responsible for the structured log + metric emission (keep this function focused on persistence semantics; do the logging at the call site in `/go` so context like product/merchant is available without threading it through).

- [ ] **Step 1:** Implement the minimal function to turn Task 1 RED to GREEN.
- [ ] **Step 2:** Run `npm test -- tests/clickPersistence.test.ts`. Expected: PASS.

### Task 3: Wire into the `/go` route (and remove/adjust the queue per the Task 0 decision)

**Files:**
- Modify: `src/app/go/[slug]/route.ts`
- Modify or remove: `src/workers/clickWorker.ts`, `src/lib/redis.ts` usage in the route (per the Option A/B decision recorded in Task 0)
- Add/modify: `tests/goProductAccess.test.ts` or a new `tests/goClickPersistence.test.ts` for route-level behavior

- [ ] **Step 1:** Run `gitnexus_impact` on the `/go` route handler before editing (it is an existing, indexed, commerce-critical symbol). Report risk; stop for confirmation only on HIGH/CRITICAL.
- [ ] **Step 2:** Add failing route-level tests: successful persistence still redirects; exhausted-retry persistence still redirects (302 to merchant, not home); structured failure log is emitted on exhausted attempts; existing missing-Product (redirect home) and non-public-404 behavior from P0-A3 is unchanged.
- [ ] **Step 3:** Replace the current fire-and-forget Redis push / bare `prisma.click.create` fallback with a call to `persistClickWithRetry`, wrapped in the overall timeout budget. Keep `clickId` generation exactly where it is (before persistence, once per request). If Task 0 chose Option A, delete `src/workers/clickWorker.ts` and its Redis queue push; if Option B, redesign the worker per the reliable-queue pattern and keep both in sync.
- [ ] **Step 4:** Make new and existing tests pass: `npm test -- tests/clickPersistence.test.ts tests/goProductAccess.test.ts tests/clickTracking.test.ts` (adjust file list to whatever you named the new route-level test file).

### Task 4: Re-verify the seed/migration half of P0-B (no new work expected)

- [ ] **Step 1:** Confirm `prisma/seed.js` remains absent, the active seed remains `DRAFT + non-indexable` fail-closed, and the two `ProductAttribute` partial unique indexes remain in version-controlled migrations — these were completed under P0-A3. Record a short confirmation (not a re-implementation) in `artifacts/p0-b/seed-migration-reverification.md`, citing the existing P0-A3 evidence files.
- [ ] **Step 2:** If any of the above regressed (e.g. a merge reintroduced `prisma/seed.js`), stop and report — do not silently fix it as a side effect of P0-B; that would be scope creep requiring its own evidence trail.

### Task 5: Full verification and evidence

- [ ] **Step 1:** Run `npm run lint`, `npx tsc --noEmit`, `npm test` (full suite), `npm run build`. All must pass with zero regressions to the pre-existing 175-test baseline plus the new P0-B tests.
- [ ] **Step 2:** Manually exercise `/go/[slug]` against a disposable local database (never the populated/production datasource) for: normal click (redirect + row persisted), simulated transient DB failure (redirect still happens, retry succeeds, one row persisted, no duplicate), simulated permanent failure (redirect still happens, structured failure log observed, no row persisted, no retry storm).
- [ ] **Step 3:** Record final evidence — architecture decision, test results, manual verification transcript, and explicit statement of the accepted V1 trade-off (attribution loss on exhausted-retry path) and the ambiguous-commit metric caveat — in `artifacts/p0-b/evidence.md`.
- [ ] **Step 4:** Run `gitnexus_detect_changes()` before commit; confirm the diff touches only click-persistence/`/go`-route files, their tests, and `artifacts/p0-b/`/plan checkboxes — nothing from Spec 001 or unrelated work.
- [ ] **Step 5:** Push the branch and open a PR against `main` (same flow as the middleware→proxy migration: isolated worktree, own branch, own PR, CI green, clean mergeable state) rather than merging locally.

**After this lands:** P0-A + P0-B + P0-C are all satisfied per the blueprint's own Definition of Done. Only then does blueprint §5/§39 consider P1 work (finishing Spec 001 Admin Product Specifications convergence) execution-eligible again — resume that afterward.
