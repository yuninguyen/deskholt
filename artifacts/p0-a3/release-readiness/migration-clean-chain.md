# P0-A3 Final Disposable Migration Verification

Date: 2026-08-27

A fresh owned PostgreSQL 18.6 cluster was initialized on loopback port 55437 with separate `p0a3_clean` and `p0a3_failure2` databases, then stopped and removed.

Clean-chain result: **PASS**.

- baseline deploy exit 0;
- P0-A3 feature deploy exit 0;
- exact baseline and feature migration entries present;
- source/copy hashes equal;
- legacy Product became `ACTIVE + false`;
- all non-target values and `updated_at` remained unchanged;
- defaults and both partial unique indexes passed.

Rollback-fixture result: **PASS**.

- baseline deploy exit 0;
- intentional feature deploy exit 1 as required;
- failed history row present;
- ProductStatus enum absent after rollback;
- Product status column absent after rollback;
- legacy index value and `updated_at` unchanged;
- owned temporary Prisma root cleaned.

One earlier parallel rollback attempt produced Windows `EBUSY` during temp-root deletion; it was discarded and rerun sequentially on the fresh `p0a3_failure2` database, where cleanup passed.