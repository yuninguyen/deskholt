# Contract: Migration Safety Gates

## Absolute prohibitions

Against the populated database, never run:

```text
prisma migrate reset
prisma db push
prisma migrate dev
baseline migration SQL
```

Do not record the baseline without explicit approval identifying the reviewed migration name and checksum.

## Gate T004-L — Local implementation safety

Required evidence:

- current target is explicitly local development: host `localhost`, database `deskholt_db`, schema `public`, no production VPS, and no production traffic;
- exact `prisma` CLI 5.22.0 and recorded engine commit/hash;
- exact `@prisma/client` 5.22.0;
- lockfile/dependency tree reflects only exact 5.22.0 with no second effective Prisma CLI/client/engine version;
- Node 24 smoke gate passes: `prisma generate`, `prisma validate`, read-only live/schema diff and inventory connectivity, and repository tests;
- a fresh PostgreSQL logical backup was created with `pg_dump` outside the repository, with timestamp, source fingerprint, and SHA-256 checksum;
- the backup was restored into a different disposable local database, never the source, and the evidence compares 20 Products, all application row counts, keyed relationships, orphan counts, and schema/object inventory;
- local identity records normalized host/port/database name, non-secret effective schema/search path, `current_database()`, `current_schema()`, database OID, server address/port/version, and cluster `system_identifier` when permitted;
- credentials/secrets are redacted, but schema identity is not; unavailable cluster identity is recorded as a limitation requiring manual approval.

A passing T004-L permits M0 through T072. It does not authorize production operations or populated migration-history writes. Any local identity, backup, restore, or comparison mismatch stops local implementation.

## Gate T004-P — Production operations

T004-P is a separate deferred gate before T073/M5 and any populated or production operation. Required evidence:

- production VPS/database identity and approved populated identity tuple;
- off-production-VPS backup destination/provider;
- identified automatic backup schedule/job and recent successful run;
- automatic deletion of backups older than 30 days plus current retention/oldest-backup evidence;
- selected production backup identifier/path/timestamp/target fingerprint/size/checksum where supported;
- restore procedure or recent restore-test evidence.

Procedural documentation or a local SQLite backup is not a substitute. If production infrastructure/evidence does not exist, T073+, M5, M6, and production rollout remain blocked even when T004-L passes.

For all targets, identity is evaluated as `(cluster system_identifier when available, database OID, current_database, effective schema/search_path)`: targets on the same cluster must differ by database OID/name; targets on different clusters may share a numeric OID and are separated by cluster plus database/schema identity; unavailable cluster identity requires explicit approval of weaker endpoint+OID/name+schema evidence. A changed populated OID/schema/search path/available cluster identifier rejects a recreated or wrong target even if host/port/name match.

## Gate M0 — Read-only live inventory

Required evidence:

- migration status/history absent at the initial state;
- representable live-to-active-model diff is empty;
- 10 application tables and 4 application enums classified;
- normal constraints/indexes represented;
- no application views, materialized views, sequences, routines, or triggers;
- `plpgsql` classified as infrastructure;
- exactly two application-owned DB-only partial unique indexes;
- zero unexplained objects;
- deterministic pre-change preservation snapshot captured;
- read-only migration-role privilege report proves effective-schema USAGE/CREATE via `has_schema_privilege`, Product ownership or owning-role membership sufficient for `ALTER TABLE`, UPDATE on `products`, SELECT on all application tables needed by preservation, and access to required `pg_catalog` metadata; current role, owner roles, memberships, and each result are recorded;
- no populated write probe is used. Any privilege that cannot be proven read-only is explicitly listed for manual review in M5 and is not considered passed by omission.

Any unexplained drift blocks baselining.

## Gate M1 — Baseline SQL inspection

Migration history root contains `migration_lock.toml` with `provider = "postgresql"`. Baseline is generated from empty to the pre-P0-A3 data model and contains both exact partial unique indexes.

It must contain:

- all pre-feature tables/enums/constraints/defaults/ordinary indexes;
- both exact partial unique indexes using plain `CREATE UNIQUE INDEX` so clean-chain conflicts fail visibly.

It must not contain:

- P0-A3 lifecycle/status;
- data update/backfill;
- drop/truncate/delete;
- `_prisma_migrations` manipulation;
- `plpgsql` creation.

Produce full SQL, SHA-256, generation command/version, object comparison, and database identities with credentials redacted.

## Gate M2 — Human approval

Stop and request artifact approval in an equivalent form:

```text
APPROVE BASELINE ARTIFACT <baseline-migration-name> SHA256=<exact-hash>
```

This approves the baseline SQL/compatibility packet for feature-migration generation and clean-chain testing; it does not authorize immediate `migrate resolve`. Baseline generation/inspection, artifact approval, clean-chain proof, just-in-time resolve confirmation, and baseline resolution are separate workflow tasks.

## Gate M3 — Separate P0-A3 migration

After M2 approval, assert version-controlled migration history contains exactly `migration_lock.toml` plus approved baseline and no P0-A3 directory. Generate the structural diff from that history to the updated data model through a distinct disposable shadow database, writing `--output` to a newly allocated temporary file outside `prisma/migrations`. Only after generation/inspection may the final P0-A3 directory be created and the structural SQL copied/edited into `migration.sql`. Avoid `migrate dev` on the populated datasource. Because schema diff cannot infer a business data transition, manually insert and review the backfill.

The final SQL contract is:

```sql
BEGIN;

-- generated ProductStatus enum and Product column/default DDL

UPDATE "products"
SET "status" = 'ACTIVE',
    "is_indexed" = false;

COMMIT;
```

Normative details:

- `BEGIN` precedes all feature enum/DDL/data statements;
- every approved structural statement and the backfill are inside the same transaction;
- `COMMIT` is the final successful statement;
- all statements must be verified as PostgreSQL-transaction-compatible;
- backfill touches only `status` and `is_indexed`, not `updated_at` or any other field;
- final manually edited migration SQL receives a recorded SHA-256.

Allowed content:

- ProductStatus enum;
- Product status field/default `DRAFT`;
- `is_indexed` default false;
- explicit deterministic existing-row backfill to `ACTIVE + false`.

Rejected content:

- repeated baseline creation;
- repeated partial-index creation;
- table/column drops;
- table recreation;
- ID/FK rewrites;
- unrelated schema changes.

Migration-history-to-target-model diff must be empty after adding the final feature migration, and a separate data assertion must prove every pre-existing Product becomes `ACTIVE + false`; schema diff does not verify backfill semantics.

## Gate M4 — Clean-database chain

On an explicitly isolated empty database:

1. allocate a new controlled temporary Prisma root outside the repository; copy target `schema.prisma`, then create sibling `migrations/` containing only byte-identical `migration_lock.toml` and approved baseline;
2. assert exactly one visible migration and verify copied/source hashes; run `prisma migrate deploy --schema <clean-temp-root>/schema.prisma` against the disposable clean database;
3. insert a deterministic legacy Product fixture with `is_indexed = true` and record all non-target fields including `updated_at`;
4. copy byte-identical approved P0-A3 directory into temporary `migrations/`, assert exactly two migrations and both hashes, then run deploy again using the same explicit temporary schema;
5. assert the legacy fixture is `ACTIVE + false` with unchanged `updated_at` and non-target fields;
6. temporary-root status is current and a newly inserted Product defaults `DRAFT + false`;
7. exact named partial indexes exist with correct predicates; duplicate product-level null-variant rejects; same attribute on different variants succeeds; duplicate same-variant rejects;
8. never move, hide, rename, or edit repository migration directories to stage this sequence;
9. for failure verification, allocate a second temporary Prisma root outside version control, copy target `schema.prisma`, then create sibling `migrations/` containing only copied lock plus approved baseline; assert/hash exactly one migration and deploy with explicit `--schema <failure-temp-root>/schema.prisma`;
10. insert the legacy fixture, add exactly one distinctly named failure migration copied from final P0-A3 SQL, inject valid `DO $$ BEGIN RAISE EXCEPTION 'P0_A3_ROLLBACK_FIXTURE'; END $$;` after backfill/before `COMMIT`, and assert exactly two temporary migrations with no production P0-A3 directory;
11. run deploy through the explicit failure temporary schema, prove ProductStatus enum/column/default are absent and the fixture retains exact pre-feature values, assert the distinctive marker in the failed `_prisma_migrations` log, and prove the version-controlled final P0-A3 file/checksum is byte-identical before/after.

Failure permits discarding only disposable databases and blocks all populated-database history/application writes.

## Gate M5 — Populated baseline registration

Only after T004-L, M2 approval, M4 success, US1–US4 runtime completion, full disposable verification, production build/route checks, exact compatible release-artifact readiness, and T004-P production evidence, recompute the full datasource/schema/cluster fingerprint, require field-by-field equality for every available approved populated value, reject changed effective schema/search path/database OID/available cluster identity and any full identity-tuple match with clean/shadow, and refresh the populated pre-apply snapshot. If production infrastructure/evidence does not exist, T073+/M5/M6 remain blocked.

Present clean-chain evidence, current baseline hash, current fingerprint, backup evidence, preservation hash, and the migration-role privilege report with any manually reviewed limitations. Require a second just-in-time confirmation:

```text
CONFIRM BASELINE RESOLVE <baseline-name> SHA256=<exact-hash> FINGERPRINT=<approved-id>
```

Only then run:

```text
prisma migrate resolve --applied <baseline-name>
```

Expected:

- history row recorded;
- baseline DDL not executed;
- exactly P0-A3 remains pending;
- application data and live objects unchanged;
- migration status consistent.

## Gate M6 — Populated P0-A3 apply and preservation

After M5 baseline registration, activate the approved traffic-drain/maintenance procedure and verify old application instances cannot serve public/Admin traffic. Recapture the preservation snapshot while quiescent and require exact equality with the M5-confirmed snapshot; if it changed, keep traffic blocked, do not deploy, refresh the packet, and obtain renewed confirmation. Recompute the full datasource/schema/cluster fingerprint again, require field-by-field equality for every available approved populated value, reject changed effective schema/search path/database OID/available cluster identity and any full identity-tuple match with clean/shadow, verify exactly one migration is pending and it is P0-A3, then deploy only P0-A3 while traffic remains drained.

Roll out the exact compatible application artifact while traffic remains drained. Permit only read-only/internal smoke (detail, homepage/category, sitemap, Admin GET, and non-public `/go` 404/no-side-effect); prohibit Admin publishing, active commerce clicks, seed execution, write fixtures, Redis/Click side effects, and all other application DML. While still drained, run the explicit read-only populated postcheck against the quiescent snapshot. If deploy, rollout, or postcheck fails, keep traffic blocked and enter approved recovery without retry/manual repair.

Before traffic restore:

- all execution-time existing Products are `ACTIVE + false`;
- approved current environment expects 20 Products;
- exact quiescent pre/post preservation snapshot is equal;
- all row/orphan counts equal;
- both partial indexes unchanged;
- migration status current;
- baseline and feature are successful history entries;
- new Product default fixture yields `DRAFT + false`.

Restore traffic only after every postcheck assertion passes; then run public post-restore smoke and controlled active-commerce evidence.

## Verifier command contract

Normative package mappings:

```json
{
  "verify:p0-a3:migrations": "tsx scripts/verify-p0-a3-migrations.ts",
  "verify:p0-a3:publishing-concurrency": "tsx scripts/verify-product-publishing-concurrency.ts",
  "verify:p0-a3:cache-runtime": "tsx scripts/verify-product-page-cache-runtime.ts"
}
```

Package-script creation precedes every task that invokes these names. Migration `populated-postcheck` mode:

- requires explicit `P0_A3_POPULATED_DATABASE_URL` and `--expected-fingerprint <approved-id>`;
- never falls back to ambient `DATABASE_URL`;
- fails if URL/fingerprint is missing or mismatched;
- rejects clean, shadow, and failure-fixture identity tuples;
- is read-only and runs no Prisma migration command, DDL, or DML.

## Preservation snapshot minimum content

- all application-table row counts;
- all foreign-key orphan counts;
- `Product.id ↔ slug`;
- `AffiliateLink.id → product_id`;
- `Click.id/click_id → product_id`;
- Conversion-to-Click linkage;
- `ProductVariant.id → product_id`;
- `ProductAttribute.id → product_id/variant_id`.

Arrays/records must have deterministic ordering. Product status/index are excluded from equality comparison and asserted separately because they intentionally change.

## Populated failure policy

### Confirmed transaction rollback

If deploy fails and inspection conclusively proves the explicit transaction rolled back all enum/column/default/data changes:

- verify schema/data equal the exact pre-deploy snapshot;
- capture migration history row/status/error logs, SQL hash, and datasource fingerprint;
- stop without automatic retry or `resolve --rolled-back`;
- require a reviewed retry/recovery decision.

### Ambiguous commit or partial state

If commit outcome is unknown or any partial enum/column/default/backfill state exists:

- stop feature writes immediately;
- capture schema, data, migration history, snapshots, fingerprints, server logs, and SQL/checksums;
- do not retry, run `resolve --rolled-back`, use `db push`, or apply manual repair DDL;
- require a separate recovery plan and explicit approval.

Disposable clean/shadow/failure-fixture databases may be discarded; the populated database may never be reset or recreated under this plan.
