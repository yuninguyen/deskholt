# Group B-1 / Task 4 verification evidence

Date: 2026-08-29
Base: `ad7eab8`
Worktree: `C:\laragon\www\deskholt\.worktrees\group-b1-brand-category-relations`

## Disposable PostgreSQL 18 flow

Used the exact binaries under `C:\Program Files\PostgreSQL\18\bin`: `initdb.exe`, `pg_ctl.exe`, `createdb.exe`, and `psql.exe`. Created a fresh trust-auth cluster on loopback high port `55487`, database `deskholt_verify`, and an explicit disposable `DATABASE_URL`.

- `npx prisma migrate deploy`: PASS; all 3 migrations applied, including `20260828120000_add_product_brand_category_relations`.
- `npm run db:seed`: PASS; 20 Products seeded.
- Supplemental disposable-only category fixture: inserted four matching Category rows (`standing-desks`, `ergonomic-chairs`, `lighting`, `cable-management`) because `prisma/seed.ts` intentionally seeds Products only and does not populate Category rows.
- Pre-backfill query: `category_id NULL = 20`, `brand_id NULL = 20`, total Products `20`.
- First `npx tsx scripts/backfill-product-category.ts`: `matched: 20`, `updated: 20`, `unchanged: 0`, `unmatched: 0`.
- Relation proof: `20` Products joined a Category whose slug matches the legacy Product category; `category_id NULL = 0`; `brand_id NOT NULL = 0`.
- Second backfill: `matched: 20`, `updated: 0`, `unchanged: 20`, `unmatched: 0` (idempotent; zero writes).
- Final counts: `category_id NULL = 0`, `brand_id NULL = 20`, total Products `20`.

The cluster was stopped with `pg_ctl stop -m immediate` after the timed verification command and its owned data directory `.tmp-pg-group-b1` was removed. Port `55491` used by the timed attempt was also stopped/removed; no owned listener or temp directory remained. The successful flow used port `55487`.

## Migration SQL review

Reviewed `prisma/migrations/20260828120000_add_product_brand_category_relations/migration.sql`. It contains only two nullable `ADD COLUMN` statements, two indexes, and two nullable FK constraints with `ON DELETE SET NULL`; no drops, NOT NULL changes, data rewrite, or forced backfill.

## Read-site / query-count proof

The production validator and `loadSpecificationData` tests both exercise an existing Standing Desk Product through the relation path and assert identical successful outputs. With `category_id` non-null, each initial Product read includes `category_ref`; the tests assert no `prisma.category.findUnique` slug round-trip (zero separate Category slug lookups). The legacy null fallback tests assert exactly one Category slug lookup and preserve success/error semantics. The missing non-null relation test returns null without a slug lookup. This is the before/after proof: legacy behavior was one Product query plus one Category slug query; relation path is one Product query including Category plus zero separate slug queries; null fallback remains one slug query.

## Commands/results

- `npm run lint`: PASS (`eslint . --max-warnings=0`).
- `npx tsc --noEmit`: PASS.
- `npm test`: PASS, `260` tests, `260` passed, `0` failed.
- `npm run build`: attempted against disposable DB in the combined verification command, but the command exceeded the 180-second harness timeout while Next build workers remained active. Earlier build without a database failed only because `DATABASE_URL` was absent during prerender; no code compilation/type error was reported. Therefore build is not claimed green in this evidence.

## Scope / exclusions and detect-changes fallback

No P0-A/P0-B paths, Spec 001 form-correctness files, Brand population, Admin Product UI, default Variant, Available Options, Merchant/Offer models, or unrelated production code were changed. The only intended committed changes are the plan checkbox updates and this evidence document. GitNexus MCP `detect-changes` was unavailable in this delegated runtime; fallback review was `git status --short` plus manual diff/path review before commit. PR/push Step 4 remains unchecked and was not attempted.
