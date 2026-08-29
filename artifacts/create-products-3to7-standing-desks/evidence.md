# Products #3–7 standing-desk batch evidence

## Safety boundary

The batch creation script was executed only by the self-owned PostgreSQL 18 test harness. The harness rejects `ERGEAR_TEST_DATABASE_URL`, initializes a temporary root, binds PostgreSQL only to `127.0.0.1`, migrates and seeds only `prisma/seed-standing-desk-attributes.ts`, then stops the process and deletes the root. `prisma/seed.ts` was not used. No real or shared DeskHolt database was targeted.

## Persisted owned-database proof

The final enabled test command used `ERGEAR_TEST_POSTGRES_BIN=C:\Program Files\PostgreSQL\18\bin` and passed 9/9 with zero skips/failures. It proves exactly five DRAFT/non-indexed standing-desk Products and four Brands, identity/UPC/sustainability fields, exact one Variant per product, explicit structured PRODUCT/VARIANT attribute sets and omissions, source metadata, Claiks `119 cm` conversion, OffiGo `L_SHAPED`, validation rollback, stale/wrong-scope reconciliation including obsolete variants, exact Amazon links, and idempotent rerun behavior.

## Blueprint decisions

- FEZIBO uses `is_sustainable: true` for FSC-certified wood; `desktop_material` remains absent rather than inventing an enum value.
- OffiGo’s lifetime frame warranty appears only in the description; `warranty_months` remains absent.
- Claiks `desktop_finish` remains absent due contradictory source fields.
- Veken 55 has no `max_load_lb`; it remains absent.
- All five intentionally leave `motor_count` absent; no schema change was made.

## Commands completed

- Focused owned PostgreSQL 18 integration: 9 pass, 0 fail, 0 skip.
- `npx tsc --noEmit`: pass.
- `git diff --check`: pass.

The pending final branch gate will run full `npm test`, lint, and build before PR integration.
