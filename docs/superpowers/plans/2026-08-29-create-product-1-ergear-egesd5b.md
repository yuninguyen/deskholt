# P2 Dry Run — Create Product #1: ErGear EGESD5B

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Actually enter the real product used for the §58 P2 dry run — ErGear 48×24in Electric Standing Desk, model EGESD5B, ASIN B0B41YH9B6 — as Product #1/10, using only real, sourced data. See `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 (P2 Ontology Issue Log) for the full finding history that led here (this plan closes out that dry run for this one product). Do not invent, round, or guess any value not explicitly given below.

## Why a new script, not `prisma/seed.ts`

`prisma/seed.ts` is a **destructive dev-only reseed script** — its `main()` deletes *all* `Conversion`, `Click`, `AffiliateLink`, and `Product` rows before recreating a fixed list of 20 products. Adding this real product to that file would tie a real, permanent product record's existence to a script whose whole purpose is "wipe and recreate the demo batch." Instead, create a new, non-destructive, idempotent script — same pattern as `scripts/backfill-product-category.ts` — that only touches the rows it's responsible for.

## Real data to enter (source: Amazon listing for ASIN B0B41YH9B6, confirmed by the user, plus blueprint §70)

**Brand (first real Brand row ever — `Brand` table is currently empty):**
- slug: `ergear`, name: `ErGear`

**Product identity:**
- name: `ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)`
- slug: `ergear-egesd5b-standing-desk-black`
- category: `standing-desks` (string field — keep populated) **and** `category_id` set to the real `Category` row for `standing-desks` (already seeded by `prisma/seed-standing-desk-attributes.ts` — this script must look it up, not create it; fail loudly if it's missing rather than silently creating a duplicate)
- brand_id: the ErGear `Brand.id` created above
- description: a factual sentence built only from the confirmed listing data (electric height-adjustable standing desk, 48×24in engineered-wood top, steel frame, 176lb weight capacity) — no marketing language invented beyond what the listing states
- image_url: reuse the existing `standing-desks` category stock photo used by the other 5 standing-desk products in `prisma/seed.ts` (`STOCK_IMAGE['standing-desks']` constant) — this is the established (if imperfect) precedent for products without a licensed real product photo yet; do not fabricate a real product image URL
- upc_code: `B0B41YH9B6` (the ASIN — there is no real UPC in the sourced data; do not invent one). Note in a code comment that this is an ASIN being stored in the UPC/SKU display field, not a true UPC.
- status: `DRAFT` (must stay Draft — two required attributes are known-missing per §70, see below; do not publish as part of this plan)
- is_indexed: `false`
- is_sustainable: `false` (no sourced claim either way)

**ProductVariant (exactly one — do NOT materialize the other ~95 merchant size/color combinations, per §70's Merchant Option Explosion finding):**
- sku: `ergear-egesd5b-48x24-black`
- size: `48x24`
- color: `Black`
- is_active: `true`

**ProductAttribute rows — PRODUCT scope (write via the real `validateProductAttributeInput` validator, not a raw insert — confidence `VERIFIED`, `source_url` = the real Amazon product URL for this ASIN, `source_type` = `RETAILER`):**

| key | value | notes |
|---|---|---|
| `min_height_in` | `28.35` | as-listed, already canonical `in` |
| `max_height_in` | convert `118` **cm** → canonical inches via `convertLengthToCanonicalInches(118, 'cm')` (from `src/lib/products/unitConversion.ts`, merged in PR #8) — do not hand-round; use the function's actual output |
| `max_load_lb` | `176` | "Maximum Weight Recommendation" |
| `product_weight_lb` | `43.8` | "Item Weight" |
| `desktop_thickness_in` | `0.67` | "Tabletop Thickness" |
| `adjustment_type` | `ELECTRIC` | "Lifting Mechanism: Electric" |
| `memory_presets` | `4` | "4 Memory Presets" from the listing bullets |
| `frame_material` | `STEEL` | listing says "Carbon Steel" / "Alloy Steel" — both map to the schema's `STEEL` enum member (no `CARBON_STEEL`/`ALLOY_STEEL` distinction exists in the schema, and none is needed here) |
| `desktop_shape` | `RECTANGULAR` | "Shape: Rectangular" |
| `desktop_included` | `true` | desk ships with its desktop |

**Do NOT set** (confirmed missing from the real source, logged as NON-BLOCKER in §70 — leave these `ProductAttribute` rows absent entirely, do not guess a value): `motor_count`, `warranty_months`, `leg_count`, `leg_design`, `lifting_speed_in_s`, `noise_db`, `anti_collision`, `crossbar`, `casters_compatible`, `certification_greenguard`, `certification_bifma`, `assembly_time_minutes`.

**ProductAttribute rows — VARIANT scope (attached to the one variant above, same confidence/source rules):**

| key | value | notes |
|---|---|---|
| `desktop_width_in` | `47.2` | measured `Item Dimensions D x W x H`, NOT the rounded marketing "48 x 24 Inches" size label — see §70 |
| `desktop_depth_in` | `23.6` | same — measured value, not marketing label |
| `desktop_material` | `ENGINEERED_WOOD` | the enum value added in PR #8 specifically for this product |
| `desktop_finish` | `Laminated` | STRING type, free text, as listed |
| `frame_color` | `Black` | STRING type |

**AffiliateLink (Merchant listing + Current Offer, §58 step 8):**
- network: `amazon`
- price: `139.99` — the **Regular Price**, not the $99.99 Prime-exclusive price (decision confirmed 2026-08-29, logged in §70: don't show a membership-conditional price as the universal canonical price)
- raw_url: `https://www.amazon.com/dp/B0B41YH9B6`
- tracking_url: `https://www.amazon.com/dp/B0B41YH9B6?tag=deskholt-pending` — **placeholder tag**, matching the existing `amazonLink()` helper's placeholder pattern in `prisma/seed.ts`. DeskHolt has no live Amazon Associates tag yet (site isn't live/registered) — do not fabricate a real-looking tag. Reuse the exact placeholder convention already in the codebase, do not invent a new one.
- is_in_stock: `true`
- priority_order: `1`

## Global Constraints

- New script only (e.g. `scripts/create-product-ergear-egesd5b.ts`). Do not modify `prisma/seed.ts`, `prisma/seed-standing-desk-attributes.ts`, or any P0-A/P0-B file.
- Idempotent: safe to re-run (upsert Brand by slug, upsert Product by slug, upsert Variant by sku, upsert each ProductAttribute the same way the Admin save action would — same `(product_id, attribute_definition_id, variant_id)` uniqueness the shared validator/save action already relies on). Re-running must not create duplicates or throw on a second run.
- Must call the real `validateProductAttributeInput` (from `src/lib/products/productAttributeValidator.ts`) for every attribute write and fail loudly (throw, non-zero exit) if any real value the plan lists above fails validation — that would mean this plan's data or the schema itself has a bug worth surfacing, not something to silently skip.
- Must call the real `convertLengthToCanonicalInches` for the `max_height_in` cm→in conversion — do not hardcode a pre-computed decimal in the script (the point is exercising the real function, and it keeps the script self-documenting about *why* that number is what it is).
- Product must remain `status: 'DRAFT'` — this plan does not publish anything. Publishing (moving to `ACTIVE`) is a separate, later, explicit decision once `motor_count`/`warranty_months` are resolved or accepted as permanently unset.
- This is a real, permanent data addition (unlike prior plans in this session, which were pure code/schema changes) — do not run this script against any real/shared database. Verify only against an owned, disposable, loopback-only Postgres instance, same discipline as every prior plan.

---

### Task 1: Script skeleton + Brand/Product identity (tests first)

**Files:** `scripts/create-product-ergear-egesd5b.ts` (new), `tests/createProductErgearEgesd5b.test.ts` (new)

- [ ] **Step 1:** Write failing tests (against a real disposable Postgres, following this repo's existing pattern for DB-backed tests — check how `tests/backfillProductCategory.test.ts` or similar sets up its test database) asserting: running the script creates exactly one `Brand` row (`slug: 'ergear'`), exactly one `Product` row with the exact identity fields listed above (`status: 'DRAFT'`, `is_indexed: false`), and the Product's `category_id`/`brand_id` are correctly linked (not null, matching the real `Category`/`Brand` rows).
- [ ] **Step 2:** Write a failing test asserting the script throws a clear error (does not silently create a duplicate `standing-desks` Category) if that Category doesn't already exist in the target database — this script must depend on `prisma/seed-standing-desk-attributes.ts` having already run, not re-create its own copy of Category/AttributeDefinition setup.
- [ ] **Step 3:** Write a failing test asserting the script is idempotent for Brand/Product: running it twice results in exactly one Brand row and one Product row, no duplicate-slug errors.
- [ ] **Step 4:** Implement the script's Brand + Product creation (upsert by slug) to pass. Run tests: PASS.

### Task 2: ProductVariant + ProductAttribute rows (tests first)

**Files:** same script, `tests/createProductErgearEgesd5b.test.ts`

- [ ] **Step 1:** Write failing tests: the script creates exactly one `ProductVariant` (`sku: 'ergear-egesd5b-48x24-black'`) for the Product; every PRODUCT-scope attribute listed in this plan is persisted with the exact value given (assert `max_height_in`'s persisted value equals the real `convertLengthToCanonicalInches(118, 'cm')` output, not a hardcoded literal); every VARIANT-scope attribute is persisted and correctly linked to the one variant (not left `variant_id: null`); every attribute listed as "do NOT set" has no `ProductAttribute` row at all (assert absence, not a null/empty value); `desktop_width_in`/`desktop_depth_in` use the measured `47.2`/`23.6`, not the marketing `48`/`24`.
- [ ] **Step 2:** Write a failing test asserting every write goes through `validateProductAttributeInput` and the script throws (does not silently continue) if a value fails validation — simulate this by temporarily asserting the real function is called (spy/count, or structurally verify by checking the script imports and invokes it) rather than duplicating the validator's own logic in the script.
- [ ] **Step 3:** Write a failing test asserting re-running the script for this step is idempotent (no duplicate `ProductAttribute` rows, no duplicate `ProductVariant`).
- [ ] **Step 4:** Implement to pass. Run tests: PASS.

### Task 3: AffiliateLink (tests first)

**Files:** same script, `tests/createProductErgearEgesd5b.test.ts`

- [ ] **Step 1:** Write failing tests: the script creates exactly one `AffiliateLink` for the Product with `network: 'amazon'`, `price: 139.99` (not `99.99`), `raw_url`/`tracking_url` matching this plan exactly, `is_in_stock: true`.
- [ ] **Step 2:** Write a failing test asserting idempotency (re-running doesn't create a second `AffiliateLink` for the same product/network).
- [ ] **Step 3:** Implement to pass. Run the full new test file plus the full existing suite: PASS, no regressions.

### Task 4: Verification and evidence

- [ ] **Step 1:** Run the script against a fresh disposable Postgres (owned, loopback, high port — same discipline as every prior plan this session) that has already run `prisma migrate deploy` and `npx tsx prisma/seed-standing-desk-attributes.ts` first (this script depends on the Category/AttributeDefinition rows that seed creates). Confirm the full real data set from this plan is persisted exactly as specified.
- [ ] **Step 2:** Query the disposable DB directly (or via a short verification script) and print: the Product row, its Brand/Category relations, all its ProductAttribute rows (PRODUCT + VARIANT scope) with values, and its AffiliateLink — confirm every value matches this plan's table exactly, including the computed `max_height_in` value.
- [ ] **Step 3:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 4:** Record evidence in `artifacts/create-product-1-ergear/evidence.md`: full persisted row dump from Step 2, test output, and an explicit statement that Product #1 of the §58 P2 dry run is now enter-able end-to-end except for the two logged NON-BLOCKER gaps (`motor_count`, `warranty_months`), which remain intentionally unset.
- [ ] **Step 5:** Push the branch, open a PR against `main` (same flow as prior PRs). Do not merge locally. **Do not run this script against any real/shared database as part of this PR** — that is a separate, explicit step the user must approve after this PR is reviewed and merged, since it's a permanent real-data addition rather than a reversible code change.

**After this lands:** The script exists, is tested, and is proven correct against a disposable database. Running it for real (against the actual DeskHolt database) is a separate follow-up action requiring the user's explicit go-ahead — not part of this PR.
