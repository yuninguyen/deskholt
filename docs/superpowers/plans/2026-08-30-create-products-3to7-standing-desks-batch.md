# P2 Dry Run — Create Products #3–7: 5 Real Standing Desks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Enter 5 more real standing desks for the §58 P2 dry run — Veken 47.2" (ASIN B0FPX18P4J), Claiks 48x24 (ASIN B0BZ7GXM4M), FEZIBO 48x24 (ASIN B0F8MHPVPH), Veken 55" (ASIN B0DWMJCQBX), OffiGo 63" L-Shape (ASIN B0FPFSYXNF). See `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 ("Products #3–7 batch") for the full finding history and decisions this plan implements. Do not invent, round, or guess any value not explicitly given below — every "do NOT set" list is deliberate, not an oversight.

**Scope note:** the user supplied 14 products total; 9 (2 chairs, 5 lighting, 2 cable-management) are explicitly OUT OF SCOPE for this plan — `ergonomic-chairs`/`lighting`/`cable-management` categories have no `AttributeDefinition`/`CategoryAttribute` schema yet (only `standing-desks` does). Do not create Products, Brands, or any other rows for those 9 items as part of this plan.

## Why one script, data-driven (not five near-duplicate files)

Follow the exact pattern of `scripts/create-product-ergear-egesd5b.ts` (real validator calls, real conversion functions, one transaction per product, idempotent upsert-by-natural-key), but structure it as **one script with an array of 5 product definitions**, looping the same creation logic per entry — each product's creation must be its own independent transaction (a validation failure on product #3 must not roll back or block products #4–7 that already succeeded in the same run).

## Product #3: Veken 47.2" (ASIN B0FPX18P4J)

- Brand: slug `veken`, name `Veken`
- Product: name `Veken 47.2 Inch Large Electric Standing Desk, Gaming Table (Black)`, slug `veken-47-2in-standing-desk-black`, upc_code `810191341857`, description built only from confirmed data (electric standing desk, 47.24x23.64in engineered-wood top, steel frame, 176lb capacity), is_sustainable `false`
- Variant: sku `veken-47-2in-standing-desk-black-default`, size `47.2x23.6`, color `Cyber Black`
- AffiliateLink: network `amazon`, price `89.99`, raw_url `https://www.amazon.com/dp/B0FPX18P4J`, tracking_url `https://www.amazon.com/dp/B0FPX18P4J?tag=deskholt-pending`
- PRODUCT-scope attributes (`VERIFIED`, source_url `https://www.amazon.com/dp/B0FPX18P4J`, source_type `RETAILER`): `min_height_in=28.3`, `max_height_in=46.5` (already canonical `in`, no conversion needed), `max_load_lb=176`, `product_weight_lb=42.1`, `adjustment_type=ELECTRIC`, `frame_material=STEEL` (source: "Carbon Steel"), `desktop_shape=RECTANGULAR`, `desktop_included=true`
- VARIANT-scope attributes (same confidence/source): `desktop_width_in=47.24` (measured, not the rounded "47.2" marketing label), `desktop_depth_in=23.64` (measured), `desktop_material=ENGINEERED_WOOD`, `desktop_finish=Laminated`, `frame_color=Cyber Black`
- Do NOT set: `motor_count`, `warranty_months` (source says "Manufacturer Warranty Description: China." — not a usable duration, treat as absent), `desktop_thickness_in`, `memory_presets`

## Product #4: Claiks 48x24 (ASIN B0BZ7GXM4M)

- Brand: slug `claiks`, name `Claiks`
- Product: name `Claiks Electric Height Adjustable Standing Desk, 48x24 Inch (Rustic Brown)`, slug `claiks-standing-desk-rustic-brown`, upc_code: none given — leave `upc_code` null, do not invent one, description from confirmed data, is_sustainable `false`
- Variant: sku `claiks-standing-desk-rustic-brown-default`, size `48x24`, color `Rustic Brown`
- AffiliateLink: network `amazon`, price `109.99`, raw_url `https://www.amazon.com/dp/B0BZ7GXM4M`, tracking_url `https://www.amazon.com/dp/B0BZ7GXM4M?tag=deskholt-pending`
- PRODUCT-scope: `min_height_in=28.3`, `max_height_in=` convert `119` **cm** → canonical inches via `convertLengthToCanonicalInches(119, 'cm')` (do not hand-round), `max_load_lb=176`, `product_weight_lb=41.4`, `desktop_thickness_in=0.75`, `adjustment_type=ELECTRIC`, `frame_material=STEEL` (source: "Frame Material Type: Alloy Steel"), `desktop_shape=RECTANGULAR`, `desktop_included=true`
- VARIANT-scope: `desktop_width_in=47.24`, `desktop_depth_in=23.62` (both from the precise `Item Dimensions: 23.62 x 47.24 x 28.35 inches`, not the rounded `24"D x 48"W` label), `desktop_material=ENGINEERED_WOOD`, `frame_color=Black` (source: "Base Color: Black" / "Furniture Finish: Black" — consistent)
- Do NOT set: `motor_count`, `warranty_months` ("Limited", no duration), `memory_presets`, **`desktop_finish`** — source gives `Finish Type: Steel` which contradicts `Top Material Type: Engineered Wood` (a wood top cannot have a "Steel" finish); this is a source data contradiction, leave unset rather than store a self-contradictory value (see blueprint §70 for the full reasoning)

## Product #5: FEZIBO 48x24 (ASIN B0F8MHPVPH)

- Brand: slug `fezibo`, name `FEZIBO`
- Product: name `FEZIBO Standing Desk 48 x 24 Inch Electric Height Adjustable (Maple)`, slug `fezibo-standing-desk-maple`, upc_code: none given — leave null, description from confirmed data, **`is_sustainable: true`** (per the confirmed decision: the source's "FSC-Certified Wood" is a sustainability certification fact, captured here since `desktop_material` cannot represent it)
- Variant: sku `fezibo-standing-desk-maple-default`, size `48x24`, color: none clearly attributable to the variant — leave `color` null (the "Maple" in the title refers to desktop wood tone, not a frame/product color field the source states plainly)
- AffiliateLink: network `amazon`, price `112.99`, raw_url `https://www.amazon.com/dp/B0F8MHPVPH`, tracking_url `https://www.amazon.com/dp/B0F8MHPVPH?tag=deskholt-pending`
- PRODUCT-scope: `min_height_in=27.3`, `max_height_in=45` (already canonical `in`), `max_load_lb=176`, `adjustment_type=ELECTRIC`, `frame_material=STEEL` (source: "Frame Material Type: Alloy Steel"), `desktop_shape=RECTANGULAR`, `desktop_included=true`
- VARIANT-scope: `desktop_width_in=48`, `desktop_depth_in=24` (measured and marketing label agree exactly this time), `desktop_finish=Laminated`
- Do NOT set: `motor_count`, `warranty_months` ("Limited", no duration), `product_weight_lb` (no "Item Weight" field present at all in this listing), `desktop_thickness_in` (not given), `memory_presets`, **`desktop_material`** (per the confirmed decision — "FSC-Certified Wood" doesn't map to the enum; do not guess a specific member), `frame_color` (ambiguous per above, leave unset)

## Product #6: Veken 55" (ASIN B0DWMJCQBX)

- Brand: slug `veken` (reuse the same Brand row created for Product #3 — do not create a second Veken Brand row)
- Product: name `Veken 55 Inch Large Electric Standing Desk, Gaming Table (Black)`, slug `veken-55in-standing-desk-black`, upc_code `850069632229`, description from confirmed data, is_sustainable `false`
- Variant: sku `veken-55in-standing-desk-black-default`, size `55x23.6`, color `Cyber Black`
- AffiliateLink: network `amazon`, price `149.98`, raw_url `https://www.amazon.com/dp/B0DWMJCQBX`, tracking_url `https://www.amazon.com/dp/B0DWMJCQBX?tag=deskholt-pending`
- PRODUCT-scope: `min_height_in=28.3`, `max_height_in=46.5` (already canonical `in`), `product_weight_lb=42.1`, `adjustment_type=ELECTRIC`, `frame_material=STEEL` (source: "Base: Carbon Steel" — use this, NOT the contradictory "Frame Material Type: Engineered Wood" on the same listing, which is almost certainly an Amazon template error since a wood top cannot itself be the frame material), `desktop_shape=RECTANGULAR`, `desktop_included=true`
- VARIANT-scope: `desktop_width_in=55.12`, `desktop_depth_in=23.64`, `desktop_material=ENGINEERED_WOOD` (from "Top Material Type"), `desktop_finish=Laminated`, `frame_color=Cyber Black`
- Do NOT set: `motor_count`, `warranty_months` (no manufacturer warranty section at all, only generic Amazon return-policy boilerplate), `desktop_thickness_in`, `memory_presets`, **`max_load_lb`** — this listing has no "Maximum Weight Recommendation" field at all; this is a required attribute with no source value, same as `motor_count`/`warranty_months` elsewhere — leave unset per §18, do not guess

## Product #7: OffiGo 63" L-Shape (ASIN B0FPFSYXNF)

- Brand: slug `offigo`, name `OffiGo`
- Product: name `OffiGo 63 Inch Reversible L Shaped Electric Standing Desk (Black)`, slug `offigo-63in-lshape-standing-desk-black`, upc_code: none given — leave null, **description must mention the lifetime warranty fact** (e.g. "...backed by a lifetime frame warranty.") per the confirmed decision — this is where the "Warranty Type: Lifetime" fact lives since `warranty_months` cannot represent it, is_sustainable `false`
- Variant: sku `offigo-63in-lshape-standing-desk-black-default`, size `63x47.2`, color `Black`
- AffiliateLink: network `amazon`, price `219.99`, raw_url `https://www.amazon.com/dp/B0FPFSYXNF`, tracking_url `https://www.amazon.com/dp/B0FPFSYXNF?tag=deskholt-pending`
- PRODUCT-scope: `min_height_in=27.9`, `max_height_in=46.1` (already canonical `in`), `max_load_lb=154`, `product_weight_lb=61.6`, `desktop_thickness_in=0.6`, `adjustment_type=ELECTRIC`, `frame_material=STEEL` (source: "Carbon Steel"), **`desktop_shape=L_SHAPED`** (first real use of this enum member — do not default it to `RECTANGULAR`), `desktop_included=true`
- VARIANT-scope: `desktop_width_in=63`, `desktop_depth_in=47.2` (L-shape combined footprint depth), `desktop_material=ENGINEERED_WOOD`, `desktop_finish=Laminated`, `frame_color=Black`
- Do NOT set: `motor_count`, **`warranty_months`** (per the confirmed decision — "Lifetime" is not a bounded duration; do not fabricate a sentinel number), `memory_presets`

## Global Constraints

- New script only (e.g. `scripts/create-products-3to7-standing-desks.ts`). Do not modify `prisma/seed.ts`, `prisma/seed-standing-desk-attributes.ts`, `scripts/create-product-ergear-egesd5b.ts`, `scripts/upgrade-product-shw-od92ak.ts`, or any P0-A/P0-B file.
- Do not touch, reference, or create anything for the 9 out-of-scope non-desk items listed above.
- Idempotent per-product: safe to re-run (upsert Brand by slug — note `veken` is shared across two products in this batch, upsert Product by slug, upsert Variant by matching product+sku, upsert ProductAttribute by `(product_id, attribute_definition_id, variant_id)`, upsert AffiliateLink by `(product_id, network)`). Re-running must not create duplicates for any of the 5 products.
- Each product's writes happen in its own transaction (per the "why one script" note above) — a validation failure on one product must not affect the others in the same script run.
- Must call the real `validateProductAttributeInput` for every attribute write and the real `convertLengthToCanonicalInches` for Product #4's cm→in conversion (from `src/lib/products/unitConversion.ts`, merged in PR #8/#10) — do not hardcode a pre-computed decimal.
- All 5 Products must be created with `status: 'DRAFT'` and `is_indexed: false` — this plan does not publish anything (unlike Product #2, these are brand-new rows, not an existing `ACTIVE` legacy product, so default to the same cautious Draft-first pattern as Product #1).
- This is a real, permanent data addition — verify only against an owned, disposable, loopback-only Postgres instance. Do not run the script against any real/shared database as part of this PR.

---

### Task 1: Script skeleton + Brand/Product identity for all 5 (tests first)

**Files:** `scripts/create-products-3to7-standing-desks.ts` (new), `tests/createProducts3to7StandingDesks.test.ts` (new)

- [ ] **Step 1:** Write failing tests (same self-owned disposable-Postgres integration harness pattern as `tests/createProductErgearEgesd5b.test.ts` and `tests/upgradeProductShwOd92ak.test.ts` — reuse that pattern, don't reinvent it) asserting: running the script creates exactly 4 new Brand rows (`veken`, `claiks`, `fezibo`, `offigo` — not 5, since Veken is shared) and exactly 5 new Product rows with the exact identity fields listed above, all `status: 'DRAFT'`, `is_indexed: false`, correctly linked `category_id`/`brand_id`.
- [ ] **Step 2:** Write a failing test asserting the script throws a clear error naming which product failed if the `standing-desks` Category is missing, without partially creating some of the 5 products and not others in a confusing half-state (define and test the exact behavior you choose — e.g. fail fast before touching any product, or process independently and report all failures at the end — pick one and be explicit in the script's own top-of-file comment).
- [ ] **Step 3:** Write a failing test asserting idempotency: running the script twice results in exactly 4 Brands and 5 Products, no duplicate-slug errors, and the shared `veken` Brand is not duplicated.
- [ ] **Step 4:** Implement to pass.

### Task 2: ProductVariant + ProductAttribute rows for all 5 (tests first)

**Files:** same script and test file

- [ ] **Step 1:** Write failing tests, one per product, asserting: exactly one Variant is created per product with the exact `size`/`color` listed above (including `color: null` for FEZIBO); every PRODUCT- and VARIANT-scope attribute listed for that product is persisted with the exact value (assert Product #4's `max_height_in` equals the real `convertLengthToCanonicalInches(119, 'cm')` output, not a hardcoded literal); every "do NOT set" key for that product has no `ProductAttribute` row at all; Product #7's `desktop_shape` is specifically `L_SHAPED`, not `RECTANGULAR`; Product #5's `is_sustainable` is `true` and it has no `desktop_material` row; Product #6 has no `max_load_lb` row.
- [ ] **Step 2:** Write a failing test asserting every write goes through the real `validateProductAttributeInput`.
- [ ] **Step 3:** Write a failing test for idempotency across all 5 products (re-running the whole script produces no duplicate Variants or ProductAttributes for any of them).
- [ ] **Step 4:** Implement to pass.

### Task 3: AffiliateLink for all 5 (tests first)

**Files:** same script and test file

- [ ] **Step 1:** Write failing tests: each of the 5 products gets exactly one `AffiliateLink` with `network: 'amazon'` and the exact price listed above (`89.99`/`109.99`/`112.99`/`149.98`/`219.99`), correct `raw_url`/`tracking_url` per product.
- [ ] **Step 2:** Write a failing idempotency test (re-running doesn't create a second link for any product).
- [ ] **Step 3:** Implement to pass. Run the full new test file plus the full existing suite: PASS, no regressions.

### Task 4: Verification and evidence

- [ ] **Step 1:** Run the script against a fresh disposable Postgres (owned, loopback, high port) that has already run `prisma migrate deploy` and `npx tsx prisma/seed-standing-desk-attributes.ts`. Confirm all 5 products persist exactly as specified.
- [ ] **Step 2:** Query the disposable DB and print all 5 Products with their Brand/Category relations, Variants, ProductAttributes, and AffiliateLinks — confirm every value matches this plan's per-product spec exactly, including the one computed `max_height_in` value and every deliberate omission.
- [ ] **Step 3:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 4:** Record evidence in `artifacts/create-products-3to7-standing-desks/evidence.md`: full persisted row dump for all 5 products from Step 2, test output, and explicit confirmation that the FSC/is_sustainable and Lifetime/description decisions from blueprint §70 were applied correctly.
- [ ] **Step 5:** Push the branch, open a PR against `main`. Do not merge locally. **Do not run the script against any real/shared database** — that remains a separate, explicit step the user approves after this PR is reviewed and merged, same as Products #1 and #2.

**After this lands:** Products #3–7 are ready to create for real once the user approves running the script, bringing the P2 dry run to 7/10 (or 7 of "~10" per §59's own approximate wording) standing desks with real, sourced, structured data.
