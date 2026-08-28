# P0-A3 M2 Baseline Artifact Packet

**Status at capture: AWAITING HUMAN APPROVAL. This is a pre-approval snapshot; approval was subsequently recorded in [`m2-baseline-artifact-approval.md`](m2-baseline-artifact-approval.md).**

## Proposed artifact

```text
name: 20260827014500_baseline_existing_schema
path: prisma/migrations/20260827014500_baseline_existing_schema/migration.sql
SHA-256: 03d3378b0acb2ecde7d797b8061e485159c114ed64504f4f9ad0fa877565103f
lock: prisma/migrations/migration_lock.toml
provider: postgresql
```

## Toolchain

```text
Node: v24.9.0
npm: 11.14.1
Prisma CLI/client: 5.22.0
Engine hash: 605197351a3c8bdd595af2d2a9bc3025bca48ea2
```

## Source target

```text
host: localhost
port: 5432
database: deskholt_db
schema: public
cluster system_identifier: 7674334565232096068
database OID: 16389
Products: 20
migration history: absent
```

Detailed M0 evidence:

- `artifacts/p0-a3/m0/read-only-inventory.json`
- `artifacts/p0-a3/m0/database-object-inventory.md`
- `artifacts/p0-a3/m0/role-privileges.md`
- `artifacts/p0-a3/m0/live-compatibility.md`
- `artifacts/p0-a3/m0-safety-tool-tests.md`

## Backup and restore

T004-L local backup/restore passed. Fresh dump and restore evidence:

- `artifacts/p0-a3/m-1-local-backup-and-restore.md`

The source dump was outside the repository, restored into a separate disposable local PostgreSQL cluster/database, and matched Products, row counts, keyed snapshot hash, orphan counts, enum inventory, and index inventory. T004-P production operations evidence remains deferred and is not asserted by this local packet.

## Baseline review

- all 10 current application tables represented;
- all 4 current application enums represented;
- current constraints, ordinary indexes, and foreign keys generated;
- exact two approved ProductAttribute partial unique indexes added;
- no ProductStatus/status lifecycle field;
- no `is_indexed DEFAULT false`;
- no manual backfill;
- no destructive SQL;
- no `_prisma_migrations` write;
- no populated database command was run.

## Approval boundary

Do not create the P0-A3 feature migration, edit `prisma/schema.prisma`, or run any task after T015 until the human supplies exactly:

```text
APPROVE BASELINE ARTIFACT 20260827014500_baseline_existing_schema SHA256=03d3378b0acb2ecde7d797b8061e485159c114ed64504f4f9ad0fa877565103f
```

This packet does not authorize populated `migrate resolve`, populated `migrate deploy`, or production operations.
