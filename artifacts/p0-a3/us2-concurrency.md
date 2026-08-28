# P0-A3 US2 PostgreSQL Publishing Concurrency Evidence

Date: 2026-08-27

Target: explicit user-confirmed disposable local development database; non-secret fingerprint `7674334565232096068/16389/deskholt_db/public`. Ambient `DATABASE_URL` was intentionally set to a distinct refused value so the verifier could prove it used only `P0_A3_PUBLISHING_DATABASE_URL`.

Command: `npm run verify:p0-a3:publishing-concurrency`

Result: **PASS (8/8 deterministic PostgreSQL race scenarios)**.

- enable-index vs DRAFT, both lock orders: final `DRAFT + false`;
- enable-index vs BLOCKED, both lock orders: final `BLOCKED + false`;
- enable-index vs ARCHIVED, both lock orders: final `ARCHIVED + false`;
- disable-index vs lifecycle transition, both lock orders: final `BLOCKED + false`.

The verifier used the production `createPrismaPublishingStore` and `executePublishingCommand` path, real `SELECT ... FOR UPDATE`, overlapping transactions/barriers, current migration history checks, and owned fixture cleanup. No production/populated target was used.