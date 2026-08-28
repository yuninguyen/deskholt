# P0-A3 M-1 Environment Safety Audit

Date: 2026-08-25

## Populated database identity

Captured read-only through `scripts/snapshot-p0-a3-database.ts`:

- redacted target: `postgresql://deskholt_user:[REDACTED]@localhost:5432/deskholt_db?schema=public`
- cluster system identifier: `7674334565232096068`
- database OID: `16389`
- database name: `deskholt_db`
- effective schema: `public`
- search path: `"public"`
- Product count: 20
- migration history: absent; database is unmanaged by Prisma Migrate
- migration-role privilege classification: PASS for the read-only checks performed
- write probe: NOT PERFORMED

## Clean/shadow/failure targets

No clean, shadow, or failure-fixture target has been allocated during this run. They remain mandatory explicitly isolated targets for later disposable verification and must be fingerprinted before use.

## T004-L local backup / restore evidence

A fresh custom-format PostgreSQL dump was created outside the repository. See `artifacts/p0-a3/m-1-local-backup-and-restore.md` for the timestamp, source fingerprint, path, and SHA-256 checksum.

T004-L local restore comparison passed using a separate disposable PostgreSQL cluster/database. See `artifacts/p0-a3/m-1-local-backup-and-restore.md` for restore fingerprint, matching snapshot hash, comparison results, and cleanup evidence.

## T004-P production backup / restore evidence

**T004-P is separately deferred until before T073/M5.** The repository contains historical/procedural references to backup destinations and retention, but no current production evidence proving all required controls:

- identified automatic backup schedule/job and recent successful run;
- off-production-VPS storage destination/provider;
- automatic deletion of backups older than 30 days and current retention/oldest-backup evidence;
- selected production backup identifier/path/timestamp and target fingerprint;
- size/checksum where supported;
- restore procedure or recent restore-test evidence.

A local SQLite backup reference in historical implementation documentation is not evidence for the populated PostgreSQL database and does not satisfy the off-VPS requirement.

## Safety decision

T004-L local implementation gate is now passed. M0 through T072 may proceed after review of parked T005/T006. T004-P evidence is additionally required before T073/M5 and all populated or production operations; production infrastructure/evidence remains absent. No populated database write, baseline resolve, populated deploy, or production rollout is authorized.
