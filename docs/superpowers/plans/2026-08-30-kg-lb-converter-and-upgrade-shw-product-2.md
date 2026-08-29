# kg↔lb Converter + Upgrade Product #2 (SHW OD-92A-K)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close a second real, data-verified BLOCKER unit-mismatch (mass this time, not length) found while entering Product #2 of the §58 P2 dry run — SHW OD-92A-K standing desk, ASIN B07MBR8N89 — and use that fix to bring this **existing legacy product** (already in the database from `prisma/seed.ts`, currently `ACTIVE` with only unstructured legacy `specs`) up to full structured-attribute parity with Product #1. See `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 for the finding this plan closes.

## Fix: narrow kg↔lb mass conversion (mirrors the in↔cm fix from PR #8)

**Real evidence:** the SHW listing's "Maximum Weight Recommendation" is given as `50 kg` — the schema's canonical unit for `max_load_lb`/`product_weight_lb` is `lb` (§17). This is the same class of problem PR #8 solved for length (`in`/`cm`), now recurring for mass (`lb`/`kg`).

**Required fix — scoped narrowly to lb↔kg only, mirroring the existing in↔cm mechanism exactly:**

1. A pure conversion function alongside the existing one in `src/lib/products/unitConversion.ts`, e.g. `convertMassToCanonicalPounds(value: number, sourceUnit: 'lb' | 'kg'): number` — returns `value` unchanged for `'lb'`, multiplies by `2.2046226218` for `'kg'` (or divides by the kg-per-lb constant — pick the standard `1 kg = 2.20462262185 lb` conversion, document the exact constant used in a code comment). Do not build a shared "any unit family" abstraction — a second small dedicated function is correct here, matching how `convertLengthToCanonicalInches` was kept dedicated rather than generalized prematurely.
2. Generalize (not duplicate) the existing wiring in `specificationSaveAction.ts` and `ProductSpecificationsForm.tsx`, which currently hardcodes `row.unit === 'in'` as the only convertible unit. Extend it so a row whose canonical `unit` is `'lb'` gets the same treatment (source-unit selector `lb`/`kg` defaulting to `lb`, conversion before validation/storage, draft preservation of the selected source unit) using `convertMassToCanonicalPounds`. Every other unit (`in/s`, `dB`, `months`, `minutes`, non-numeric) remains completely unaffected — still no selector, no behavior change. Prefer a small lookup (e.g. `{ in: { units: ['in','cm'], convert: convertLengthToCanonicalInches }, lb: { units: ['lb','kg'], convert: convertMassToCanonicalPounds } }`) over two near-duplicate copy-pasted code blocks, but do not build this as a generic pluggable "unit registry" beyond what these two concrete pairs need.
3. Tests must prove the existing `in`/`cm` behavior from PR #8 is completely unchanged (regression guard) in addition to the new `lb`/`kg` behavior.

## Upgrade: Product #2 — SHW OD-92A-K (existing product, real data from ASIN B07MBR8N89)

This product **already exists** in the database (`prisma/seed.ts`, slug `shw-48in-standing-desk-drawer-black`, currently `status: ACTIVE`, `is_indexed: false`, one auto-created default `ProductVariant` with `sku: shw-48in-standing-desk-drawer-black-default` and `size`/`color` both `null`, one `AffiliateLink` at the stale placeholder price `$299.99`). This plan **upgrades that existing row** — it does not create a duplicate product, and it does not change its `id`/`slug` (would break any existing click/AffiliateLink references).

**Brand (second real Brand row — first was `ergear` in Product #1):**
- slug: `shw`, name: `SHW`

**Product identity — update existing row, do not touch `id`/`slug`/`name`/`description`/`image_url`/`status` (leave `ACTIVE` as-is, it already was):**
- category_id: the real `Category` row for `standing-desks` (same lookup-and-fail-loudly pattern as Product #1's script — do not create a duplicate Category)
- brand_id: the SHW `Brand.id` created above
- upc_code: `811244032715` — this is a **real UPC** this time (unlike Product #1, which had no true UPC and used the ASIN as a stand-in). Use the real UPC, do not use the ASIN here.

**ProductVariant — update the existing default variant (`sku: shw-48in-standing-desk-drawer-black-default`), do not create a second variant:**
- size: `48-Inch`
- color: `Black`

**ProductAttribute rows — PRODUCT scope (`confidence: VERIFIED`, `source_url: https://www.amazon.com/dp/B07MBR8N89`, `source_type: RETAILER`):**

| key | value | notes |
|---|---|---|
| `min_height_in` | `28` | as-listed, already canonical `in` |
| `max_height_in` | convert `114` **cm** → canonical inches via `convertLengthToCanonicalInches(114, 'cm')` |
| `max_load_lb` | convert `50` **kg** → canonical pounds via the new `convertMassToCanonicalPounds(50, 'kg')` — this is the whole reason this plan exists, use the real function output, do not hand-round |
| `desktop_thickness_in` | `0.6` | "Tabletop Thickness" |
| `adjustment_type` | `ELECTRIC` | "Lifting Mechanism: Electric" |
| `frame_material` | `STEEL` | listing gives "Base Material: Metal" / "Frame Material Type: Metal" but "Furniture Leg Material: Alloy Steel" is the specific one — maps to the schema's `STEEL` member (no generic "Metal"/"Alloy Steel" distinction in the enum) |
| `desktop_shape` | `RECTANGULAR` | "Shape: Rectangular" |
| `desktop_included` | `true` | desk ships with its desktop |

**Do NOT set** (confirmed missing or only qualitative in the real source — do not guess a number): `motor_count` (not stated), `warranty_months` (only "Limited Warranty", no duration — this is the **second** product in a row missing this; note in the evidence file that this pattern has now recurred twice, worth revisiting `isRequired` for this field per §59 once a few more products are attempted, but do not change the schema in this plan), `memory_presets` (listing only says "Memory Preset" as a qualitative feature name in "Special Feature", never a specific count — unlike Product #1's explicit "4 Memory Presets" bullet; do not guess a number here), `product_weight_lb` (no "Item Weight" field present in this listing at all), `leg_count`, `leg_design`, `lifting_speed_in_s`, `noise_db`, `anti_collision`, `crossbar`, `casters_compatible`, `certification_greenguard`, `certification_bifma`, `assembly_time_minutes`.

**ProductAttribute rows — VARIANT scope (attached to the existing default variant, same confidence/source rules):**

| key | value | notes |
|---|---|---|
| `desktop_width_in` | `48` | measured `Item Dimensions D x W x H` and the marketing `Size` label agree this time — no discrepancy to resolve |
| `desktop_depth_in` | `24` | same — both sources agree |
| `desktop_material` | `ENGINEERED_WOOD` | same enum value PR #8 added for Product #1 |
| `desktop_finish` | `Laminated` | STRING, as listed |
| `frame_color` | `Black` | STRING |

**AffiliateLink — update the existing row (same `network: 'amazon'`), do not create a second one:**
- price: `159.87` — the current real listed price (the seeded `$299.99` was an "indicative snapshot as of 2026-08-11" per `prisma/seed.ts`'s own header comment, and is now stale; update it to the current real price found today)
- raw_url / tracking_url: unchanged — already the correct real ASIN URL with the same placeholder tag convention

## Global Constraints

- Do not touch P0-A/P0-B code, or any file outside: `src/lib/products/unitConversion.ts`, `specificationSaveAction.ts`, `specificationDraftStore.ts`, `ProductSpecificationsForm.tsx`, and a new upgrade script (e.g. `scripts/upgrade-product-shw-od92ak.ts`, following the exact non-destructive/idempotent/`validateProductAttributeInput`/transaction-rollback pattern of `scripts/create-product-ergear-egesd5b.ts`).
- The upgrade script must look up the existing Product by slug and fail loudly if it's missing (do not create a new Product row — this is an update-only script, unlike Product #1's create-only script).
- Idempotent: safe to re-run (same upsert-by-natural-key pattern as `create-product-ergear-egesd5b.ts` — Brand by slug, Variant by matching the product's existing row, ProductAttribute by `(product_id, attribute_definition_id, variant_id)`, AffiliateLink by `(product_id, network)`).
- Must call the real `validateProductAttributeInput` and the real conversion functions for every write, same discipline as Product #1's script.
- Do not change this product's `status` or `is_indexed` — leave both exactly as they currently are in the database.
- This is a real, permanent update to a live (`ACTIVE`) database row — verify only against an owned, disposable, loopback-only Postgres instance seeded with equivalent fixture data (a Product at this slug with a default variant and an AffiliateLink) for all tests. Do not run the upgrade script against any real/shared database as part of this PR — that remains a separate, explicit follow-up step for the user, same as Product #1.

---

### Task 1: kg↔lb conversion function (tests first)

**Files:** `src/lib/products/unitConversion.ts`, `tests/unitConversion.test.ts`

- [ ] **Step 1:** Write failing tests for `convertMassToCanonicalPounds`: `('lb')` returns the value unchanged (including `0` and a negative value, mirroring the existing in/cm test style); `('kg')` converts correctly (assert `50 kg` → the real conversion result within a reasonable floating-point tolerance, and state the exact expected decimal in the test so a future reader can verify the constant used); an unsupported unit throws a clear error, same pattern as `convertLengthToCanonicalInches`.
- [ ] **Step 2:** Implement to pass.

### Task 2: generalize the save-action/form wiring to cover both unit pairs (tests first)

**Files:** `tests/productSpecificationsAction.test.ts`, `tests/productSpecificationsForm.test.ts`, `specificationSaveAction.ts`, `specificationDraftStore.ts` (if its type needs to stay generic — check whether the existing `sourceUnit?: string` field already covers this without change), `ProductSpecificationsForm.tsx`

- [ ] **Step 1:** Write failing tests: a row with canonical `unit === 'lb'` and `sourceUnit__<rowKey> = 'kg'` converts correctly before validation/storage; omitting `sourceUnit` on an `lb` row behaves exactly as before PR #8 introduced any of this (raw value stored as-is); a row with `unit === 'lb'` and an unsupported `sourceUnit` (e.g. `'oz'`) is rejected via the existing aggregated-error path, not a crash; every existing `in`/`cm` test from PR #8 still passes unmodified (regression guard — do not weaken or delete those tests).
- [ ] **Step 2:** Write failing tests for the form: a row with `unit === 'lb'` renders a `lb`/`kg` selector defaulting to `lb`; a row with any other unit still renders no selector; a row with `unit === 'in'` still renders the `in`/`cm` selector exactly as before (regression guard).
- [ ] **Step 3:** Implement the generalized wiring per the plan's Fix description. Run all tests: PASS, including the full pre-existing suite with zero regressions.

### Task 3: SHW product upgrade script (tests first)

**Files:** `scripts/upgrade-product-shw-od92ak.ts` (new), `tests/upgradeProductShwOd92ak.test.ts` (new, following the same self-owned disposable-Postgres integration harness pattern as `tests/createProductErgearEgesd5b.test.ts` — reuse that pattern's structure, don't reinvent it)

- [ ] **Step 1:** Write failing tests (against a fixture database seeded with a Product row matching the real pre-upgrade state described above — id/slug/existing variant/existing AffiliateLink at the stale price): running the script throws a clear error if the target Product slug doesn't exist (don't silently create one); otherwise it updates `category_id`/`brand_id`/`upc_code` on the existing Product without changing its `id`, `slug`, `name`, `description`, `image_url`, `status`, or `is_indexed`.
- [ ] **Step 2:** Write failing tests: the script updates the existing default `ProductVariant`'s `size`/`color` (does not create a second variant); persists all listed PRODUCT- and VARIANT-scope attributes with the exact values (assert `max_load_lb`'s persisted value equals the real `convertMassToCanonicalPounds(50, 'kg')` output, and `max_height_in` equals `convertLengthToCanonicalInches(114, 'cm')`); every "do NOT set" key has no `ProductAttribute` row; updates the existing `AffiliateLink`'s `price` to `159.87` without creating a second link or changing `raw_url`/`tracking_url`.
- [ ] **Step 3:** Write a failing test for idempotency (re-running produces no duplicates and the same final state) and for rollback (an invalid attribute value rolls back the entire transaction, leaving the Product's pre-upgrade state — including its stale price — completely untouched).
- [ ] **Step 4:** Implement to pass. Run the full new test file plus the full existing suite: PASS, no regressions.

### Task 4: Verification and evidence

- [ ] **Step 1:** Run everything against a fresh disposable Postgres (owned, loopback, high port) seeded with migrations + `seed-standing-desk-attributes.ts` + a fixture Product matching the real pre-upgrade SHW row. Confirm the full real data set from this plan persists exactly as specified after running the upgrade script.
- [ ] **Step 2:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 3:** Record evidence in `artifacts/kg-lb-converter-and-shw-upgrade/evidence.md`: the kg→lb conversion proof, the full before/after persisted-row dump from the disposable DB, test output, and an explicit note that this is the second real product to hit the "warranty_months has no duration" and "motor_count absent" NON-BLOCKER gaps (first logged for Product #1 in blueprint §70).
- [ ] **Step 4:** Push the branch, open a PR against `main`. Do not merge locally. **Do not run the upgrade script against any real/shared database** — that is a separate, explicit step the user approves after this PR is reviewed and merged, same as Product #1's script.

**After this lands:** The kg↔lb gap is closed the same way in↔cm was, and Product #2 (SHW OD-92A-K) is ready to upgrade for real once the user approves running the script — after which it will have full structured attributes, a real UPC, a real Brand, and a current real price, matching Product #1's completeness level.
