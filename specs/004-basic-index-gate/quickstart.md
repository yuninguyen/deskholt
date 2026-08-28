# Quickstart: P0-A3 Basic Index Gate Validation

Planning-stage validation/run guide. This document describes the commands and evidence required after implementation is separately approved; it does not authorize running migration or database-write commands now.

See:

- [research.md](./research.md) for decisions and alternatives;
- [data-model.md](./data-model.md) for states/transitions;
- [contracts/migration-gates.md](./contracts/migration-gates.md) for hard database gates;
- [contracts/product-access.md](./contracts/product-access.md) for surface policy.

## Safety prerequisites

- Work on branch/worktree dedicated to `004-basic-index-gate` and preserve unrelated existing changes.
- Local implementation uses T004-L: confirm `localhost`/`deskholt_db`/`public`, no production VPS, and no production traffic; complete the fresh `pg_dump`/different-disposable-database restore comparison before M0.
- T004-P is a separate production operations gate before T073/M5. Current PostgreSQL production backup/restore evidence—not procedural documentation or local SQLite backup—is required for populated operations.
- `DATABASE_URL`, `SHADOW_DATABASE_URL`, and `CLEAN_DATABASE_URL` identify distinct targets. Record normalized host/port/database name, non-secret effective schema setting, `current_database()`, `current_schema()`, `SHOW search_path`, `current_user`, database OID, server address/port/version, and cluster system identifier when permitted. Compare identity as `(cluster identifier, database OID/name, effective schema/search_path)`: on one cluster require different OIDs/names; across clusters allow equal numeric OIDs when cluster identities differ. Redact credentials/secrets only; explicitly approve weaker evidence if cluster identity is unavailable. Clean/shadow are disposable.
- Never use `migrate reset`, `db push`, or `migrate dev` against the populated database.
- Do not run `migrate resolve --applied` until the exact baseline packet receives explicit approval.
- Before any verifier command is referenced, `package.json` must contain exactly:

  ```json
  {
    "verify:p0-a3:migrations": "tsx scripts/verify-p0-a3-migrations.ts",
    "verify:p0-a3:publishing-concurrency": "tsx scripts/verify-product-publishing-concurrency.ts",
    "verify:p0-a3:cache-runtime": "tsx scripts/verify-product-page-cache-runtime.ts"
  }
  ```

## Checkpoint T004-L — Local implementation safety

This local gate is separate from the production operations gate. It applies only when the current environment is explicitly confirmed as local development:

```text
host: localhost
 database: deskholt_db
 schema: public
 production VPS: not present
 production traffic: none
```

Do not claim production backup compliance from this local test. Create a fresh PostgreSQL logical backup outside the repository, with a timestamped filename, source identity fingerprint, and SHA-256 checksum. Use `pg_dump` from the installed PostgreSQL client tools:

```powershell
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupRoot = Join-Path $env:TEMP ('deskholt-p0-a3-backup-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $backupRoot | Out-Null
$backupPath = Join-Path $backupRoot ("deskholt_db-$stamp.dump")
$env:P0_A3_TARGET_DATABASE_URL = '<explicit-local-postgresql-url>'
pg_dump --format=custom --file $backupPath --dbname $env:P0_A3_TARGET_DATABASE_URL --no-owner --no-privileges
Get-FileHash $backupPath -Algorithm SHA256
```

The explicit local URL must resolve to `localhost`, database `deskholt_db`, and schema `public`; do not use a production URL. Restore into a different disposable local database, never the source database, then compare:

- 20 Products;
- every application-table row count;
- exact keyed relationship mappings;
- every foreign-key orphan count;
- schema/object inventory, including tables, enums, constraints, ordinary indexes, and the two partial unique indexes.

Record the source/restored fingerprints, backup timestamp/path/checksum, restore command/output, comparison results, and cleanup evidence in:

```text
artifacts/p0-a3/m-1-local-backup-and-restore.md
```

A passing T004-L permits M0 through T072. It does not authorize production operations, populated migration-history writes, `migrate resolve`, or populated `migrate deploy`.

## T004-P — Production operations gate

T004-P is deferred until immediately before T073/M5. It requires current evidence for:

- production VPS/database identity;
- off-production-VPS backup destination/provider;
- automatic backup schedule/job and recent successful run;
- automatic deletion of backups older than 30 days and current retention/oldest-backup evidence;
- selected production backup ID/path/timestamp/target fingerprint/checksum where supported;
- restore procedure or recent restore-test evidence.

If production infrastructure or any required current evidence is absent, stop at T072. Procedural documentation and local SQLite backups are not substitutes.

## Checkpoint 1 — Prisma toolchain

```powershell
node --version
npm ls prisma @prisma/client
npx --no-install prisma --version
npx --no-install prisma generate --schema prisma/schema.prisma
npx --no-install prisma validate --schema prisma/schema.prisma
npm test
```

Expected: Node 24; CLI/client exactly `5.22.0`; version output records the migration/query engine commit/hash; dependency tree/lockfile contain no second effective Prisma version; generation, validation, read-only inventory/diff connectivity, and the repository test suite pass. Any mismatch or smoke failure stops migration generation.

## Checkpoint 2 — Read-only database inventory

Run the reviewed read-only inventory and preservation snapshot tooling.

Expected evidence:

- 10 application tables;
- 4 application enums;
- no application views/materialized views/sequences/routines/triggers;
- exactly two application-owned DB-only partial indexes;
- zero unexplained drift;
- no initial Prisma migration history;
- current-environment Product count 20;
- deterministic keyed preservation snapshot and SHA-256;
- read-only role report: effective-schema USAGE/CREATE (`has_schema_privilege`), Product owner and current-role membership sufficient for `ALTER TABLE`, UPDATE on `products`, SELECT on preservation tables, and required catalog readability.

Do not test privileges by writing to the populated database. Record current role, owner roles, memberships, and every boolean result. Any unprovable privilege becomes an explicit M5 limitation requiring manual review.

Run representable compatibility diff:

```powershell
npx --no-install prisma migrate diff `
  --from-schema-datasource prisma/schema.prisma `
  --to-schema-datamodel prisma/schema.prisma `
  --exit-code
```

Expected: exit code 0. This result must be reviewed together with the PostgreSQL inventory because Prisma does not represent partial index predicates.

## Checkpoint 3 — Baseline SQL generation and inspection

Create `prisma/migrations/migration_lock.toml` with PostgreSQL provider, then generate the baseline before editing the Product data model:

```powershell
npx --no-install prisma migrate diff `
  --from-empty `
  --to-schema-datamodel prisma/schema.prisma `
  --script `
  --output prisma/migrations/<baseline>/migration.sql
```

Add the two approved partial unique indexes to this baseline migration, then inspect the complete SQL.

Expected:

- all pre-P0-A3 represented objects;
- exact partial index names, columns, and predicates;
- no lifecycle field/backfill;
- no drop/truncate/delete/update;
- no migration-history manipulation;
- recorded SHA-256.

## Checkpoint 4 — Live/baseline compatibility packet

Packet must include:

- exact tool versions;
- full baseline SQL and hash;
- diff command/output/exit code;
- full object classification;
- exact partial-index definitions;
- row-count and migration-history facts;
- read-only migration-role privilege inventory, ownership/membership evidence, and any unprovable limitation requiring M5 review;
- off-VPS storage destination, automatic backup schedule/job and recent success evidence, automatic >30-day deletion/retention evidence, selected backup identifier/path/timestamp/target fingerprint/size/checksum where supported, and restore procedure or recent restore-test evidence;
- redacted-secret but schema-visible fingerprints of populated/clean/shadow databases;
- explanation that resolve records history without executing baseline DDL.

## Checkpoint 5 — Mandatory baseline approval stop

Stop. Require approval equivalent to:

```text
APPROVE BASELINE ARTIFACT <baseline-name> SHA256=<exact-hash>
```

This authorizes separate P0-A3 generation and clean-chain testing only. It does not authorize immediate resolve. Do not place generation, artifact approval, clean chain, resolve confirmation, and resolve in one script, task, or unattended command sequence.

## Checkpoint 6 — Generate separate P0-A3 migration

After Checkpoint 5 approval and updating the approved data model, but before writing populated migration history, assert `prisma/migrations` contains only `migration_lock.toml` plus approved baseline and no P0-A3 directory. Allocate a safe temporary output file outside migration history and generate structural SQL:

```powershell
$StructuralSql = Join-Path $env:TEMP ("p0-a3-structural-" + [guid]::NewGuid().ToString("N") + ".sql")

npx --no-install prisma migrate diff `
  --from-migrations prisma/migrations `
  --to-schema-datamodel prisma/schema.prisma `
  --shadow-database-url $env:SHADOW_DATABASE_URL `
  --script `
  --output $StructuralSql
```

Inspect the temporary structural SQL first. Then create the final P0-A3 migration directory, copy the structural SQL to its `migration.sql`, and manually edit that final migration to:

1. put `BEGIN;` before every feature enum/DDL/data statement;
2. keep generated ProductStatus/status/default and `is_indexed` default DDL inside the transaction;
3. insert the deterministic business backfill:

   ```sql
   UPDATE "products"
   SET "status" = 'ACTIVE',
       "is_indexed" = false;
   ```

4. avoid touching `updated_at` or any other field;
5. make `COMMIT;` the final successful statement;
6. verify all statements support PostgreSQL transactions;
7. hash the final edited SQL;
8. delete only the owned temporary structural-output file after source/final evidence is recorded.

Reject destructive/unrelated SQL. Prove baseline plus final P0-A3 reproduces the target schema, then separately test data results because schema diff cannot verify the backfill.

## Checkpoint 7 — Clean-database chain

Run the dedicated verifier explicitly; this is not part of `npm test`:

```powershell
$env:P0_A3_CLEAN_DATABASE_URL = $env:CLEAN_DATABASE_URL
$env:P0_A3_FAILURE_DATABASE_URL = $env:FAILURE_DATABASE_URL # or a freshly recreated, re-fingerprinted disposable clean DB
npm run verify:p0-a3:migrations -- --mode clean-chain
```

The verifier internally uses fresh controlled temporary Prisma roots and explicit `--schema` paths; it never moves/hides/renames/edits repository migrations and refuses the populated database.

Expected:

- clean-success root copies target `schema.prisma`, lock, and only approved baseline; asserts one migration/source hash; deploys via `--schema <clean-temp-root>/schema.prisma`;
- verifier inserts a legacy `is_indexed=true` Product and records its non-target fields/`updated_at`, copies byte-identical approved P0-A3, asserts two migrations/hashes, then deploys again through the same temporary schema;
- legacy fixture becomes `ACTIVE + false` with unchanged non-target fields/`updated_at`;
- status current;
- a post-P0 Product defaults `DRAFT + false`;
- both partial indexes exist with exact predicates;
- product-level duplicate fixture rejects;
- same attribute across different variants succeeds;
- same-variant duplicate rejects;
- failure root separately copies target `schema.prisma`, creates an initially empty `migrations/`, copies only lock and approved baseline, asserts/hashes exactly one migration, deploys through explicit `--schema <failure-temp-root>/schema.prisma`, and inserts the same legacy fixture;
- it adds exactly one distinctly named failure-fixture migration copied from final P0-A3 SQL with valid `DO $$ BEGIN RAISE EXCEPTION 'P0_A3_ROLLBACK_FIXTURE'; END $$;` after backfill/before `COMMIT`, asserts exactly two temporary migrations and no production P0-A3 directory, then runs Prisma deploy;
- enum/status column/default disappear and the fixture retains exact pre-feature values; the distinctive marker appears in the failed `_prisma_migrations` log; before/after hash proves the version-controlled final migration stayed byte-identical.

Any clean-chain or atomic-rollback-fixture failure blocks all populated-database history/application writes.

## Hard prerequisite before populated Checkpoints 8–9

Do **not** execute Checkpoint 8 immediately after Checkpoint 7. First complete T004-L, runtime implementation, and Checkpoints 10–14 below using only explicit disposable databases that passed baseline→P0-A3. M5/M6 remain blocked until T004-P and all of the following exist:

- US1–US4 implementation and acceptance complete;
- full tests, lint, typecheck, production build, route-table and built-app startup verification pass;
- disposable migration clean/failure, publishing-concurrency, and cache-runtime verifiers pass;
- an exact compatible release artifact identifier/checksum is ready;
- traffic-drain, rollout, rollback/recovery, and operations-handoff procedures are reviewed and ready.

Only then return to Checkpoint 8, refresh all populated evidence, and request M5 confirmation.

Required operational order:

```text
M3/M4 disposable proof
→ runtime implementation
→ full disposable tests/build/verifiers
→ compatible release artifact ready
→ Checkpoint 8 M5 resolve
→ traffic drain
→ Checkpoint 9 M6 deploy
→ compatible rollout with traffic still drained
→ populated postcheck while quiescent
→ traffic restore
```

## Checkpoint 8 — Register approved baseline on populated database

Only after Checkpoint 5 artifact approval, Checkpoint 7 clean-chain success, and every hard runtime/release prerequisite above has passed, restore the populated URL, recompute its full identity tuple/fingerprint, require equality across every available approved populated field, reject changed schema/search path/database OID/available cluster identity and any full identity-tuple match with clean/shadow, and refresh the quiescent pre-apply preservation snapshot.

Present current baseline hash, clean-chain report, populated fingerprint, backup evidence, preservation hash, and migration-role privilege report with any manually reviewed limitations. Require:

```text
CONFIRM BASELINE RESOLVE <baseline-name> SHA256=<exact-hash> FINGERPRINT=<approved-id>
```

Only after that just-in-time confirmation run:

```powershell
npx --no-install prisma migrate resolve `
  --applied <baseline-name> `
  --schema prisma/schema.prisma

npx --no-install prisma migrate status --schema prisma/schema.prisma
```

Expected: baseline history recorded, baseline DDL not executed, application data unchanged, and exactly P0-A3 remains pending.

## Checkpoint 9 — Drained P0-A3 deploy, compatible rollout, preservation, then restore

Activate the approved traffic-drain/maintenance procedure and verify old application instances cannot serve public or Admin traffic. Recapture the full preservation snapshot/hash while quiescent and require exact equality with the snapshot confirmed at Checkpoint 8. If it changed, keep traffic blocked, do not deploy, refresh the M5 packet, and obtain a new exact confirmation. Only then recheck that the exact compatible release artifact/checksum is immediately available, recompute the full populated identity tuple/fingerprint, require equality across every available approved field, reject clean/shadow/failure matches, and verify exactly one pending migration and that it is P0-A3.

While traffic remains drained, deploy only P0-A3:

```powershell
npx --no-install prisma migrate deploy --schema prisma/schema.prisma
npx --no-install prisma migrate status --schema prisma/schema.prisma
```

Roll out the exact compatible artifact while traffic remains drained. Before preservation postcheck, permit only read-only/internal smoke:

- Product detail GET;
- homepage/category GET;
- sitemap GET;
- Admin page GET;
- non-public `/go` 404/no-side-effect.

Before postcheck, prohibit:

- Admin publishing mutation;
- active commerce click flow;
- seed execution;
- write fixtures;
- Redis/Click side effects;
- any other application DML.

With traffic still drained and writes prohibited, run the read-only postcheck:

```powershell
# P0_A3_POPULATED_DATABASE_URL must be supplied independently; do not derive it from DATABASE_URL.
if ([string]::IsNullOrWhiteSpace($env:P0_A3_POPULATED_DATABASE_URL)) {
  throw 'P0_A3_POPULATED_DATABASE_URL is required'
}

npm run verify:p0-a3:migrations -- `
  --mode populated-postcheck `
  --expected-fingerprint <approved-id>
```

`populated-postcheck` is read-only, never falls back to ambient `DATABASE_URL`, requires both explicit URL and expected fingerprint, rejects clean/shadow/failure identities, runs no migration command/DDL/DML, and compares against the exact Checkpoint 8/M5 snapshot revalidated while quiescent after traffic drain at the start of Checkpoint 9.

Expected before traffic restore:

- only P0-A3 executed;
- every execution-time existing Product is `ACTIVE + false`;
- current environment remains 20 Products;
- before/after keyed snapshots are exactly equal;
- all row and orphan counts equal;
- partial indexes unchanged;
- migration status current;
- compatible application process and read-only/internal smoke are healthy.

Only after every postcheck assertion passes may traffic be restored. Then run public post-restore smoke and one controlled active-commerce fallback/click evidence flow.

If deploy, compatible rollout, or postcheck fails:

- keep traffic drained and capture migration/artifact/process/smoke/postcheck/fingerprint evidence;
- **confirmed SQL rollback**: verify schema/data equal pre-deploy evidence, stop, and require reviewed retry/recovery approval;
- **ambiguous commit, partial state, rollout failure, or preservation mismatch**: do not restore traffic, retry, resolve rolled back, push, seed, or manually repair without the approved recovery procedure and separate explicit decision.

## Checkpoint 10 — Pure policy and command tests

```powershell
npm test
$env:P0_A3_CONCURRENCY_DATABASE_URL = $env:CLEAN_DATABASE_URL
npm run verify:p0-a3:publishing-concurrency
```

Focused expectations:

- eight-state access/reason matrix;
- lifecycle-first malformed-state handling;
- missing outside gate;
- set ACTIVE always false;
- non-active enable rejection/no write;
- deterministic PostgreSQL races: enable versus `BLOCKED`, `DRAFT`, and `ARCHIVED`; disable versus lifecycle transition; no stale full-row overwrite or lost lifecycle transition;
- disable preserves lifecycle;
- canonical origin/path matrix;
- metadata fallback/robots;
- sitemap mapping/order;
- seed zero-indexable state, removed legacy file, and zero package/source/executable/configuration/operational references; historical planning/review mentions are classified and excluded.

## Checkpoint 11 — Product page/listing/metadata/sitemap integration

Validate:

- a deterministic integration harness exercises the real cached export through metadata and page in one request/render scope;
- metadata/body use equal primitive slug arguments and one shared Product/AffiliateLink/access/time/offer result;
- recorded repository load and access/offer evaluation counts are exactly one;
- regardless of whether metadata or body arrives first, a mutation after the first result but before the second consumer changes neither consumer's result version/evaluatedAt; the next independent request observes change;
- non-public stops before specifications;
- active noindex detail renders with `noindex,follow`;
- active indexed detail renders with `index,follow`;
- homepage/category/sitemap list only active indexed;
- sitemap `url` is a string equal to `getProductCanonicalUrl(...).toString()`, and timestamp mapping is exact;
- sitemap errors propagate.

Run production build with a production `NODE_ENV`, then the focused real-runtime cache harness:

```powershell
$env:NODE_ENV = $null
npm run build
$env:P0_A3_RUNTIME_DATABASE_URL = $env:CLEAN_DATABASE_URL
npm run verify:p0-a3:cache-runtime
```

The runtime verifier must bind the built app explicitly to `127.0.0.1` on a random available high port, never `0.0.0.0`. It creates a random activation token and unguessable fixture slug; probe activation requires exact token, slug, owned allocation record, and disposable fingerprint, so unexpected requests cannot claim sessions. The probe root is a newly allocated empty canonical child under platform temp; root/parent paths, existing content, symlink/junction/reparse escape, and paths outside the owned parent are rejected. Cleanup removes only recorded owned session subtrees, never arbitrary env paths.

A request-cached probe-session allocator must give metadata/page one shared session ID and the next HTTP request a distinct ID without server restart/token rotation. The first metadata-or-page consumer records its result and waits for `mutation-complete`; the second waits before loader use. The driver mutates isolated data after `first-result-ready`, releases the barrier, and asserts both consumers, per-session isolation, and first/second-request results. Lifecycle is bind → readiness → run → `finally` cleanup with bounded waits; failure to terminate the server or remove owned database/filesystem fixtures fails the verifier. No metadata-first assumption or public test-control route is allowed.

Expected route evidence:

```text
/                         static/ISR, 86400 seconds
/category/[slug]          dynamic
/products/[slug]          dynamic
/sitemap.xml              dynamic
/admin/products           dynamic
```

## Checkpoint 12 — Commerce no-side-effect verification

Run three separately named regression groups:

1. **Found non-public Product** (`DRAFT`, `BLOCKED`, `ARCHIVED`): HTTP 404, no merchant Location, UUID calls 0, Redis calls 0, Click inserts 0, and tracking URL mutations 0.
2. **Found active Product** (noindex and indexed): existing affiliate selection, fallback, click persistence, tracking mutation, and merchant redirect behavior remains unchanged.
3. **Missing Product or unavailable affiliate link**: exact pre-feature redirect-home behavior remains unchanged and is not converted into the found non-public 404 path.

## Checkpoint 13 — Admin integration

Through authenticated Admin:

1. set any lifecycle → resulting index false;
2. set ACTIVE from malformed indexed state → ACTIVE + false;
3. enable index on non-active → controlled rejection/no write;
4. enable on ACTIVE → active indexed;
5. disable → lifecycle preserved/index false;
6. every success redirects and invalidates `/` only;
7. effective badges match pure access reason.

## Checkpoint 14 — Pre-populated full verification and release readiness

Run every database-backed verifier against explicit disposable targets that already passed baseline→P0-A3; never use the populated datasource here:

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm test
$env:NODE_ENV = $null
npm run build
npm run verify:p0-a3:migrations -- --mode clean-chain
npm run verify:p0-a3:publishing-concurrency
npm run verify:p0-a3:cache-runtime
git diff --check
```

The migration, concurrency, and cache verifiers are explicit commands outside `npm test`; record each output and disposable fingerprint separately. Verify the production route table and built-app startup against a disposable migrated database.

Before returning to Checkpoint 8, produce:

- tests/lint/typecheck/build output;
- production route table and built-app startup smoke;
- baseline and P0-A3 SQL/hashes;
- compatibility approval record;
- fresh clean-chain/failure-fixture report;
- disposable concurrency/cache-runtime reports;
- partial-index behavior report;
- seeded-state/reference report;
- commerce no-side-effect and out-of-stock fallback report;
- Admin transition report;
- exact compatible release artifact identifier/checksum and environment/config manifest;
- reviewed traffic-drain, rollout, rollback/recovery, and operations-handoff procedure.

The populated pre/post preservation report is produced only in Checkpoint 9 while traffic remains drained. Inspect GitNexus change detection before any commit.
