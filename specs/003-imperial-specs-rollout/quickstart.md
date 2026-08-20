# Quickstart: Imperial Canonical Specs + Public Specs Rollout

Validation guide for the `003-imperial-specs-rollout` feature. See [data-model.md](./data-model.md) for exact field/value mappings and [research.md](./research.md) for the decisions behind each step.

## Prerequisites

- Local Postgres running via Laragon (`deskholt_db`), reachable via the `DATABASE_URL` in `.env`
- Dependencies installed (`npm install`)
- Working tree on branch `003-imperial-specs-rollout`

## Step 1 — Run the one-time migration script

```bash
npx tsx scripts/migrate-specs-to-imperial.ts
```

**Expected outcome**: script reports 10 `AttributeDefinition` rows updated (key + unit renamed in place, same `id`) and 8 `ProductAttribute` rows converted (`value_number` recalculated to the imperial equivalent, rounded to 1 decimal). See [data-model.md](./data-model.md) for the exact old→new key/unit table and conversion formulas. Script must be idempotent-safe to re-run against already-migrated data without double-converting (verify by running twice and confirming the second run reports 0 changes, or errors clearly rather than silently re-converting).

## Step 2 — Verify the definitions in the database

```bash
npx prisma studio
```

Open the `AttributeDefinition` table, filter by category `standing-desks`. Confirm all 10 renamed rows (e.g. `min_height_in`, `max_load_lb`, `lifting_speed_in_s`) show the new `key` and new `unit`, and that the other 25 rows are untouched.

## Step 3 — Verify converted values

In the same `ProductAttribute` table, filter to the 2 known-affected products (UPLIFT V2, Autonomous SmartDesk). Confirm the 8 rows tied to the 10 renamed definitions now hold imperial numbers (spot-check one, e.g. a `desktop_width_mm`→`desktop_width_in` row: old mm value ÷ 25.4 ≈ new value, rounded to 1 decimal).

## Step 4 — Verify Admin Specifications tab

1. Run the dev server: `npm run dev`
2. Navigate to Admin → Products → UPLIFT V2 (or Autonomous SmartDesk) → Specifications tab
3. Confirm the length/weight/speed fields now show imperial unit labels (`in`, `lb`, `in/s`) next to the input, sourced directly from `AttributeDefinition.unit` — no conversion math, no dual-value display
4. Confirm the previously-saved values now display as the imperial numbers from Step 3 (not the old metric numbers)

## Step 5 — Verify public Product Page (structured path)

Visit `/products/uplift-v2-standing-desk-bamboo-gray` (or the Autonomous SmartDesk slug). Confirm the "Technical Specifications" section renders structured rows in imperial units, sourced from `loadSpecificationData`.

## Step 6 — Verify public Product Page (fallback path, no regression)

Visit any of the other 18 product pages (e.g. `/products/flexispot-e7-pro`) that have zero structured `ProductAttribute` rows. Confirm the "Technical Specifications" section renders exactly as it does today — the legacy `product.specs` text block, unchanged.

## Step 7 — Automated test

```bash
npm test
```

**Expected outcome**: `tests/specsDisplay.test.ts` passes, covering the structured-vs-fallback branching logic (populated structured rows → render structured; zero structured rows → render legacy fallback).

## Notes

- No `/contracts/` artifact — this feature has no external API surface (internal Admin page, public SSR page, and a standalone one-time migration script), so a contracts directory is skipped per the Phase 1 guidance ("skip if project is purely internal").
