# Group B-1 / Task 4 verification evidence

Date: 2026-08-29
Base: `ad7eab8`; initial evidence: `c843eac`; standalone build evidence: `6386c0c`; specification-save acceptance evidence: `2c19741`
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

## Specification-save acceptance (real production-equivalent verifier)

Command: `SPEC_001_ACCEPTANCE_ALLOW=true SPEC_001_ACCEPTANCE_DATABASE_URL=postgresql://YUNI-SS980@127.0.0.1:56087/deskholt_verify_r2 SPEC_001_ACCEPTANCE_OUTPUT=artifacts/group-b1-brand-category/spec-001-acceptance-r2.json npx tsx scripts/verify-spec-001-acceptance.ts`.

Observed result: `acceptance: PASS` against disposable PostgreSQL 18 trust-auth loopback target `127.0.0.1:56087/deskholt_verify_r2`. Real `loadSpecificationData`, `validateProductAttributeInput`, `createSaveSpecificationsAction`, and Prisma transaction paths executed. The three Standing Desk Products were related by real backfill (`matched: 5`, including all 3 target products; `updated: 5`; `unmatched: 15` for intentionally unseeded non-standing categories). Target: `autonomous-smartdesk-dual-motor-white`. Initial completeness for all three: `0/9`. Save proof: `requiredRowsWritten: 9`, `verifiedRows: 9`, `fullCompletenessAfterSave: 9/9`. Clear-to-delete proof: row `cmtddwdy80001uultxjd8ml96__p` deleted and completeness became `8/9`. Redirects: `/admin/products/cmtddwd7k0004trthl2zg5c01/specifications?saved=1` twice (save and clear). Protected snapshots were unchanged: Product/AffiliateLink/Click/Conversion counts `20/20/0/0`, before and after SHA-256 `52a8b0428109953c114583d64304471e6cd72f7ed25757325cfe9bc7d8ff7856`. This proves server-side production-equivalent behavior only; no browser, auth, or React transport claim is made.

## Migration SQL review

Reviewed `prisma/migrations/20260828120000_add_product_brand_category_relations/migration.sql`. It contains only two nullable `ADD COLUMN` statements, two indexes, and two nullable FK constraints with `ON DELETE SET NULL`; no drops, NOT NULL changes, data rewrite, or forced backfill.

## Read-site / query-count proof

The production validator and `loadSpecificationData` tests both exercise an existing Standing Desk Product through the relation path and assert identical successful outputs. With `category_id` non-null, each initial Product read includes `category_ref`; the tests assert no `prisma.category.findUnique` slug round-trip (zero separate Category slug lookups). The legacy null fallback tests assert exactly one Category slug lookup and preserve success/error semantics. The missing non-null relation test returns null without a slug lookup. This is the before/after proof: legacy behavior was one Product query plus one Category slug query; relation path is one Product query including Category plus zero separate slug queries; null fallback remains one slug query.

Exact query-proof tests and observed spy counts:
- `tests/productAttributeValidator.test.ts` — `validator uses the product category relation without a slug lookup`: `categoryLookups = 0`; `validator preserves relation integrity when a non-null category relation is missing`: `categoryLookups = 0`; `validator preserves legacy success semantics with exactly one slug lookup`: `categoryLookups = 1`; `validator preserves legacy error semantics with exactly one slug lookup`: `categoryLookups = 1`.
- `tests/productSpecificationsAction.test.ts` — `specification loader uses category relation and avoids slug lookup`: `categoryLookups = 0`; `specification loader falls back to one slug lookup for legacy products`: `categoryLookups = 1`; `specification loader returns null without slug lookup for missing non-null relation`: `categoryLookups = 0`.
- Focused command result: all named tests passed; full suite result remains `260/260`.

## Commands/results

- `npm run lint`: PASS (`eslint . --max-warnings=0`).
- `npx tsc --noEmit`: PASS.
- `npm test`: PASS, `263` tests, `263` passed, `0` failed (final exact-slug collision regressions included).
- `npm run build`: PASS in a standalone bounded run with disposable `DATABASE_URL`; Prisma Client generation PASS, Next/Turbopack compilation PASS, TypeScript PASS, page data collection PASS, and static page generation PASS (`13/13`). The earlier combined verifier's 180-second outer timeout remains historical context only; it is superseded by this standalone result.

## Connected Vercel/Neon preview migration

After PR #7's first Vercel build exposed the expected deployment ordering gate (`P2022`: the connected database did not yet have `products.category_id`), the owner explicitly authorized migrating the temporary Vercel/Neon preview integration database under `docs/operations/deployment-strategy.md`.

Secret-free preflight fingerprint:

- Vercel project: `yuninguyens-projects/deskholt`, PR preview branch `group-b1-brand-category-relations`.
- Datasource provider/host suffix: Neon, `aws.neon.tech`; PostgreSQL `18.6`; database `neondb`; role `neondb_owner`.
- Pre-migration counts: `20` Products, `0` Categories, `0` Brands.
- Pre-migration history: the baseline and P0-A3 index-gate migrations were finished; the Group B-1 migration was absent.
- GitHub Actions `check` for the reviewed PR head was successful before the preview migration.

Executed only the reviewed migration through `prisma migrate deploy`: `20260828120000_add_product_brand_category_relations`. Postcheck confirmed both columns nullable, both indexes present, both FKs present with `SET NULL`/`CASCADE`, the migration marked finished, and Product/Category/Brand counts preserved at `20/0/0`.

The real backfill script was then run as authorized. Because this preview database has no Category rows, it safely reported all `20` Products as unmatched and performed `0` updates; `category_id` and `brand_id` therefore remain null for all Products. No Category content was invented and the explicitly excluded Standing Desk/default-Variant content seed was not run. This is the planned report-and-preserve behavior for missing Category matches, not a backfill failure.

Temporary Vercel OIDC/environment files and local project-link metadata were deleted immediately after the postcheck; no datasource URL or credential is recorded here.

## Scope / exclusions and detect-changes fallback

No P0-A/P0-B paths, Spec 001 form-correctness files, Brand population, Admin Product UI, default Variant, Available Options, Merchant/Offer models, or unrelated production code were changed. The only intended Task 4 documentation commits are the plan checkbox updates and this evidence document; resolver and regression-test changes are tracked separately in this review fix. GitNexus MCP `detect-changes` was unavailable in this delegated runtime; fallback review was `git status --short` plus manual diff/path review before commit. PR/push Step 4 completed with PR #7 (`https://github.com/yuninguyen/deskholt/pull/7`) against `main`; the initial reviewed head `c372d22` reported both GitHub checks successful before this documentation-only completion commit. Final head/check state is verified separately after push.
