# P0-A3 Runtime Proof Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the remaining disposable-development P0-A3 cache-race, PostgreSQL publishing-race, Admin feedback, and truthful verification evidence without performing production M5/M6 operations.

**Architecture:** Keep the existing Product access and publishing command contracts unchanged. Extend the server-only cache probe with an owned, filesystem-backed session/event protocol consumed by the existing Product metadata/body path; the built-Next driver exclusively owns fixture data, process lifecycle, barriers, and cleanup. Make the PostgreSQL verifier call the real publishing command store within its two lock-holding transactions. Keep the UI changes presentation-only and preserve Save→Redirect semantics.

**Tech Stack:** TypeScript, Node 24, Next.js 16.3 App Router, React 19.0.0 request `cache`, Prisma 5.22.0, PostgreSQL, Node built-in tests, Tailwind CSS.

**Spec:** `specs/004-basic-index-gate/spec.md`; binding contracts: `specs/004-basic-index-gate/contracts/product-page-data.md` and `specs/004-basic-index-gate/contracts/publishing-commands.md`.

## Global Constraints

- Only explicit, disposable local PostgreSQL URLs may be used for runtime verification; never use an ambient datasource or true-production target.
- Do not perform T073+ / M5 / M6 operations; local `deskholt_db` is the user-confirmed disposable development database.
- Preserve the unrelated hero-copy change in `src/app/(public)/products/[slug]/page.tsx`.
- All behavioral code starts with a focused failing test and the expected failure is recorded before implementation.
- The cache proof must start an existing built Next app on `127.0.0.1` with random slug/token/port, use no public probe control surface, and delete only recorded owned resource paths.
- The publishing proof must use real PostgreSQL `SELECT ... FOR UPDATE`, overlapping transactions/barriers, and the production `createPrismaPublishingStore` plus `executePublishingCommand` implementation.
- Admin publishing remains command-shaped and Save→Redirect; error copy may not alter persistence/invalidation behavior.
- All UI status semantics use the shared access policy; visual copy follows `deskholt-design-system.html` with accessible text in addition to color.

---

### Task 1: Harden server-only cache probe protocol

**Files:**
- Modify: `tests/productPageData.test.ts`
- Modify: `tests/p0A3SourceAcceptance.test.ts`
- Modify: `tests/p0A3VerifierProductionSafety.test.ts`
- Modify: `src/lib/products/productPageCacheProbe.ts`
- Modify: `src/lib/products/productPageData.ts`
- Modify: `src/app/(public)/products/[slug]/page.tsx`

**Interfaces:**
- Produces `beforeProductPageConsumer(consumer: 'metadata' | 'body', slug)` and `afterProductPageConsumer(session, observation)`.
- Probe session files contain only session identifier, expected slug, counters, barriers, result version, evaluated timestamp, and event records.
- The first consumer claims the session, observes the cached loader result, signals `first-result-ready`, then waits for `mutation-complete`; the second waits before loader use and records the same resulting version/time.

- [ ] **Step 1: Write failing probe-contract tests**

Add tests that assert the probe rejects symlink/junction roots without swallowing its own failure; allocates no session for an unexpected slug; atomically records metadata/body claims in one request session; exposes `first-result-ready` only after a loader observation; and makes the second consumer wait on `mutation-complete` before invoking the loader.

- [ ] **Step 2: Run focused tests to verify RED**

Run: `npm test -- tests/productPageData.test.ts tests/p0A3SourceAcceptance.test.ts tests/p0A3VerifierProductionSafety.test.ts`

Expected: FAIL because the event/barrier hooks and persisted observations do not exist.

- [ ] **Step 3: Implement the smallest server-only probe protocol**

Use `lstat`/canonical-path checks that rethrow probe failures, allocation-record ownership validation, `wx` filesystem claims, bounded event/barrier polling, and per-session `session.json`. Call the before hook immediately before `getProductPageData` from both metadata and page; call the after hook with the cached result version and `evaluatedAt` after it resolves. Do not change `loadSpecificationData`.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- tests/productPageData.test.ts tests/p0A3SourceAcceptance.test.ts tests/p0A3VerifierProductionSafety.test.ts`

Expected: PASS.

### Task 2: Implement the built-Next cache runtime driver

**Files:**
- Modify: `tests/p0A3VerifierProductionSafety.test.ts`
- Modify: `scripts/verify-product-page-cache-runtime.ts`

**Interfaces:**
- Consumes probe allocation/session files produced by Task 1.
- `runCacheRuntimeVerification({ databaseUrl, expectedFingerprint, mutate })` owns the random fixture slug/token/root/port and returns a structured report only after all assertions pass.
- CLI creates the owned Product/AffiliateLink fixture, supplies mutation that changes the fixture state/version, and removes only those rows in `finally`.

- [ ] **Step 1: Write failing verifier behavior tests**

Add source/behavior safety checks for fixture creation/removal by random owned ID/slug, polling `first-result-ready`, writing `mutation-complete` only after mutation, two real Product fetches, first-request same-session same-result/time assertions, second-request distinct-session fresh-result assertion, and allocation-record-driven cleanup.

- [ ] **Step 2: Run focused verifier tests to verify RED**

Run: `npm test -- tests/p0A3VerifierProductionSafety.test.ts tests/p0A3SourceAcceptance.test.ts`

Expected: FAIL because the verifier currently stops with an intentional refusal and has no fixture/barrier workflow.

- [ ] **Step 3: Implement the minimal owned runtime workflow**

Instantiate a Prisma client only against the explicit URL; fingerprint it before starting Next; create an active indexed Product plus AffiliateLink fixture; launch `next start` loopback-only with all probe variables; start HTTP request one without awaiting it; wait for `first-result-ready`; mutate only the fixture; signal `mutation-complete`; assert session observations and response success; issue request two without restart; assert changed observation and distinct session; terminate child; delete fixture rows and canonical owned session paths only.

- [ ] **Step 4: Run focused verifier tests to verify GREEN**

Run: `npm test -- tests/p0A3VerifierProductionSafety.test.ts tests/p0A3SourceAcceptance.test.ts`

Expected: PASS.

### Task 3: Bind real PostgreSQL race transactions to production publishing commands

**Files:**
- Modify: `tests/productPublishingConcurrency.test.ts`
- Modify: `scripts/verify-product-publishing-concurrency.ts`

**Interfaces:**
- Consumes `createPrismaPublishingStore(tx)` and `executePublishingCommand(store, fixtureId, command)` from `src/lib/products/productPublishingCommands.ts`.
- Retains every current `PUBLISHING_RACE_SCENARIOS` scenario, lock barrier, migration-history fingerprint check, and owned-fixture cleanup.

- [ ] **Step 1: Write failing anti-drift test**

Add a test that inspects/exercises the real verifier path and requires importing the production publishing command/store functions; reject a verifier-local command update implementation.

- [ ] **Step 2: Run the concurrency test to verify RED**

Run: `npm test -- tests/productPublishingConcurrency.test.ts tests/p0A3VerifierProductionSafety.test.ts`

Expected: FAIL because `runRealCommand` currently duplicates SQL-shaped writes.

- [ ] **Step 3: Replace duplicate verifier writes**

Within each real Prisma transaction, continue to acquire `FOR UPDATE`, use the imported store and actual command execution, and assert each command result matches its allowed outcome while preserving the scenario final-state assertion. Preserve timeout/barrier/cleanup behavior.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- tests/productPublishingConcurrency.test.ts tests/p0A3VerifierProductionSafety.test.ts`

Expected: PASS.

### Task 4: Make Admin publishing feedback actionable

**Files:**
- Modify: `tests/adminProductPublishing.test.ts`
- Modify: `src/app/(admin)/admin/products/page.tsx`

**Interfaces:**
- Query error reason stays a stable machine value at the redirect boundary.
- Page maps those values to operator-facing copy, applies an accessible highlight to `productId`, and explains disabled enable-index controls.

- [ ] **Step 1: Write failing focused UI-source tests**

Add assertions for user-facing error mapping, a row identity/focus marker derived from `productId`, and explanatory text bound to an inactive disabled Enable index button.

- [ ] **Step 2: Run focused UI tests to verify RED**

Run: `npm test -- tests/adminProductPublishing.test.ts`

Expected: FAIL because the current page renders raw error reasons and leaves inactive enable controls unexplained.

- [ ] **Step 3: Implement presentation-only feedback**

Create a local reason-to-message mapping; use `aria-live` for success/error feedback; set `id`/`tabIndex`/highlight class on the affected row; and render a compact explanation beside a disabled Enable index control. Keep forms, action names, and command values unchanged.

- [ ] **Step 4: Run focused UI tests to verify GREEN**

Run: `npm test -- tests/adminProductPublishing.test.ts`

Expected: PASS.

### Task 5: Run local disposable acceptance and write truthful evidence

**Files:**
- Modify: `artifacts/p0-a3/us2-concurrency.md`
- Modify: `artifacts/p0-a3/us2-admin-publishing-acceptance.md`
- Modify: `artifacts/p0-a3/us3-cache-runtime.md`
- Modify: `artifacts/p0-a3/us3-public-surface-acceptance.md`
- Modify: `artifacts/p0-a3/us4-sitemap-acceptance.md`
- Modify: `artifacts/p0-a3/release-readiness/*.md`
- Modify: `specs/004-basic-index-gate/tasks.md`

- [ ] **Step 1: Establish explicit disposable inputs**

Obtain the non-secret local fingerprint and provide it alongside explicit `P0_A3_PUBLISHING_DATABASE_URL` and `P0_A3_CACHE_DATABASE_URL`; refuse ambient URLs.

- [ ] **Step 2: Build and run real verifiers**

Run: `npm run build`; `npm run verify:p0-a3:publishing-concurrency`; `npm run verify:p0-a3:cache-runtime`.

Expected: all commands exit 0 and produce their runtime reports against the explicit disposable target.

- [ ] **Step 3: Run full static/regression checks**

Run: `npm run lint`; `npx tsc --noEmit --incremental false --pretty false`; `npm test`; `npm run verify:p0-a3:migrations -- --mode clean-chain` using fresh disposable targets.

Expected: all pass; no first-time behavior coverage is added in this phase.

- [ ] **Step 4: Record evidence and ledger state**

Write exact command outcomes, non-secret fingerprints, scenario/session evidence, build route table, fixture/session cleanup outcomes, and limitations. Mark only completed T039/T042–T044/T056/T058–T072 tasks; retain T073+ unchecked and explicitly label them production-only.
