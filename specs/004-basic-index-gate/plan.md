# Implementation Plan: P0-A3 Basic Index Gate

**Branch**: `004-basic-index-gate` | **Date**: 2026-08-25 | **Spec**: [spec.md](./spec.md)

**Input**: Approved feature specification from `/specs/004-basic-index-gate/spec.md`

## Summary

Complete the remaining P0-A public-safety blocker by introducing a fail-closed Product lifecycle/index model, one canonical access policy, consistent detail/metadata/listing/sitemap/commerce enforcement, and minimal Admin publishing commands. Before any feature migration, establish a reviewed Prisma migration baseline for the existing populated PostgreSQL database, including its two live partial unique indexes. Baseline compatibility evidence must pass a separate human approval checkpoint before `migrate resolve --applied`; planning must not combine generation and resolution into one automatic step.

## Technical Context

**Language/Version**: TypeScript 5.5, Node.js 24 runtime in the current harness, Next.js 16.3 App Router

**Primary Dependencies**: Next.js 16.3, React 18.3 (`cache`), PostgreSQL, schema-dts, Tailwind CSS; Prisma is declared as `^5.19.0` while the lockfile and installed CLI/client resolve to 5.22.0, so the plan pins both `prisma` and `@prisma/client` to the evidenced current exact version `5.22.0` before generating migration artifacts

**Storage**: PostgreSQL configured through `DATABASE_URL`; current populated database has 20 Products and no Prisma migration history

**Testing**: Node built-in test runner through `tsx --test tests/*.test.ts`; dedicated PostgreSQL migration verification against an explicitly isolated test database; production Next.js build route-table acceptance

**Target Platform**: Server-rendered web application on Node.js with PostgreSQL

**Project Type**: Single Next.js web application with public and Admin App Router route groups plus Route Handlers

**Performance Goals**: Preserve homepage ISR at exactly 86400 seconds; avoid duplicate Product/AffiliateLink queries between metadata and body; sitemap/category/detail correctness takes priority over full-route caching; no new click-path work beyond an early access decision

**Constraints**: No populated-database reset or `db push`; no baseline resolution before explicit compatibility approval; one request-scoped Product/access/offer snapshot; Save→Redirect Admin mutations; non-public commerce stops before every click side effect; P0-A2 offer freshness must not regress

**Scale/Scope**: 20 current Products; 10 application tables; 4 application enums; 2 existing partial unique indexes; one lifecycle enum/field change; five public/Admin surfaces plus `/go`; bounded Node test suite and dedicated migration verification

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-checked after Phase 1 design below.*

- **Principle I — Affiliate Data Integrity: PASS.** The migration plan forbids reset/data loss and requires exact pre/post keyed relationship snapshots for Products, AffiliateLinks, Clicks, Conversions, ProductVariants, and ProductAttributes. `/go` changes only add a pre-side-effect access gate; existing active-Product attribution flow remains unchanged.
- **Principle II — Legal & Platform Compliance: PASS.** No scraping, cookie, disclosure, or API-key behavior changes. Public affiliate links remain on existing disclosed pages.
- **Principle III — Flat Permissions: PASS.** Admin controls remain available to every authenticated administrator; no roles or approval workflow are introduced.
- **Principle IV — Save → Redirect: PASS.** Each publishing command is a Server Action that persists atomically and redirects; no silent AJAX/optimistic save is planned.
- **Principle V — No Thin pSEO Content: PASS.** The feature reduces accidental indexing. Public Product content remains server-rendered, and no advanced content-quality automation or generated filler is introduced.
- **Principle VI — Infrastructure Resilience: PASS, gated by evidence.** Existing click IP/hash behavior is unchanged. Before populated writes, the compatibility packet must prove or cite separately verified operations evidence for automatic off-VPS backups and automatic >30-day retention deletion, plus backup/restore evidence. Missing operations evidence fails M-1 rather than being assumed.
- **Principle VII — Niche Separation: N/A.** No category or vertical expansion.
- **Additional constraint — `/go` remains a Route Handler: PASS.** The gate is integrated into the existing Node.js Route Handler, not middleware/proxy.
- **Additional constraint — out-of-stock fallback: PASS.** Existing affiliate selection/fallback remains unchanged for commerce-eligible Products.

No constitution violation requires justification.

## Project Structure

### Documentation (this feature)

```text
specs/004-basic-index-gate/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── product-access.md
│   ├── publishing-commands.md
│   ├── product-page-data.md
│   ├── canonical-url-sitemap.md
│   └── migration-gates.md
├── checklists/
│   └── requirements.md
└── tasks.md                     # Created only by speckit-tasks after plan approval
```

### Source Code (repository root)

```text
package.json                                             # Pin Prisma 5.22.0 + explicit verification scripts
package-lock.json                                        # Reproducible approved Prisma toolchain

prisma/
├── schema.prisma                                      # ProductStatus + safe defaults
├── migrations/
│   ├── migration_lock.toml                            # provider = "postgresql"
│   ├── <timestamp>_baseline_existing_schema/
│   │   └── migration.sql                              # Full pre-P0-A3 schema + 2 partial indexes
│   └── <timestamp>_p0_a3_basic_index_gate/
│       └── migration.sql                              # Lifecycle/default/backfill only
├── seed.ts                                            # DRAFT + noindex creation
└── seed.js                                            # DELETE

scripts/
├── snapshot-p0-a3-database.ts                         # Read-only keyed preservation snapshot
├── verify-p0-a3-migrations.ts                         # Explicit isolated clean/populated checks
├── verify-product-publishing-concurrency.ts           # Deterministic PostgreSQL row-lock races
└── verify-product-page-cache-runtime.ts               # Focused built-Next cache/race harness

src/lib/
├── siteUrl.ts                                         # Canonical origin/path policy
└── products/
    ├── productAccessPolicy.ts                         # Gate, reasons, query predicate
    ├── productPublishingCommands.ts                   # Command parsing/normalization
    ├── productPageData.ts                             # Shared request-time cached loader
    ├── productMetadata.ts                             # Pure metadata mapping
    ├── productSitemap.ts                              # Pure deterministic mapper
    └── productPageCacheProbe.ts                       # Server-only, env-gated test synchronization; no HTTP control route

src/app/
├── sitemap.ts                                         # Dynamic Product-only sitemap
├── (public)/
│   ├── page.tsx                                       # Shared indexable predicate; homepage ISR
│   ├── category/[slug]/page.tsx                       # Explicit request-time category
│   └── products/[slug]/page.tsx                       # Shared loader + metadata + body
├── (admin)/admin/products/
│   ├── page.tsx                                       # Inline lifecycle/index commands and badges
│   └── actions.ts                                     # Save→Redirect publishing actions
└── go/[slug]/route.ts                                 # Access gate before click side effects

tests/
├── productAccessPolicy.test.ts
├── productPublishingCommands.test.ts
├── productPageData.test.ts
├── productMetadata.test.ts
├── siteUrl.test.ts
├── productSitemap.test.ts
├── goProductAccess.test.ts
├── p0A3SourceAcceptance.test.ts
└── p0A3SeedSafety.test.ts
```

**Structure Decision**: Keep the existing single Next.js repository and route organization. Add narrow pure modules for policy/mapping boundaries, one shared Product-page data loader, one Admin action file, one sitemap route, and explicit migration verification scripts. Do not create services/packages or a full integration-test framework.

## Phase 0 — Research Conclusions

Detailed rationale is recorded in [research.md](./research.md). No `NEEDS CLARIFICATION` markers remain.

Key conclusions:

1. Baseline and feature migration are separate, auditable migrations.
2. Live compatibility proof combines Prisma-representable diff and explicit PostgreSQL object inventory.
3. The two existing ProductAttribute partial unique indexes belong in baseline SQL.
4. `migrate resolve --applied` is protected by a mandatory human approval checkpoint.
5. Clean and populated migration paths are verified independently.
6. Missing Product is outside the closed found-Product gate reason set.
7. Lifecycle and index mutations are explicit separate command types.
8. Metadata/body share one request-time cached Product/access/offer result.
9. Homepage alone remains cached; category/detail/sitemap/Admin are request-time.
10. Metadata and sitemap share strict origin and exact Product path construction.
11. Commerce gate executes before all click side effects.
12. Active seed becomes draft/noindex and the legacy duplicate is deleted.

## Phase 1 — Design

### 1. Migration and database safety design

#### Checkpoint T004-L — Local implementation safety gate

- Confirm the current target is local development: host `localhost`, database `deskholt_db`, schema `public`, no production VPS exists, and no production traffic exists.
- Capture the strong local identity fingerprint: normalized host/port/database name, effective schema/search path, `current_database()`, `current_schema()`, database OID, server address/port/version, and cluster `system_identifier` when permitted. Record the approved tuple in the local evidence artifact without printing credentials.
- Create a fresh PostgreSQL logical backup with `pg_dump` to a timestamped file outside the repository. Record the backup path, timestamp, source fingerprint, and SHA-256 checksum.
- Restore that backup into a different disposable local database, never the source database. Compare at minimum 20 Products, all application row counts, keyed relationship mappings, orphan counts, and schema/object inventory. A mismatch blocks M-1 local pass.
- T004-L passing permits M0 through T072, including local/disposable baseline generation, migration artifact work, runtime implementation, and disposable verification. It does not authorize production operations or populated migration-history writes.

#### Checkpoint T004-P — Production operations gate

- T004-P is deferred until immediately before T073/M5 and is not required to continue local implementation through T072.
- Before any populated baseline resolution, populated migration deploy, production rollout, or traffic operation, verify production VPS/database identity and the full Constitution Principle VI evidence: off-production-VPS destination/provider; identified automatic backup job and recent successful run; automatic deletion of backups older than 30 days; current retention/oldest-backup evidence; selected production backup ID/path/timestamp/target fingerprint/checksum where supported; and restore procedure or recent restore-test evidence.
- If production infrastructure or any required current evidence does not exist, T073+, M5, M6, and production rollout remain blocked. Procedural documentation or a local SQLite backup is not a substitute. No destructive restore is performed on the current database.

- For all local and later production/disposable targets, capture a strong identity fingerprint: normalized URL host/port/database name; non-secret effective `schema` parameter and other identity-bearing connection settings; `current_database()`; `current_schema()`; `SHOW search_path`; `current_user`; database OID from `pg_database`; `inet_server_addr()`/`inet_server_port()`; PostgreSQL server version; and cluster `system_identifier` from `pg_control_system()` when permissions allow. Redact credentials/secrets only, not schema identity. Record unavailable cluster identity explicitly and require manual approval of that limitation.
- Treat database identity as the tuple `(cluster system_identifier when available, database OID, current_database, effective schema/search_path)`, with endpoint/user/version as supporting evidence. On the same confirmed cluster, targets must differ by database OID and database name; across different clusters, numeric OIDs may legitimately coincide. If cluster identity is unavailable, require explicit manual approval of the weaker endpoint+database OID/name+schema evidence.
- Record the exact approved populated tuple/fingerprint and compare every available field at each write boundary. A changed populated database OID, effective schema/search path, or available cluster identifier fails equality even if host/port/name match; reject clean/shadow by full identity tuple rather than raw OID alone.

#### Checkpoint M0 — Read-only preflight

- Confirm target datasource identity without printing credentials.
- Run migration status and assert the database remains unmanaged at this starting point.
- Capture exact data preservation snapshot/checksum and current lifecycle/index expectation.
- Capture full PostgreSQL object inventory and classify every object.
- Confirm live-to-active-model representable diff is empty.
- Confirm the only application-owned unsupported objects are the two known partial unique indexes.
- Run read-only migration-role privilege inventory for the effective populated schema: `has_schema_privilege` for USAGE/CREATE (covering enum and `_prisma_migrations` creation), Product table owner or membership of owning role sufficient for `ALTER TABLE`, `has_table_privilege` UPDATE on `products`, SELECT on every application table used by preservation, and readable required `pg_catalog`/metadata. Record current role, owner roles, memberships, and each boolean result.
- Do not use a write probe on the populated database. Any privilege not provable read-only is a named limitation in the M5 confirmation packet and cannot be silently treated as pass.

No schema or migration-history write is allowed in M0.

#### Checkpoint M1 — Baseline generation and inspection

- Create Prisma migration history root with `migration_lock.toml` fixed to PostgreSQL, then generate baseline SQL from empty to the pre-P0-A3 active data model.
- Insert exact SQL for the two partial unique indexes.
- Remove/replace manual post-`db push` instructions so baseline becomes the authority.
- Review table/enum/constraint/index/default parity and ensure no feature lifecycle changes appear.
- Generate a baseline inspection report containing SQL hash, object inventory classification, and compatibility diff evidence.

#### Checkpoint M2 — Mandatory approval before history write

Stop and present M0/M1 evidence. Require `APPROVE BASELINE ARTIFACT <name> SHA256=<hash>` before generating P0-A3 or running the clean chain. This approval accepts the baseline artifact/compatibility packet but does **not** authorize immediate populated history mutation.

This is a hard task boundary in `tasks.md`; it must not be an automatic continuation of baseline generation. A second just-in-time resolve confirmation is required at M5 after clean-chain success and fingerprint revalidation.

#### Checkpoint M3 — Create and inspect P0-A3 migration

After the baseline packet is approved, but still without writing populated migration history:

- update Product data model with lifecycle and safe defaults;
- before structural diff, assert version-controlled `prisma/migrations` contains exactly `migration_lock.toml` plus the approved baseline and no P0-A3 directory;
- generate structural SQL through the disposable shadow database to a newly allocated safe temporary file outside `prisma/migrations`; `--from-migrations` must never include an incomplete output directory, and `migrate dev` is forbidden against the populated database;
- inspect the temporary structural SQL, then create the final P0-A3 migration directory and copy/edit that SQL into `migration.sql`;
- manually insert the approved deterministic data backfill because schema diff cannot infer business data transitions:
  `UPDATE "products" SET "status" = 'ACTIVE', "is_indexed" = false;`;
- do not touch `updated_at` or any non-lifecycle/index field in the backfill;
- wrap the entire final migration in one explicit PostgreSQL transaction: `BEGIN` before enum/DDL, every structural statement and backfill inside it, and `COMMIT` as the final successful statement;
- verify every statement is PostgreSQL-transaction-compatible, inspect enum/column/default/backfill ordering, and reject destructive table recreation or unintended relation/index change;
- hash the final manually reviewed migration SQL, then prove baseline plus P0-A3 reproduces the target schema; separately verify backfill semantics because schema diff cannot prove data outcomes.

#### Checkpoint M4 — Clean-database chain

Against an explicitly isolated disposable PostgreSQL database:

- allocate a fresh controlled temporary Prisma root outside the repository, copy the target `schema.prisma`, and create an initially empty sibling `migrations/` containing only byte-identical `migration_lock.toml` and the approved baseline directory; assert exactly one visible migration and verify copied/source hashes;
- run every Prisma command with explicit `--schema <temp-root>/schema.prisma`; deploy baseline to the disposable clean database, insert a deterministic pre-P0 legacy Product fixture with `is_indexed = true`, and record its non-target fields/`updated_at`;
- copy the byte-identical approved P0-A3 directory into that temporary `migrations/`, assert exactly two visible migrations and both source/copy hashes, then run deploy a second time through the same explicit temporary schema;
- verify that the legacy fixture becomes `ACTIVE + false` without changing `updated_at` or other fields, proving the manually inserted backfill rather than only schema shape;
- verify temporary-root migration status current, assert a newly inserted post-P0 Product defaults to `DRAFT + false`, assert exact partial-index existence/predicates, and execute the three approved partial-index behavior fixtures;
- never move, hide, rename, or temporarily edit a version-controlled migration directory to stage clean-chain execution;
- on a second disposable failure-fixture database, create another isolated temporary Prisma root outside version control, copy the target `schema.prisma`, and create an initially empty `migrations/` containing only copied `migration_lock.toml` and the approved baseline directory; assert/hash exactly that one migration, deploy it through Prisma with explicit `--schema <failure-temp-root>/schema.prisma`, and insert the legacy fixture;
- then add exactly one distinctly named failure-fixture migration whose SQL is copied from the final P0-A3 migration with valid PL/pgSQL `DO $$ BEGIN RAISE EXCEPTION 'P0_A3_ROLLBACK_FIXTURE'; END $$;` inserted after backfill/before `COMMIT`; assert exactly baseline plus failure fixture exist and that the original production P0-A3 directory is absent;
- run `prisma migrate deploy --schema <failure-temp-root>/schema.prisma` so Prisma records the failed `_prisma_migrations` row/log containing the distinctive marker; verify the enum/column/default disappear and the legacy row retains exact pre-feature values;
- hash the version-controlled final P0-A3 migration before and after the fixture and require byte-identical content/checksum; delete the temporary tree/database evidence only after logs and assertions are captured.

A clean-chain or atomic-rollback fixture failure blocks every populated-database history/application write.

#### Checkpoint M5 — Register baseline on populated database

M5/M6 may begin only after all of the following are complete: T004-L local backup/restore pass; M2 approval; M4 disposable clean/failure proof; US1–US4 runtime implementation; full tests and disposable migration/concurrency/cache verifiers; production build and route-table/startup verification; an exact compatible release artifact identifier/checksum; T004-P production identity/backup/restore evidence; and an approved traffic-drain, rollout, rollback/recovery, and operations-handoff procedure. Before this point, no populated migration-history/application write is allowed.

Then, immediately before M5:

- recompute the full datasource/schema/cluster fingerprint and require exact equality across every available approved populated field; reject changed schema/search path/database OID/available cluster identity and any full identity-tuple match with clean/shadow;
- refresh the populated pre-apply preservation snapshot;
- present M4 success, current baseline hash, current populated fingerprint, backup evidence, preservation hash, and migration-role privilege report including any manually reviewed limitations, then require `CONFIRM BASELINE RESOLVE <name> SHA256=<hash> FINGERPRINT=<approved-id>`;
- only after that just-in-time confirmation, record the exact approved baseline migration as applied without executing baseline DDL;
- verify migration status shows the baseline applied and P0-A3 pending;
- re-run application row-count/object checks;
- stop if history or schema evidence differs from the approved packet.

#### Checkpoint M6 — Apply P0-A3, roll out compatible application, and prove preservation while drained

- activate the approved traffic-drain/maintenance procedure and verify old application instances cannot serve public/Admin traffic before deploy;
- recapture the full preservation snapshot/hash after traffic drain and require exact equality with the M5-confirmed snapshot. If it changed, keep traffic blocked, do not deploy, refresh the M5 packet, and obtain a new exact confirmation before continuing;
- recheck that the exact compatible release artifact/checksum is available for immediate rollout;
- recompute the full datasource/schema/cluster fingerprint immediately before deploy and require exact equality across every available approved populated field; reject changed schema/search path/database OID/available cluster identity and any full identity-tuple match with clean/shadow;
- verify exactly one migration is pending and that it is P0-A3;
- apply only P0-A3 while traffic remains drained;
- roll out the exact compatible artifact while traffic remains drained;
- before preservation postcheck, permit only read-only/internal smoke: Product detail GET, homepage/category GET, sitemap GET, Admin page GET, and non-public `/go` 404/no-side-effect. Prohibit Admin publishing, active commerce clicks, seed execution, write fixtures, Redis/click side effects, and all other application DML;
- while traffic remains drained and writes remain prohibited, run read-only populated postcheck only with explicit `P0_A3_POPULATED_DATABASE_URL` and `--expected-fingerprint`, with no ambient fallback or migration command;
- verify all execution-time existing Products are `ACTIVE + non-indexable`, compare exact M5-refreshed pre-apply sorted keyed mappings/counts/orphan counts, verify partial indexes, current migration status, and no baseline DDL execution;
- if rollout or postcheck fails, keep traffic blocked, capture evidence, and enter the approved recovery procedure without retry or manual repair;
- restore traffic only after the quiescent postcheck passes, then run public post-restore smoke and any controlled active-commerce write evidence.

#### Populated migration failure protocol

- If deploy reports failure and transaction rollback is conclusively verified, keep traffic drained, assert schema/data remain at the exact pre-deploy state, capture migration-history failure details/logs and fingerprints, stop, and require a reviewed retry/recovery decision. Do not automatically retry or mark rolled back.
- If commit outcome is ambiguous or any partial enum/column/default/backfill state is detected, keep traffic drained, stop all feature writes, capture schema/data/history/snapshots/logs, and prohibit retry, `resolve --rolled-back`, `db push`, or manual repair DDL until a separate recovery plan receives explicit approval.
- If compatible rollout or quiescent populated postcheck fails after a successful migration, keep traffic drained, capture artifact/process/smoke/postcheck evidence, and enter the approved recovery procedure; do not restore traffic merely because the migration command succeeded.
- Disposal/recreation is allowed only for clean/shadow/failure-fixture databases, never the populated database.

### 2. Product access and publishing command design

Implement the data model and state transitions described in [data-model.md](./data-model.md) and [contracts/product-access.md](./contracts/product-access.md).

- Access policy accepts a found Product lifecycle/index projection only.
- Missing is represented by the loader/route lookup result, not a gate reason.
- Closed reasons and lifecycle-first precedence are exhaustive.
- Export one shared indexable Prisma predicate for homepage/category/sitemap.
- Publishing commands are discriminated command types:
  - set lifecycle → always normalize index false;
  - enable index → active-only;
  - disable index → lifecycle preserved, index false.
- Command helper returns a command-shaped operation, never a stale full-row replacement.
- Set-lifecycle writes `{status: target, is_indexed: false}` atomically by ID.
- Enable-index uses an atomic conditional update `WHERE id = productId AND status = ACTIVE`, writes only `is_indexed = true`, and requires affected-row count one; zero rows are classified as missing, non-active, or concurrent-change conflict with no write.
- Disable-index writes only `is_indexed = false`, so it cannot restore a stale lifecycle.
- Deterministic PostgreSQL race tests cover enable versus `BLOCKED`, `DRAFT`, and `ARCHIVED`, plus disable versus lifecycle transition; no final state may lose the lifecycle command through stale full-row overwrite.

### 3. Shared Product-page data and metadata design

Follow [contracts/product-page-data.md](./contracts/product-page-data.md):

- module-level React-cached loader;
- request boundary inside loader before clock/query;
- one `now`, Product/AffiliateLink snapshot, access decision, and offer presentation;
- result union: missing, non-public, public;
- metadata and page call the same loader with the same primitive slug;
- missing/non-public call not-found before specifications;
- public page loads specifications separately after the gate;
- metadata builder remains pure and receives a resolved canonical URL;
- title/description/robots/canonical follow the exact spec.

Race acceptance uses an injectable/test seam around the Product load/evaluation so one render can prove stable shared result while a subsequent uncached request observes changed data.

### 4. Canonical URL and sitemap design

Follow [contracts/canonical-url-sitemap.md](./contracts/canonical-url-sitemap.md):

- strict origin-only parser with production fallback for absent/blank configuration;
- explicit malformed origin throws;
- Product path exactly `/products/${encodeURIComponent(rawPersistedSlug)}`;
- sitemap and metadata share the Product URL builder;
- dynamic sitemap waits for request before query;
- shared indexable predicate;
- select only slug/update timestamp;
- order slug ascending;
- emit `url` as `getProductCanonicalUrl(slug, siteUrl).toString()` plus `lastModified` only; type-level tests require a string URL equal to the builder output;
- empty eligible Product list is valid;
- data/config errors propagate.

### 5. Public listing and cache design

- Homepage keeps its existing 24-hour ISR and queries with shared `ACTIVE + indexed` predicate.
- Category removes time revalidation, explicitly waits for request, resolves inputs, then queries with the shared predicate.
- Admin publishing success invalidates only `/`.
- Production build must report:
  - homepage static/ISR;
  - category dynamic;
  - Product detail dynamic;
  - sitemap dynamic.

### 6. Commerce access design

- Product lookup remains first.
- Missing/no-link behavior remains current redirect-home flow.
- Found Product access decision happens before affiliate selection and every click side effect.
- Non-public found Product returns HTTP 404 with no Location/UUID/Redis/Click insert/tracking mutation.
- Active Products continue existing selection/persistence/redirect behavior unchanged.
- Extract/test only the access decision boundary; do not redesign P0-B internals.

### 7. Admin design

- Restructure each product row so specification navigation and publishing forms are not nested interactive elements.
- Show stored lifecycle/index and effective reason/eligibility badges.
- Provide one lifecycle form and explicit enable/disable index commands.
- Parse IDs and enum/command values server-side.
- Execute command-shaped atomic writes rather than loading then rewriting the full publishing state: lifecycle updates both fields; enable uses active-only conditional update; disable writes the index flag only.
- Every affected-row-count-one success redirects; expected validation/rejection/concurrency outcomes redirect with an error state and no invalidation; unexpected database/infrastructure failures propagate according to the existing fail-visible Admin convention. No optimistic UI.
- Revalidate homepage only after successful state change.

### 8. Seed and legacy-file design

- Active TypeScript seed uses safe Product defaults/explicit draft-noindex values and removes temporary-index comments.
- Delete legacy JavaScript seed.
- Remove every package script, source import, executable/configuration reference, and operational instruction targeting the deleted file. Preserve historical spec/plan/review mentions as audit evidence; acceptance scans classify and exclude those documentation-only mentions.
- Baseline migration history becomes the deployment authority for the partial indexes. Do not delete `prisma/partial-indexes.sql` in P0-A3 without separate approval; remove or update only executable repository instructions that would still direct operators to treat it as migration authority.
- Do not add broader database allowlist/opt-in seed controls in this feature.

### 9. Testing and acceptance design

- Pure unit tests for access reasons, command normalization, URL policy, metadata mapper, sitemap mapper.
- Uncached loader-core tests prove early exits, one clock, one policy/offer evaluation, and immutable returned snapshots.
- One focused real-Next runtime harness—not a general integration framework—builds and starts the existing application against an isolated test database and exercises the real Product route, `generateMetadata`, page consumer, and module-level cached export.
- The managed probe-enabled Next server binds explicitly to `127.0.0.1` on a randomly allocated available high port and never to `0.0.0.0`; the driver verifies loopback readiness before issuing the test request.
- A server-only probe module is inert unless a random per-run token, exact random unguessable expected Product slug, owned probe-root allocation record, and disposable datasource fingerprint all match. Unexpected Product requests do not allocate/claim sessions. It exposes no HTTP control route.
- The driver creates a new empty unique child beneath the platform temp directory, canonicalizes parent and child, rejects filesystem root/parent reuse, existing content, symlink/junction/reparse escape, or any resolved path outside the owned parent. Environment input identifies only the recorded owned child. Cleanup never recursively deletes an arbitrary supplied path; it deletes only recorded owned session subtrees and then the empty owned child.
- The probe is consumer-order-independent. Before either metadata or page calls the loader, it atomically claims `first-consumer`; the first consumer proceeds, while whichever consumer arrives second waits for a `mutation-complete` barrier. After the first consumer receives/records its result, it signals `first-result-ready` and waits only for that same bounded barrier before returning. The external driver mutates isolated lifecycle/AffiliateLink data and releases the barrier. If Next schedules consumers concurrently, the waiting second proceeds; if it schedules them sequentially, the first returns and the later second sees the already-released barrier—no fixed metadata-first scheduling assumption or deadlock.
- One activation token/probe root remains fixed for the managed server. A separate module-level request-cached `getProbeSession()` atomically allocates one unique session directory/counter per real render; metadata and page must receive the same session ID, while a second HTTP request must allocate a different session ID. If consumers split sessions or request two reuses session one, the harness fails—this is acceptance evidence, not a control channel.
- The first request/session must prove both consumers ran with equal primitive slug arguments, one Product/AffiliateLink load, one access/offer evaluation, and the same result version/evaluatedAt despite the between-consumer mutation. Without restarting the server or changing activation token, a second request must create a distinct session, perform a fresh load/evaluation, and observe the changed database state.
- Lifecycle is strictly allocate → bind loopback → readiness → run → cleanup. Every readiness/barrier/request wait is bounded; a `finally` path always requests process termination, verifies it exited, removes only owned fixtures/session subtrees, and verifies cleanup. Failure to kill the server, remove owned database fixtures, or remove the owned probe subtree fails the verifier. Probe mode against a non-disposable fingerprint fails closed. Static same-import/source evidence or ordinary Node calls to React `cache()` alone are insufficient for SC-003/SC-003A.
- A dedicated disposable-PostgreSQL publishing concurrency verifier orchestrates row locks/barriers for enable versus `BLOCKED`/`DRAFT`/`ARCHIVED` and disable versus lifecycle update, proving predicate re-evaluation and absence of stale full-row writes/lost lifecycle transitions.
- Commerce tests are partitioned into found non-public no-side-effect, found active existing-flow, and missing/no-link redirect-home regression groups.
- Source acceptance verifies request-boundary ordering, no stale revalidate exports, shared predicate usage, and zero operational references to the removed legacy seed while allowing historical planning/review mentions.
- Package script mappings are normative and must be created before any task invokes them:
  - `verify:p0-a3:migrations` → `tsx scripts/verify-p0-a3-migrations.ts`;
  - `verify:p0-a3:publishing-concurrency` → `tsx scripts/verify-product-publishing-concurrency.ts`;
  - `verify:p0-a3:cache-runtime` → `tsx scripts/verify-product-page-cache-runtime.ts`.
- Dedicated migration verifier is outside `npm test`. Clean mode uses explicit clean/failure-fixture variables. `populated-postcheck` is read-only and requires `P0_A3_POPULATED_DATABASE_URL` plus `--expected-fingerprint <approved-id>`; it never falls back to ambient `DATABASE_URL`, fails when either value is missing/mismatched, rejects clean/shadow/failure identities, and executes no migrate/DDL/DML command.
- Final verification must invoke all dedicated verifier commands explicitly; `npm test` is never reported as migration, concurrency, or real-runtime cache coverage.
- Full regression includes P0-A1 auth and P0-A2 offer tests.

## Post-Design Constitution Re-check

- **Affiliate data integrity** remains protected by exact keyed migration snapshots and no change to active Product click behavior.
- **Legal/platform compliance** remains unchanged.
- **Flat permissions** remains unchanged.
- **Save→Redirect** is explicit in Admin command contracts.
- **No thin pSEO** is strengthened by default noindex and consistent sitemap/listing gates.
- **Infrastructure resilience** is improved by migration history and clean-deployment verification.
- **Niche separation** is unaffected.

All gates continue to pass. No complexity exception is required.

## Complexity Tracking

*No constitution violations — table not needed.*

## Planning Approval Gates

Planning approval does not authorize implementation. After this plan is approved:

1. `speckit-tasks` may decompose the work.
2. Task ordering must preserve Checkpoints M-1 through M6, including both human approval boundaries.
3. A task must stop after baseline compatibility evidence.
4. `migrate resolve --applied` requires a new explicit user approval during implementation.
5. No schema, migration, seed, route, or Admin code may be modified before implementation approval.
