# P0-A3 M4 Review

Date: 2026-08-27

M4 disposable proof review: **PASS with documented Prisma history-log limitation**.

- clean and failure targets were separate disposable databases on a separate temporary PostgreSQL cluster;
- source populated database `deskholt_db` was never written;
- baseline and feature source/copy hashes matched;
- clean chain proved the deterministic legacy backfill, safe defaults, partial-index behavior, and preservation of `updated_at`/non-target fields;
- failure chain rolled back enum, column, defaults, and legacy data;
- failure marker is present in the distinctly named `_prisma_migrations` row and PostgreSQL server log; Prisma 5.22.0 leaves the row `logs` column NULL for this SQL error, which is recorded rather than synthesized;
- temporary Prisma roots were removed after evidence capture;
- no populated resolve/deploy was performed.

T004-P production operations evidence remains absent and continues to block T073/M5/M6.
