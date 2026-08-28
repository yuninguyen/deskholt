# Phase 0 Research: P0-A3 Basic Index Gate

All product-policy decisions were settled during specification review. This document records repository-specific technical decisions required to plan implementation without reopening architecture or performing migrations.

## Decision 0: Pin the evidenced current Prisma toolchain before generating SQL

- **Decision**: Pin both `prisma` and `@prisma/client` to exact `5.22.0`, which is the version currently installed and locked, then verify CLI/client/engine identity and Node 24 compatibility before generating either migration artifact.
- **Rationale**: `package.json` uses a `^5.19.0` lower bound, while `package-lock.json`, CLI, and client currently resolve reproducibly to 5.22.0. Pinning the current resolved version removes future caret drift without introducing an unproven downgrade immediately before baselining a populated database.
- **Smoke gate**: record CLI/client version and engine commit/hash; run `prisma generate`, `prisma validate`, read-only live/schema diff/inventory access, and the repository test suite under Node 24. Any failure or second effective Prisma version blocks baseline generation.
- **Alternatives considered**:
  - Pin 5.19.0 from the caret lower bound — rejected because no repository evidence shows it is the canonical engine for the current lockfile/database, and a downgrade would add tool behavior risk.
  - Leave caret ranges after generation — rejected because later clean-chain/deployment runs could silently use a different 5.x engine.

## Decision 1: Establish Prisma Migrate history by baselining before P0-A3

- **Decision**: Treat the current `localhost`/`deskholt_db`/`public` database as local development only after T004-L creates a fresh PostgreSQL logical backup, restores it into a different disposable local database, and compares Product counts, row counts, keyed relationships, orphan counts, and schema/object inventory. Then create a pre-feature baseline migration for the complete current application schema, prove that the local/disposable database is compatible with it, and stop for explicit human review. After approval, create and inspect the separate P0-A3 migration and prove baseline plus P0-A3 on isolated disposable databases. Populated/prod baseline registration and P0-A3 apply remain deferred until T004-P, US1–US4, full tests, disposable verifiers, production build/route checks, and an exact compatible release artifact plus traffic-drain/rollout/recovery procedure are ready. If production infrastructure does not exist, local implementation may proceed through T072 but T073+/M5/M6 remain blocked.
- **Rationale**: The configured PostgreSQL database contains application data but `prisma/migrations` has no history. Running a normal development migration first can report drift or request reset. Baseline registration provides a reproducible clean-deployment chain without executing existing-object DDL or deleting the populated database.
- **Alternatives considered**:
  - One initial migration containing the post-P0-A3 schema — rejected because baseline and feature change/backfill would be inseparable and clean/populated execution paths would be difficult to audit.
  - Version-controlled standalone SQL without Prisma history — rejected because the database would remain unmanaged and clean deployment would remain unresolved.
  - `prisma db push` — rejected because it neither establishes auditable migration history nor satisfies preservation/clean-chain requirements.

### Planning-only baseline sequence

1. Confirm the current target is local development (`localhost`, `deskholt_db`, `public`), with no production VPS and no production traffic.
2. Create a fresh PostgreSQL logical backup with `pg_dump` outside the repository, record timestamp/source fingerprint/SHA-256, restore it into a different disposable local database, and compare 20 Products, row counts, keyed relationships, orphan counts, and schema/object inventory. This is T004-L and permits local implementation through T072.
3. Capture a read-only execution-time snapshot of data counts, orphan counts, identities, and exact keyed foreign-key mappings.
4. Inventory live PostgreSQL objects: tables, columns/defaults, enums, PK/FK/check constraints, ordinary and partial indexes, views, materialized views, sequences, routines, triggers, and extensions.
5. Generate baseline SQL from empty state to the approved pre-P0-A3 schema using Prisma's read-only migration diff tooling.
6. Add the two existing ProductAttribute partial unique indexes to baseline SQL because the Prisma data model cannot represent them.
7. Inspect baseline SQL and compare local/disposable database to active data model; separately reconcile unsupported DB-only objects against the inventory.
8. Produce a compatibility evidence packet. Do **not** continue automatically.
9. **Mandatory artifact approval gate**: `APPROVE BASELINE ARTIFACT <name> SHA256=<hash>` authorizes continued preparation but does not write or immediately authorize populated migration history.
10. Update the data model for P0-A3, generate the separate feature migration through the disposable shadow database, inspect its SQL, and prove migration-history-to-target parity.
11. Apply baseline then P0-A3 on isolated disposable clean/failure databases and pass defaults, partial-index, migration-status, and atomic-rollback verification.
12. Implement US1–US4 and pass full tests, disposable publishing-concurrency/cache-runtime/migration verifiers, production build, route-table/startup checks, and regression coverage without using the populated datasource.
13. Produce an exact compatible release artifact identifier/checksum and approved traffic-drain, rollout, rollback/recovery, and operations-handoff procedure.
14. Before T073/M5, perform T004-P: verify production VPS/database identity, off-VPS automatic backup/recent success, >30-day deletion/retention, selected production backup identity/checksum, and restore procedure/test. If production infrastructure/evidence does not exist, stop at T072.
15. Only after steps 9–14 pass, refresh the populated snapshot/fingerprint, present current clean-chain/runtime/build/release/hash/backup/preservation evidence, obtain `CONFIRM BASELINE RESOLVE <name> SHA256=<hash> FINGERPRINT=<approved-id>`, then run only the exact confirmed `prisma migrate resolve --applied <baseline-name>`; verify baseline recorded and exactly P0-A3 pending.
16. Drain traffic, recapture the quiescent preservation snapshot/hash and require exact equality with the M5-confirmed snapshot (otherwise keep traffic blocked, refresh the packet, and obtain a new confirmation), revalidate the fingerprint/release artifact, and apply only P0-A3 while old application instances cannot serve requests.
17. Roll out the exact compatible artifact while traffic remains drained; permit only read-only/internal smoke and prohibit Admin publishing, active commerce clicks, seed/write fixtures, and other application DML.
18. While still drained, run the read-only populated postcheck against the exact step-15 snapshot. On success restore traffic and run post-restore smoke/controlled active-commerce evidence; on any rollout/postcheck failure keep traffic blocked and enter the approved recovery procedure without retry/manual repair.

Baseline generation, approval, clean-chain proof, runtime/release readiness, `resolve --applied`, P0-A3 deploy, compatible rollout, quiescent postcheck, and traffic restore are deliberately separate tasks/checkpoints. Approval is necessary but not sufficient for resolution; planning and task generation must not combine them into one unattended command sequence.

## Decision 2: Treat the live database inventory as two parallel compatibility layers

- **Decision**: Compatibility proof has two layers:
  1. Prisma-representable schema parity between the live datasource and active data model.
  2. Explicit PostgreSQL inventory for objects Prisma cannot represent or compare fully.
- **Rationale**: A fresh live-database-to-active-model diff reported an empty representable migration, but the live database also contains two partial unique indexes omitted from the Prisma model language. An empty Prisma diff alone is therefore insufficient proof of baseline parity.
- **Current audited classification**:
  - 10 application tables: represented.
  - 4 application enums: represented.
  - PKs, FKs, ordinary unique/secondary indexes: represented.
  - Views/materialized views/sequences/routines/triggers: none.
  - `plpgsql`: database infrastructure.
  - Application-owned DB-only objects: exactly the two ProductAttribute partial unique indexes.
- **Datasource identity**: approval evidence records effective schema/search path, database OID, server and cluster identity in addition to host/port/name. Identity comparison uses the cluster+database+schema tuple: OIDs must differ for targets on the same cluster, while equal numeric OIDs across distinct clusters are valid. This detects wrong-schema connections and recreated databases that a URL-only fingerprint would miss. If cluster system identity is permission-blocked, the limitation is recorded and manually approved rather than treated as strong identity.
- **Alternatives considered**:
  - Trust only `prisma migrate diff` — rejected because unsupported partial indexes would be silently omitted.
  - Fingerprint only host/port/database name — rejected because it misses effective schema and recreated database/cluster identity.
  - Treat every PostgreSQL object as application-owned — rejected because standard database infrastructure such as `plpgsql` is not a feature migration responsibility.

## Decision 3: Put existing partial unique invariants in the baseline

- **Decision**: Baseline SQL must create:
  - `product_attributes_product_attribute_unique` on `(product_id, attribute_definition_id)` where `variant_id IS NULL`.
  - `product_attributes_variant_attribute_unique` on `(variant_id, attribute_definition_id)` where `variant_id IS NOT NULL`.
- **Rationale**: They are live application invariants required by Blueprint V3.1.1 and must exist on clean deployments. The current standalone manual SQL file is not migration history.
- **Verification**:
  - existence by exact name and predicate;
  - duplicate product-level null-variant attribute is rejected;
  - same attribute on different non-null variants is allowed;
  - duplicate attribute on the same non-null variant is rejected.
- **Alternatives considered**:
  - Defer them to the later partial-index task — rejected because the baseline would fail to reproduce the current application schema and clean deployment invariants.
  - Move them into the P0-A3 feature migration — rejected because they pre-exist P0-A3 and belong in the baseline state.

## Decision 4: Create a separate P0-A3 migration with deterministic backfill

- **Decision**: Generate structural SQL from the migration-history/schema diff, then manually insert the approved Product backfill and wrap the complete P0-A3 migration in one explicit PostgreSQL `BEGIN`/`COMMIT` transaction.
- **Rationale**: Schema diff can create enum/column/default changes but cannot infer the business transition for existing rows. Explicit transaction boundaries prevent a failure between enum, defaults, and backfill from leaving partial feature state.
- **Required SQL review concerns**:
  - `BEGIN` precedes every feature statement and `COMMIT` is final;
  - every statement is transaction-compatible in the approved PostgreSQL version;
  - enum creation is non-destructive;
  - status column default is `DRAFT` for future inserts;
  - manually inserted `UPDATE "products" SET "status" = 'ACTIVE', "is_indexed" = false` changes every existing row;
  - the backfill does not touch `updated_at` or another field;
  - `is_indexed` default changes to false;
  - no table recreation, record deletion, or relation rewrite occurs;
  - final edited SQL receives a checksum and an intentional-failure fixture proves full rollback.
- **Alternatives considered**:
  - Backfill existing rows to draft — rejected because all direct Product pages and commerce would disappear.
  - Preserve existing index=true values — rejected because current Products have not passed the new explicit publication gate.

## Decision 5: Verify both clean and populated migration paths

- **Decision**: Use two isolated paths:
  - clean PostgreSQL database: apply baseline then P0-A3 through migration deploy;
  - populated configured database: register approved baseline, then apply only P0-A3.
- **Rationale**: A migration chain is not proven by only one path. Clean deployment proves reproducibility; populated deployment proves non-destructive advancement and backfill.
- **Preservation authority**: deterministic sorted snapshot/checksum, not aggregate counts alone. Compare at minimum:
  - `Product.id ↔ slug`;
  - `AffiliateLink.id → product_id`;
  - `Click.id/click_id → product_id`;
  - Conversion-to-Click linkage;
  - `ProductVariant.id → product_id`;
  - `ProductAttribute.id → product_id/variant_id`;
  - row counts and orphan counts.
- **Alternatives considered**:
  - Counts only — rejected because equal counts do not detect reassigned relationships.
  - Test only clean database — rejected because it does not prove preservation/backfill.
  - Test only populated database — rejected because it does not prove clean deployment parity.

## Decision 6: Use one pure access policy and explicit publishing commands

- **Decision**: Separate found-Product access evaluation from Product lookup. The gate returns exactly one lifecycle-first reason (`draft`, `blocked`, `archived`, `explicit-noindex`, `eligible`). Missing is a separate lookup result. Publishing commands are `set-lifecycle`, `enable-index`, or `disable-index`.
- **Rationale**: This prevents a missing record from being confused with a persisted lifecycle state and removes ambiguity between lifecycle normalization and explicit index enablement.
- **Command rules**:
  - set lifecycle `DRAFT`, `BLOCKED`, or `ARCHIVED` → same lifecycle + non-indexable;
  - set lifecycle `ACTIVE` → always `ACTIVE + non-indexable`, regardless of old flag;
  - enable index → only when effective lifecycle is `ACTIVE`;
  - disable index → preserve lifecycle, set index false.
- **Concurrency decision**: use command-shaped atomic writes. Lifecycle updates both publishing fields; enable uses `UPDATE ... WHERE id = ? AND status = ACTIVE` and writes only the index flag; disable writes only the index flag. PostgreSQL reevaluates the conditional predicate after a row-lock wait, preventing a concurrent non-active lifecycle transition from being overwritten by a stale enable decision.
- **Alternatives considered**:
  - Read current row inside a default transaction then write both fields — rejected because `READ COMMITTED` permits stale reads and lost lifecycle transitions without row locking.
  - Serializable isolation/retry or explicit `SELECT FOR UPDATE` — valid but more complex than the required conditional writes.
  - One combined status/checkbox update — rejected because malformed legacy flags could index a Product without an explicit enable command.
  - Add `missing` to Product reason enum — rejected because no Product exists to evaluate.

## Decision 7: Share one request-time Product-page result between metadata and body

- **Decision**: A module-level request-memoized Product-page loader owns the request boundary, one evaluation timestamp, Product/AffiliateLink query, access decision, and P0-A2 offer presentation. Metadata and body consume the same discriminated result (`missing`, `non-public`, `public`).
- **Rationale**: Prisma reads are not automatically memoized like `fetch`. Metadata may execute before the page. Central ownership prevents two snapshots, two clocks, and lifecycle/offer drift within one render.
- **Boundary**:
  - missing/non-public stop before specifications loading;
  - public result includes the offer presentation;
  - specifications remain a page-only query after public eligibility succeeds.
- **Verification**:
  - unit tests cover the uncached orchestration core;
  - one focused built-Next HTTP harness uses an env/token/fingerprint-gated, consumer-order-independent file barrier: the first metadata-or-page consumer loads/records and waits, the second pauses before loader use, the external driver mutates isolated data and releases both; probes prove one load/evaluation and identical result version/timestamp, while a fresh second request sees the mutation;
  - the harness exposes no HTTP test-control route and always terminates the managed server/cleans fixtures and probe files.
- **Alternatives considered**:
  - Ordinary `tsx` calls to React `cache()` — rejected because they do not create Next/React request-render cache scope.
  - Downgrade acceptance to source wiring plus documentation — rejected because the approved race acceptance remains binding.
  - A general browser/integration framework — rejected as unnecessary; one focused HTTP driver and server-only probe are sufficient.
  - Separate metadata/page queries — rejected due race/drift risk.
  - Put Product gate in proxy/middleware — rejected because it requires database/ORM access and cannot own P0-A2 request-clock semantics.

## Decision 8: Make request-time rendering contracts explicit

- **Decision**:
  - homepage remains 24-hour ISR and is the only surface revalidated after Admin publishing changes;
  - category explicitly waits for a request before resolving request inputs/querying and removes its misleading time revalidation export;
  - Product detail becomes dynamic through the shared loader request boundary;
  - sitemap explicitly waits for a request before querying;
  - Admin product list remains force-dynamic.
- **Rationale**: Production build already reports category and Product detail as dynamic. Explicit request-time boundaries make correctness reviewable rather than relying on incidental framework detection.
- **Admin invalidation**: only `/`.
- **Alternatives considered**:
  - Revalidate dynamic routes — rejected because it adds no correctness guarantee and obscures which surfaces are cached.
  - Make homepage dynamic — rejected because existing bounded ISR is adequate when the publishing action invalidates it.

## Decision 9: Use one validated canonical-origin and Product-path policy

- **Decision**: Parse a shared canonical origin and build Product paths exactly as `/products/${encodeURIComponent(rawPersistedSlug)}`.
- **Origin rules**:
  - undefined/blank → `https://deskholt.com`;
  - explicit URL must be HTTP(S), have hostname, no credentials, path exactly `/`, no query/hash;
  - custom port allowed;
  - malformed explicit configuration throws;
  - no request-host inference.
- **Path rules**: encode raw slug exactly once, no trailing slash, no case normalization, no mutation of supplied origin.
- **Rationale**: Metadata and sitemap must not drift through hand-built strings or permissive URL normalization.
- **Alternatives considered**:
  - Infer request host — rejected as untrusted/non-canonical.
  - Silently strip path/query/hash — rejected because it hides operator misconfiguration.

## Decision 10: Generate a dynamic deterministic Product-only sitemap

- **Decision**: Sitemap evaluates current database state at request time, filters by the shared `ACTIVE + indexed` predicate, orders by slug ascending, and maps only canonical URL plus real `updated_at`.
- **Rationale**: State changes outside Admin must appear on the next sitemap request. Deterministic ordering supports stable tests/debugging. Priority/change frequency have no current provenance.
- **Failure behavior**: invalid canonical origin or database query failure throws; zero eligible Products returns a valid empty Product sitemap.
- **Alternatives considered**:
  - Cached sitemap plus invalidation — rejected because manual/migration changes could leave it stale.
  - Add unrelated URLs to avoid emptiness — rejected as scope expansion.

## Decision 11: Gate commerce before all click side effects

- **Decision**: Product lookup occurs first; found Product access is evaluated before affiliate selection, UUID generation, Redis, PostgreSQL click insert, tracking URL mutation, or merchant redirect.
- **Rationale**: Non-public Products must not leak existence into commerce behavior or create attribution side effects.
- **Bounded behavior**:
  - non-public found Product → HTTP 404, no side effects;
  - active noindex/indexed → existing commerce flow;
  - missing Product/no selected affiliate link → preserve current redirect-home behavior;
  - persistence redesign remains P0-B.

## Decision 12: Keep Admin publishing UI bounded and redirect-based

- **Decision**: Add lifecycle controls and explicit enable/disable index commands per Product row on the existing Admin list. Each command validates server-side, performs an atomic update, invalidates homepage on success, and redirects.
- **Rationale**: This supplies the operational publishing control required by the gate while respecting Constitution Principles III and IV.
- **Alternatives considered**:
  - Full Product editor — rejected as out of scope.
  - Bulk or optimistic saves — rejected due higher accidental-publication risk and conflict with Save→Redirect.

## Decision 13: Fix the active seed and remove the legacy duplicate

- **Decision**: The active TypeScript seed creates `DRAFT + non-indexable` Products and removes temporary auto-index comments. Delete `prisma/seed.js` and verify no package script, source import, executable/configuration reference, or operational instruction targets it; historical specification/review mentions remain valid audit evidence.
- **Rationale**: Every creation path must obey the new safe default. The duplicate JavaScript seed is destructive, auto-indexing, unguarded, and unused by the package seed command.
- **Alternatives considered**:
  - Keep a hard-failing tombstone — rejected because removal was explicitly approved and no legitimate caller exists.
  - Add full allowlist/opt-in safety now — deferred to the separate Seed Safety P0 task.

## Decision 14: Test contracts without brittle Next.js mocks

- **Decision**: Put policy, command normalization, metadata mapping, canonical URL parsing/building, sitemap mapping, and commerce eligibility at pure/testable boundaries. Use source/build acceptance for framework wiring and targeted instrumentation for shared-loader behavior.
- **Rationale**: The repository uses Node's built-in test runner and has no full Next HTTP harness. Pure boundaries provide deterministic coverage while production build verifies framework conventions/routes.
- **Required evidence**:
  - exhaustive lifecycle/reason matrix;
  - command normalization/rejection matrix;
  - canonical origin/path cases;
  - metadata fallback/robots/canonical mapping;
  - sitemap eligibility/order/mapping;
  - shared-loader one-load race case;
  - commerce 404/no-side-effect cases;
  - baseline/feature migration clean and populated checks;
  - seed state/removal checks;
  - route table and source-order checks.
