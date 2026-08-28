# P0-A3 T004-L Local Backup and Restore Evidence

Date: 2026-08-27

## Local target confirmation

The current target was verified as local development:

```text
host: localhost
port: 5432
database: deskholt_db
schema: public
production VPS: not present in this environment
production traffic: none
```

Read-only source fingerprint:

```text
cluster system_identifier: 7674334565232096068
database OID: 16389
database: deskholt_db
effective schema: public
search_path: "public"
Products: 20
```

## Fresh logical backup

PostgreSQL client tools:

```text
pg_dump: PostgreSQL 18.6
pg_restore: PostgreSQL 18.6
psql: PostgreSQL 18.6
```

A fresh custom-format logical dump was created outside the repository with `pg_dump --format=custom --schema=public --no-owner --no-privileges`:

```text
backup path: C:\Users\YUNI-S~1\AppData\Local\Temp\deskholt-p0-a3-backup-0960fab8b05c423c9490646902b34d36\deskholt_db-20260827-013535.dump
backup timestamp: 2026-08-27 01:35:35 local
source database: deskholt_db
source fingerprint: cluster=7674334565232096068; oid=16389; database=deskholt_db; schema=public
SHA-256: 25e041d59e7ef0a15a7e81c40e70c58c5a3afe7558d5fd0ae43b13bcec1b264d
```

The backup file is outside the repository and credentials are not recorded.

## Restore test

The application role could not create a database in the existing PostgreSQL cluster (`permission denied to create database`). To satisfy the separate-target requirement without changing the source cluster or granting production-like privileges, a fresh disposable local PostgreSQL 18.6 cluster was initialized under the platform temp directory with a random port and trust authentication for the local test process only.

Restore target fingerprint:

```text
host: 127.0.0.1
port: 55433
database: postgres
schema: public
cluster system_identifier: 7678417122254556212
database OID: 5
```

The backup was restored with `pg_restore --clean --if-exists --no-owner --no-privileges` into that different database. The source database was never written.

## Comparison results

```text
Products = 20:                 PASS
all application row counts:    PASS
keyed relationship hash:       PASS
orphan counts:                 PASS
enum inventory:                 PASS
index/object inventory:         PASS
source snapshot hash:           32a5effef8b7b029d415bf9421506b29c69b5fa0da8cb37b50e5ef501002e8fd
restored snapshot hash:         32a5effef8b7b029d415bf9421506b29c69b5fa0da8cb37b50e5ef501002e8fd
```

Detailed source and restored inventories:

- `artifacts/p0-a3/m0/read-only-inventory.json`
- `artifacts/p0-a3/m0/restored-local-inventory.json`

The source and restore fingerprints intentionally differ by cluster/database identity while matching on the compared schema/data evidence.

## Cleanup

Both owned disposable restore clusters were stopped and removed from the platform temp directory after comparison. The source dump remains outside the repository at the recorded path for evidence retention; it was not restored into the source database.

## T004-L decision

```text
T004-L: PASS
M-1 local: PASS
T004-P production operations: separate gate, not evaluated and not required for T004-L
```

T004-L permits review of parked T005/T006 and continuation into M0 through T072. T004-P remains mandatory before T073/M5 and all populated or production operations.
