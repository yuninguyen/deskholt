# Tasks: P0-A3 Basic Index Gate

**Input**: Approved design documents from `/specs/004-basic-index-gate/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Required. Write focused tests/verifiers before the implementation they cover and confirm each new test fails for the intended reason before making it pass.

**Hard execution order**:

```text
T004-L local safety → M0 → M1 → STOP M2
→ M3 feature migration artifact
→ M4 disposable clean/failure proof
→ runtime US1–US4
→ disposable full verification and compatible release artifact
→ refresh M5 evidence → STOP M5
→ M5 baseline resolve/verification
→ maintenance-coordinated M6 P0-A3 deploy
→ exact compatible application artifact rollout with traffic still drained
→ read-only populated postcheck while quiescent
→ traffic restore and post-restore verification
→ final evidence
```

- **M2** requires `APPROVE BASELINE ARTIFACT <name> SHA256=<hash>`.
- **M5** requires `CONFIRM BASELINE RESOLVE <name> SHA256=<hash> FINGERPRINT=<approved-id>`.
- No task, script, command chain, or automatic continuation may cross M2 or M5.
- Populated baseline resolution/P0-A3 deployment are forbidden until runtime implementation, disposable verification, production build, route-table verification, and compatible release-artifact readiness are complete.
- Pre-M6 PostgreSQL runtime tests use only explicit disposable databases that passed baseline→P0-A3 clean-chain verification, never the populated datasource.
- Generating or revising this task list does not authorize implementation.
- Preserve the pre-existing unrelated change in `src/app/(public)/products/[slug]/page.tsx`.

## Format: `- [ ] T### [P?] [US#?] Description with primary file or evidence path`

- **[P]** is optional and means the task can run concurrently with another explicitly identified task because it has no unfinished dependency and touches independent files/resources.
- **[US#]** is required for user-story-specific tasks and omitted only for setup, cross-story migration gates, release-readiness, final integration, and repository-wide verification tasks.
- Every task names at least one exact primary source, test, script, migration, or evidence path.

---

## Phase 1: Setup — M-1 Reproducible Toolchain and Safety Preconditions

**Purpose**: Pin the evidenced toolchain, install normative verification commands, and prove the environment is safe before any database inventory or migration artifact is generated.

- [X] T001 Capture initial worktree state, identify the pre-existing Product-page hunk, refresh the GitNexus index if stale, and record initial impact targets/risks in `artifacts/p0-a3/m-1-worktree-and-impact.md`
- [X] T002 Pin `prisma` and `@prisma/client` to exact `5.22.0` and add the three normative verifier mappings in `package.json`; update `package-lock.json` without changing the resolved Prisma engine family
- [X] T003 Run Node 24/Prisma smoke checks (`npm ls`, Prisma version/engine hash, generate, validate, read-only connectivity/diff, existing tests), reject duplicate effective Prisma versions, and record output in `artifacts/p0-a3/m-1-toolchain-smoke.md`
- [X] T004 **T004-L local implementation safety**: verify the current target is local development (`localhost`, database `deskholt_db`, schema `public`, no production VPS, no production traffic); create a fresh PostgreSQL logical backup with `pg_dump` to a timestamped file outside the repository, record target fingerprint and SHA-256, restore it into a different disposable local database, and compare 20 Products, row counts, keyed relationships, orphan counts, and schema/object inventory in `artifacts/p0-a3/m-1-local-backup-and-restore.md`

**Checkpoint T004-L / local M-1**: Exact Prisma 5.22.0 is reproducible; verifier script names exist before use; the current target is explicitly local; fresh logical backup/restore comparison passes. T004-L permits M0 through T072. T004-P remains mandatory before T073/M5 and any production operation. Stop on any local identity, backup, restore, or comparison mismatch.

**Checkpoint T004-P / production operations gate**: Before T073/M5, independently verify production VPS/database identity, off-VPS automatic backups, recent successful run, automatic deletion beyond 30 days, selected production backup checksum/identity, and restore procedure or recent restore-test evidence. If production infrastructure/evidence does not exist, T073+, M5, M6, and production rollout remain blocked; local implementation may proceed only through T072.

---

## Phase 2: Foundational — M0 Inventory, M1 Baseline, STOP M2

**Purpose**: Produce read-only live evidence and the pre-P0-A3 baseline artifact. No Product schema change, P0-A3 migration directory, populated history write, or runtime feature work is allowed in this phase.

### Tests and tooling

- [X] T005 Add failing pure tests for deterministic sorted preservation snapshots, orphan-count output, fingerprint comparison, role-privilege result classification, and secret redaction in `tests/p0A3MigrationSafety.test.ts`
- [X] T006 Implement the read-only inventory/preservation/fingerprint command used by M0 in `scripts/snapshot-p0-a3-database.ts`; require explicit target URL inputs and prohibit DDL/DML
- [X] T007 Make `tests/p0A3MigrationSafety.test.ts` pass and record test output in `artifacts/p0-a3/m0-safety-tool-tests.md`

### M0 — Read-only populated inventory

- [X] T008 Run the read-only populated inventory, keyed preservation snapshot, object classification, identity tuple, and migration-history absence checks; write canonical outputs and hashes under `artifacts/p0-a3/m0/`
- [X] T009 Run read-only migration-role privilege proof (`has_schema_privilege`, Product ownership/role membership, table UPDATE/SELECT privileges, required catalog readability) and record every result/limitation in `artifacts/p0-a3/m0/role-privileges.md`
- [X] T010 Run the Prisma-representable live-to-active-model diff, reconcile it with unsupported PostgreSQL objects, and record zero unexplained drift evidence in `artifacts/p0-a3/m0/live-compatibility.md`

### M1 — Baseline generation and inspection

- [X] T011 Create `prisma/migrations/migration_lock.toml` with PostgreSQL provider and generate the pre-P0-A3 baseline SQL in `prisma/migrations/<baseline>_baseline_existing_schema/migration.sql`
- [X] T012 Add the two exact ProductAttribute partial unique indexes to `prisma/migrations/<baseline>_baseline_existing_schema/migration.sql` using plain `CREATE UNIQUE INDEX`; do not add P0-A3 fields/backfill or destructive SQL
- [X] T013 Review/hash the complete baseline, verify all 10 tables/4 enums/constraints/defaults/indexes and absence of P0-A3/destructive/history SQL, and record the report in `artifacts/p0-a3/m1/baseline-inspection.md`
- [X] T014 Assemble the M2 packet with tool versions, full baseline SQL/hash, live diff, object classification, identity tuples, backup evidence, privilege evidence/limitations, Product count, and absent history in `artifacts/p0-a3/m2-baseline-artifact-packet.md`

### STOP M2 — Human artifact approval

- [X] T015 **STOP M2** Present `artifacts/p0-a3/m2-baseline-artifact-packet.md` and wait for exact `APPROVE BASELINE ARTIFACT <name> SHA256=<hash>`; record the human response in `artifacts/p0-a3/m2-baseline-artifact-approval.md` and do not start T016 without it

**Checkpoint M2**: Baseline artifact is approved for feature-migration generation and disposable clean-chain testing only. Populated `migrate resolve` and `migrate deploy` remain forbidden.

---

## Phase 3: User Story 5 Part A — Feature Migration Artifact and Disposable Proof (Priority: P1)

**Goal**: Create the separate atomic P0-A3 migration and prove baseline→feature behavior and rollback on disposable databases without touching populated migration history.

**Independent Test**: A staged temporary Prisma root applies baseline, backfills a legacy Product through P0-A3, preserves non-target fields, reproduces partial-index behavior, and proves intentional transaction rollback. Populated resolve/deploy remains deferred until Phase 9.

### Tests and verifier implementation — M3 preparation

- [X] T016 [US5] Add failing tests for staged temporary Prisma-root construction, baseline-only/two-migration assertions, source/copy hash equality, owned-temp cleanup, and populated-postcheck refusal rules in `tests/p0A3MigrationVerifier.test.ts`
- [X] T017 [US5] Run GitNexus impact analysis for the `Product` Prisma model and migration-adjacent generated-client consumers; record blast radius and warn/stop for confirmation on HIGH/CRITICAL before editing `prisma/schema.prisma` in `artifacts/p0-a3/m3-schema-impact.md`
- [X] T018 [US5] Add `ProductStatus`, `Product.status @default(DRAFT)`, and `Product.is_indexed @default(false)` to `prisma/schema.prisma`; regenerate Prisma Client only after M2 approval
- [X] T019 [US5] Assert version-controlled history contains exactly `migration_lock.toml` plus approved baseline and no P0-A3 directory; revalidate the explicit shadow fingerprint is disposable/distinct from populated/clean/failure targets; allocate/canonicalize a new empty owned structural-SQL file outside `prisma/migrations`; generate the diff through the explicit shadow URL without exposing an incomplete migration directory to `--from-migrations`; record command/output/hash before creating `prisma/migrations/<feature>_p0_a3_basic_index_gate/migration.sql`; delete only the recorded temporary file after source/final evidence is captured
- [X] T020 [US5] Edit `prisma/migrations/<feature>_p0_a3_basic_index_gate/migration.sql` so `BEGIN`, generated enum/DDL/default changes, manual `UPDATE "products" SET "status" = 'ACTIVE', "is_indexed" = false`, and final `COMMIT` form one transaction without touching `updated_at`; hash the final SQL
- [X] T021 [US5] Prove migration-history-to-target schema parity and record structural SQL/backfill review evidence in `artifacts/p0-a3/m3/feature-migration-inspection.md`
- [X] T022 [US5] Implement staged clean-chain, failure-fixture, fingerprint, preservation, and read-only populated-postcheck modes in `scripts/verify-p0-a3-migrations.ts`; use explicit temporary `--schema` roots and never mutate/hide repository migrations
- [X] T023 [US5] Make `tests/p0A3MigrationVerifier.test.ts` pass and record output in `artifacts/p0-a3/m3/migration-verifier-tests.md`

### M4 — Disposable clean-chain and rollback proof

- [X] T024 [US5] Run `npm run verify:p0-a3:migrations -- --mode clean-chain` with independently supplied clean/failure URLs; capture staged baseline-only deploy, legacy fixture, byte-identical P0-A3 deploy, defaults, partial-index fixtures, and migration status under `artifacts/p0-a3/m4/clean-chain/`
- [X] T025 [US5] Capture the isolated failure-tree proof: copied schema/lock/baseline only, distinctly named migration containing `P0_A3_ROLLBACK_FIXTURE`, failed `_prisma_migrations` log, complete enum/column/data rollback, and unchanged production migration hash under `artifacts/p0-a3/m4/rollback-fixture/`
- [X] T026 [US5] Review M4 outputs for zero clean/failure target identity confusion, exact source/copy hashes, unchanged legacy non-target fields/`updated_at`, and no repository migration manipulation; record sign-off in `artifacts/p0-a3/m4/m4-review.md`

**Checkpoint M4**: Migration artifacts are proven only on disposable targets. Do not assemble M5 confirmation or write populated migration history until runtime implementation, tests, build, verifiers, and compatible release readiness pass.

---

## Phase 4: User Story 1 — Prevent Unpublished Products From Becoming Public or Indexable (Priority: P1) 🎯 MVP Core

**Goal**: Make new/seeded/non-active Products fail closed and stop non-public commerce before every click side effect.

**Independent Test**: A default Product is `DRAFT + false`; all eight stored combinations return the approved closed reason/outcomes; non-public `/go` returns 404 with zero UUID/Redis/Click/URL-mutation calls; active Products preserve existing click attribution and mandatory out-of-stock fallback by `priorityOrder`; the active seed creates no indexable Product and the legacy seed has no operational reference.

### Tests

- [X] T027 [P] [US1] Add failing exhaustive access-policy/reason/predicate tests for all eight lifecycle/index combinations in `tests/productAccessPolicy.test.ts` and author the initial failing cross-surface lifecycle/detail/listing/commerce consistency matrix in `tests/p0A3Integration.test.ts`
- [X] T028 [P] [US1] Add failing active-seed state, removed-file, and operational-reference classification tests in `tests/p0A3SeedSafety.test.ts`
- [X] T029 [P] [US1] Add failing commerce orchestration tests for found non-public 404/no-side-effects, found active existing flow, mandatory out-of-stock AffiliateLink fallback by `priorityOrder`, and missing/no-link redirect-home regression in `tests/goProductAccess.test.ts`; retain existing `tests/clickTracking.test.ts` fallback coverage

### Implementation

- [X] T030 [US1] Implement the pure found-Product gate, closed reason set, lifecycle-first decision matrix, and shared `ACTIVE + indexed` Prisma predicate in `src/lib/products/productAccessPolicy.ts`
- [X] T031 [US1] Run GitNexus upstream impact analysis for the active seed entry symbol/main flow immediately before editing `prisma/seed.ts`; record direct callers/processes and blast radius, warn and stop for confirmation on HIGH/CRITICAL, or record the attempted query/index limitation if GitNexus cannot index the seed symbol; then update `prisma/seed.ts` to create `DRAFT + false` Products, remove temporary auto-index comments, delete `prisma/seed.js`, and remove package/source/executable/configuration/operational references in `artifacts/p0-a3/us1-seed-impact-and-change.md`
- [X] T032 [US1] Run GitNexus impact analysis for the `/go` handler and its click/affiliate helpers, report blast radius and warn/stop for confirmation on HIGH/CRITICAL, then gate found Products before affiliate selection, UUID, Redis, Click insert, tracking mutation, or merchant redirect in `src/app/go/[slug]/route.ts`
- [X] T033 [US1] Make `tests/productAccessPolicy.test.ts`, `tests/p0A3SeedSafety.test.ts`, `tests/goProductAccess.test.ts`, and existing `tests/clickTracking.test.ts` pass, explicitly preserving out-of-stock fallback by `priorityOrder` and active Product click persistence semantics
- [X] T034 [US1] Run the User Story 1 independent checks and record defaults, seed safety, policy matrix, commerce side-effect counters, mandatory out-of-stock fallback, and preserved missing/no-link behavior in `artifacts/p0-a3/us1-fail-closed-acceptance.md`

**Checkpoint US1**: Creation/seed/access/commerce foundations fail closed. Full public-surface consistency is completed in US3/US4.

---

## Phase 5: User Story 2 — Publish and Unpublish Products Safely From Admin (Priority: P1)

**Goal**: Give authenticated administrators explicit lifecycle/index commands that are concurrency-safe and follow Save→Redirect.

**Independent Test**: Every command reaches the approved normalized state, non-active enable rejects with no write, deterministic PostgreSQL races lose no lifecycle transition, successful actions invalidate only `/`, redirect, and display current effective state.

### Tests

- [X] T035 [P] [US2] Add failing command parsing/normalization/zero-row classification tests in `tests/productPublishingCommands.test.ts`
- [X] T036 [P] [US2] Add failing tests for Admin action success/rejection/concurrency-conflict behavior, homepage-only invalidation, Save→Redirect, and post-command public-surface state expectations in `tests/adminProductPublishing.test.ts`
- [X] T037 [P] [US2] Add deterministic PostgreSQL race scenarios and cleanup/refusal tests for the dedicated verifier in `tests/productPublishingConcurrency.test.ts`

### Implementation

- [X] T038 [US2] Implement command-shaped operations—lifecycle writes both fields, conditional active-only enable writes index only, disable writes index only—in `src/lib/products/productPublishingCommands.ts`
- [X] T039 [US2] Implement the disposable-database row-lock/barrier race verifier in `scripts/verify-product-publishing-concurrency.ts`
- [X] T040 [US2] Run GitNexus impact analysis for `AdminProductsPage` and existing Admin redirect/auth helpers, report risk and warn/stop for confirmation on HIGH/CRITICAL, then implement authenticated Save→Redirect actions with homepage-only invalidation in `src/app/(admin)/admin/products/actions.ts`
- [X] T041 [US2] Update `src/app/(admin)/admin/products/page.tsx` with lifecycle forms, explicit enable/disable controls, stored/effective badges, and non-nested specifications navigation
- [X] T042 [US2] Make `tests/productPublishingCommands.test.ts`, `tests/adminProductPublishing.test.ts`, and `tests/productPublishingConcurrency.test.ts` pass using an explicitly disposable migrated database where PostgreSQL behavior is required
- [X] T043 [US2] Run `npm run verify:p0-a3:publishing-concurrency` against an explicit disposable database that passed the baseline→P0-A3 chain and record enable-vs-DRAFT/BLOCKED/ARCHIVED plus disable-vs-lifecycle evidence in `artifacts/p0-a3/us2-concurrency.md`
- [X] T044 [US2] Complete Admin command/UI/redirect/invalidation acceptance in `artifacts/p0-a3/us2-admin-publishing-acceptance.md`

**Checkpoint US2**: Admin can safely change lifecycle/index state without stale full-row writes or silent saves.

---

## Phase 6: User Story 3 — Keep Every Public Discovery Surface Consistent (Priority: P1)

**Goal**: Make detail metadata/body, homepage, category, canonical URLs, structured offers, and runtime cache behavior consume one policy and one request-scoped Product snapshot.

**Independent Test**: Each state produces the approved detail/robots/listing outcome; metadata and body share one result regardless of consumer order; a between-consumer mutation is visible only on the next request; canonical paths/origins are exact.

### Tests

- [X] T045 [P] [US3] Add failing canonical-origin/path/string/non-mutation cases in `tests/siteUrl.test.ts`
- [X] T046 [P] [US3] Add failing pure title/trimmed-description/robots/canonical metadata cases in `tests/productMetadata.test.ts` and the metadata side of the cross-surface matrix in `tests/p0A3Integration.test.ts`
- [X] T047 [P] [US3] Add failing uncached-loader tests for missing/non-public early exits, one clock/snapshot/decision/offer, specification-read ordering, and immutable race results in `tests/productPageData.test.ts`
- [X] T048 [P] [US3] Add failing source acceptance for homepage/category shared predicates, request-boundary ordering, exact ISR/dynamic declarations, no stale category revalidate, shared loader imports, no public probe controls, owned probe safeguards, and normative verifier script mappings in `tests/p0A3SourceAcceptance.test.ts`

### Implementation

- [X] T049 [P] [US3] Implement strict canonical origin parsing and exact Product URL construction in `src/lib/siteUrl.ts`
- [X] T050 [P] [US3] Implement the pure Product metadata mapper in `src/lib/products/productMetadata.ts`
- [X] T051 [US3] Implement the uncached Product-page orchestration core, module-level React-cached loader, request boundary, and public result contract in `src/lib/products/productPageData.ts`
- [X] T052 [US3] Implement the runtime-only loopback/slug/token/fingerprint/owned-temp probe and request-cached session allocator in `src/lib/products/productPageCacheProbe.ts`
- [X] T053 [US3] Run GitNexus impact analysis for `ProductDetailPage` and `loadSpecificationData`; warn/stop for confirmation on HIGH/CRITICAL, leave `loadSpecificationData` unchanged, preserve the unrelated hero-copy hunk, then integrate shared loader, `generateMetadata`, not-found ordering, canonical metadata, structured data, offers, and post-gate specifications in `src/app/(public)/products/[slug]/page.tsx`
- [X] T054 [US3] Run GitNexus upstream impact analysis for the homepage page symbol immediately before editing `src/app/(public)/page.tsx`; record direct callers/processes and risk, warn and stop for confirmation on HIGH/CRITICAL, then update Product selection to use the shared active-indexed predicate while preserving exact 86400-second ISR in `artifacts/p0-a3/us3-homepage-impact-and-change.md`
- [X] T055 [US3] Run GitNexus impact analysis for the category page, report risk and warn/stop for confirmation on HIGH/CRITICAL, remove stale revalidation, add the request boundary before inputs/query, and use the shared predicate in `src/app/(public)/category/[slug]/page.tsx`
- [X] T056 [US3] Implement the focused built-Next HTTP cache/race verifier with loopback binding, random slug/token/port, order-independent barriers, same-server distinct sessions, owned cleanup, and bounded failure handling in `scripts/verify-product-page-cache-runtime.ts`
- [X] T057 [US3] Make `tests/siteUrl.test.ts`, `tests/productMetadata.test.ts`, `tests/productPageData.test.ts`, and relevant `tests/p0A3SourceAcceptance.test.ts` cases pass
- [X] T058 [US3] Build the application and run `npm run verify:p0-a3:cache-runtime` against an explicit disposable datasource that passed baseline→P0-A3; record one-load/evaluation, shared R/T, next-request R2/T2, loopback, session, and cleanup evidence in `artifacts/p0-a3/us3-cache-runtime.md`
- [X] T059 [US3] Complete detail/metadata/homepage/category/canonical route acceptance in `artifacts/p0-a3/us3-public-surface-acceptance.md`

**Checkpoint US3**: Product detail, metadata, homepage, and category consistently enforce the Basic Index Gate and shared request snapshot on disposable migrated infrastructure.

---

## Phase 7: User Story 4 — Generate Only Current, Deterministic Sitemap Entries (Priority: P1)

**Goal**: Add a request-time Product-only sitemap that uses the shared predicate and canonical URL policy without fabricated fallback data.

**Independent Test**: The sitemap is empty with zero eligible Products, includes only active-indexed rows in raw slug order, emits string URLs and real timestamps, changes on the next request without invalidation, and throws on invalid origin/query failure.

### Tests

- [X] T060 [P] [US4] Add failing sitemap mapping/query-intent/error/empty/order/string-URL tests in `tests/productSitemap.test.ts` and the sitemap side of the cross-surface matrix in `tests/p0A3Integration.test.ts`
- [X] T061 [P] [US4] Add failing route-source/build-classification acceptance for request boundary, no priority/changeFrequency, and dynamic `/sitemap.xml` in `tests/p0A3SourceAcceptance.test.ts`

### Implementation

- [X] T062 [US4] Implement the pure deterministic row-to-entry mapper using `getProductCanonicalUrl(...).toString()` in `src/lib/products/productSitemap.ts`
- [X] T063 [US4] Implement request-time `MetadataRoute.Sitemap`, strict origin failure, shared active-indexed query, `slug asc`, and `{url,lastModified}` output in `src/app/sitemap.ts`
- [X] T064 [US4] Make `tests/productSitemap.test.ts` and sitemap cases in `tests/p0A3SourceAcceptance.test.ts` pass
- [X] T065 [US4] Verify empty/indexed/blocked/archived/error behavior and dynamic build classification; record evidence in `artifacts/p0-a3/us4-sitemap-acceptance.md`

**Checkpoint US4**: Runtime implementation is complete on disposable migrated infrastructure. Populated history/data are still untouched.

---

## Phase 8: Pre-Populated Full Verification and Compatible Release Readiness

**Purpose**: Prove the complete runtime against explicitly disposable baseline→P0-A3 databases and produce a deployable, identifiable application artifact before refreshing M5 evidence.

- [X] T066 [P] Run and review the complete cross-surface lifecycle/listing/detail/metadata/sitemap/commerce acceptance suite plus operational legacy-seed reference classification in `tests/p0A3Integration.test.ts`; do not add first-time behavioral coverage in this phase
- [X] T067 [P] Run and review the completed `tests/p0A3SourceAcceptance.test.ts` checks for request-boundary order, exact cache declarations, shared predicate imports, no stale category revalidate, no public probe controls, owned probe safeguards, and normative verifier mappings; do not add first-time source-contract coverage in this phase
- [X] T068 Run lint, `npx tsc --noEmit --incremental false`, the complete Node test suite, and production build; verify the route table and start/smoke the built artifact against an explicit disposable database that passed baseline→P0-A3; record output in `artifacts/p0-a3/release-readiness/static-build-and-route-verification.md`
- [X] T069 Re-run `npm run verify:p0-a3:migrations -- --mode clean-chain` against fresh explicit disposable clean/failure databases and record final baseline→P0-A3 plus rollback evidence in `artifacts/p0-a3/release-readiness/migration-clean-chain.md`
- [X] T070 Re-run `npm run verify:p0-a3:publishing-concurrency` and `npm run verify:p0-a3:cache-runtime` only against explicit disposable migrated databases; record outputs and fingerprints in `artifacts/p0-a3/release-readiness/runtime-verifiers.md`
- [X] T071 Verify P0-A1 Admin auth, P0-A2 structured-offer freshness, active click attribution, and mandatory out-of-stock fallback tests pass unchanged; record regression evidence in `artifacts/p0-a3/release-readiness/p0-a1-p0-a2-commerce-regression.md`
- [X] T072 Produce the immutable compatible application release-artifact identifier/checksum plus environment/config manifest, disposable startup smoke evidence, deployment order, traffic-drain/maintenance procedure, rollback/recovery procedure, and named operator handoff in `artifacts/p0-a3/release-readiness/compatible-release-artifact.md`; do not proceed unless this exact artifact can be rolled out immediately after M6 before traffic resumes

**Checkpoint Release Ready**: Compatible runtime code is fully tested/built, its exact deployable artifact is identified, and operations can keep old application traffic drained between M6 and rollout.

---

## Phase 9: User Story 5 Part B — Refreshed M5 Gate, Populated Apply, and Compatible Rollout (Priority: P1)

> **Operator deferral — 2026-08-27:** T073–T082 and every VPS deployment are intentionally deferred until the entire DeskHolt project is complete. Vercel + Neon are temporary validation infrastructure and do not constitute the final production rollout. Do not resume this phase from an incremental feature request; require an explicit whole-project production-release decision, a newly approved deployment architecture/runbook, and a fresh T004-P backup/restore gate.

**Goal**: Register the approved baseline and apply only P0-A3 to the populated database with a compatible release artifact ready, no old-application exposure window, and exact preservation proof.

### Refresh evidence and STOP M5

- [ ] T073 [US5] **T004-P production operations gate**: before any M5/populated operation, verify production VPS/database identity, off-VPS automatic backup destination/provider, recent successful run, automatic deletion beyond 30 days, current retention/oldest-backup evidence, selected production backup ID/path/timestamp/target fingerprint/checksum where supported, and restore procedure or recent restore-test evidence; if production infrastructure/evidence is absent, stop and keep T073+ blocked; after it passes, immediately refresh the populated identity tuple and exact keyed snapshot/hash, revalidate clean-chain/runtime/build results, exact release-artifact checksum, migration-role privileges/limitations, and baseline/feature hashes; assemble `artifacts/p0-a3/m5-resolve-confirmation-packet.md`
- [ ] T074 [US5] **STOP M5** Present `artifacts/p0-a3/m5-resolve-confirmation-packet.md` and wait for exact `CONFIRM BASELINE RESOLVE <name> SHA256=<hash> FINGERPRINT=<approved-id>`; record the human response in `artifacts/p0-a3/m5-resolve-confirmation.md` and do not start T075 without it

### M5 — Register the approved baseline

- [ ] T075 [US5] Recompute the full populated identity tuple, require exact approved equality, then run only `prisma migrate resolve --applied <baseline>`; save exact command/status/data-unchanged evidence in `artifacts/p0-a3/m5/baseline-resolve.md`
- [ ] T076 [US5] Verify baseline is applied, exactly P0-A3 remains pending, baseline DDL did not execute, and row/object evidence is unchanged in `artifacts/p0-a3/m5/post-resolve-verification.md`

**Checkpoint M5**: The approved baseline is recorded without executing baseline DDL, application data/objects are unchanged, and exactly P0-A3 remains pending.

### M6 — Maintenance-coordinated feature deploy and rollout

- [ ] T077 [US5] In a separate operator-visible step, activate the approved traffic-drain/maintenance procedure and verify old application instances cannot serve public/Admin traffic; recapture the full preservation snapshot/hash while quiescent and require exact equality with T073—if it changed, keep traffic blocked, do not deploy, refresh the M5 packet, and obtain a new exact T074 confirmation; then recheck the exact T072 release artifact, recompute the full populated identity tuple, reject every clean/shadow/failure match, verify exactly one pending migration and that it is P0-A3, and run only P0-A3 through `prisma migrate deploy`; preserve the quiescent snapshot and command/output in `artifacts/p0-a3/m6/feature-deploy.md`; on ambiguity/failure keep traffic blocked and enter the approved recovery plan
- [ ] T078 [US5] Roll out the exact compatible application artifact/checksum from T072 while traffic remains drained; verify process health using read-only/internal smoke only—Product detail GET, homepage/category GET, sitemap GET, Admin page GET, and non-public `/go` 404/no-side-effect—and keep traffic drained; prohibit Admin publishing, active commerce click flow, seed execution, write fixtures, Redis/click side effects, or any other application DML; record artifact identity, instance transition, and smoke results in `artifacts/p0-a3/m6/compatible-application-rollout.md`; on failure keep traffic blocked, capture evidence, and enter the approved recovery procedure without retry/manual repair
- [ ] T079 [US5] While traffic remains drained and application writes remain prohibited, independently supply `P0_A3_POPULATED_DATABASE_URL` and run read-only `npm run verify:p0-a3:migrations -- --mode populated-postcheck --expected-fingerprint <approved-id>`; compare against the exact T073 pre-apply snapshot/hash revalidated quiescently in T077, prove keyed equality, unchanged counts/orphans/indexes, 20 `ACTIVE + false` Products, new `DRAFT + false` default, and current history in `artifacts/p0-a3/m6/populated-postcheck-and-us5-acceptance.md`; on failure keep traffic blocked, capture evidence, and enter the approved recovery procedure without retry/manual repair

**Checkpoint US5/M6**: Populated migration history is current, the compatible artifact is healthy, preservation is proven on a quiescent database, and traffic remains drained until T080.

---

## Phase 10: Final Post-Rollout Evidence and Scope Verification

- [ ] T080 Only after T079 passes, restore traffic to the exact compatible artifact, run public post-restore read-only smoke plus one controlled active-commerce fallback/click evidence flow, then run `git diff --check` and full-diff review; confirm the unrelated Product hero-copy hunk remains preserved and record traffic-restoration time, smoke/write evidence, and review results in `artifacts/p0-a3/final/post-rollout-and-diff-review.md`
- [ ] T081 Run `gitnexus_detect_changes()` before any commit, review affected symbols/execution flows against approved scope, and record the report in `artifacts/p0-a3/final/gitnexus-detect-changes.md`
- [ ] T082 Assemble the final P0-A3 evidence index linking M-1 through M6, both human approvals, compatible release/rollout identity, five story acceptances, route table, tests, disposable verifiers, populated postcheck, fingerprints, and preservation hashes in `artifacts/p0-a3/final/evidence-index.md`

---

## Dependencies and Execution Order

### Hard gate and release graph

```text
T001–T004  M-1
    ↓
T005–T010  M0
    ↓
T011–T014  M1
    ↓
T015       STOP M2: APPROVE BASELINE ARTIFACT
    ↓
T016–T023  M3 artifact/verifier
    ↓
T024–T026  M4 disposable clean/failure proof
    ↓
T027–T065  US1–US4 runtime implementation/acceptance on disposable migrated databases
    ↓
T066–T072  full tests, production build, disposable verifiers, compatible release artifact ready
    ↓
T073–T074  refreshed evidence + STOP M5: CONFIRM BASELINE RESOLVE
    ↓
T075–T076  M5 baseline resolve and verification
    ↓
T077       traffic drained + M6 P0-A3 deploy
    ↓
T078       exact compatible artifact rollout + read-only/internal smoke; traffic stays drained
    ↓
T079       quiescent read-only populated postcheck and US5 acceptance
    ↓
T080       traffic restore + post-restore smoke/diff review
    ↓
T081–T082  final scope/evidence verification
```

No task after T015 may start before M2 approval. T075 may not start before the exact T074 confirmation. T077 may not start until T076 proves baseline-only registration succeeded and T072's exact compatible artifact remains ready. Resolve, feature deploy, and application rollout are separate operator-visible tasks and may not be wrapped by one unattended script, shell chain, verifier mode, or automatic continuation.

Old application traffic must be drained before T077 and cannot resume until T079 proves the exact compatible artifact is healthy and the quiescent preservation postcheck passes. T078 permits read-only/internal smoke only and no application DML. If T077, T078, or T079 fails or commit state is ambiguous, keep traffic blocked, capture evidence, and follow the separately approved recovery procedure without retry or manual repair.

### User story graph

```text
US5 Part A: migration artifact + disposable proof
    ↓
US1 fail-closed policy/seed/commerce
    ├──→ US2 Admin publishing
    └──→ US3 public detail/listings/cache
              ↓
             US4 sitemap
              ↓
      full disposable verification/build/release artifact
              ↓
      US5 Part B: refreshed M5 → populated apply → compatible rollout/postcheck
```

- **US5 Part A** supplies the generated Product lifecycle client and disposable migrated database used by runtime development.
- **US1** establishes the shared policy used by US2–US4.
- **US2** may proceed in parallel with later US3 work only after US1 is complete and each existing-symbol impact analysis has been recorded.
- **US4** depends on the canonical URL and shared predicate delivered by US1/US3.
- **US5 Part B** cannot begin until every runtime story and Phase 8 release-readiness task passes.

### Safe implementation increment

The largest implementation increment that performs no populated migration-history/data write is:

```text
Phase 1 + Phase 2 + approved M2
→ Phase 3 M3/M4
→ Phases 4–7 US1–US4
→ Phase 8 full disposable verification and compatible release readiness
```

Phase 9 remains an explicit operations stage requiring refreshed evidence and M5 human confirmation.

---

## Parallel Execution Examples

### User Story 1

```text
T027 access-policy/integration tests
T028 seed-safety tests
T029 commerce/out-of-stock tests
```

These may run in parallel before T030–T032 because they touch separate primary test files.

### User Story 2

```text
T035 command tests
T036 Admin action tests
T037 concurrency verifier tests
```

After T038, T039 can proceed independently from Admin page work until T042 integration.

### User Story 3

```text
T045 canonical URL tests
T046 metadata tests
T047 loader tests
T048 source acceptance tests
```

After their contracts are fixed, T049 and T050 can run in parallel. T053–T056 remain ordered around GitNexus impact analysis and shared-loader integration.

### User Story 4

```text
T060 sitemap mapper/integration tests
T061 sitemap route/build acceptance tests
```

T062 precedes T063; both test files converge at T064.

---

## Implementation Notes

- Do not run `speckit-implement` until this revised `tasks.md` receives separate approval.
- Before editing any existing function/class/method or indexed entry symbol, run GitNexus upstream impact analysis and report direct callers, affected execution flows, and risk. Warn and stop for confirmation on HIGH/CRITICAL. If a seed entry symbol is not indexed, record the attempted query/index limitation before editing.
- Never run `migrate reset`, `db push`, `migrate dev`, baseline DDL, or a write probe against the populated database.
- Use explicit datasource variables/fingerprints for every verifier. `populated-postcheck` must never derive from ambient `DATABASE_URL`.
- Before Phase 9, every PostgreSQL/runtime verifier must use only an explicitly disposable target that passed baseline→P0-A3 clean-chain proof.
- All temporary roots/files must be owned, canonicalized, bounded, and safely cleaned.
- Keep baseline generation, M2 approval, feature generation/clean chain, runtime implementation, release readiness, M5 confirmation, baseline resolve, feature deploy, compatible application rollout, and populated postcheck as separate tasks/evidence records.
- Never allow the old application to serve traffic after P0-A3 is applied; keep all traffic drained through compatible-artifact rollout, read-only/internal smoke, and the quiescent populated preservation postcheck. Restore traffic only in T080 after T079 passes.
- Commit only after final verification and `gitnexus_detect_changes()`; no commit is part of this task-revision phase.
