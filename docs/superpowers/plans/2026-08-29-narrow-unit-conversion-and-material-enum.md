# Narrow In↔Cm Unit Conversion + desktop_material Enum Fix

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close two real, data-verified BLOCKER ontology issues found while dry-running the §58 P2 process against a real product (ErGear EGESD5B, ASIN B0B41YH9B6) — see `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 (P2 Ontology Issue Log) and §17 (Unit Normalization) for full context. Both fixes are narrowly scoped to the exact real-world evidence found — do not generalize beyond it.

## Fix A: desktop_material ENUM missing "Engineered Wood"

**Current state:** `prisma/seed-standing-desk-attributes.ts` defines `desktop_material` as `ENUM` with `allowedValues: ['MDF', 'BAMBOO', 'SOLID_WOOD', 'LAMINATE']`. A real product's source listing states `Top Material Type: Engineered Wood`, which matches none of these.

**Fix:** Add `'ENGINEERED_WOOD'` to the `allowedValues` array for `desktop_material` in `prisma/seed-standing-desk-attributes.ts`. This is a data change to the seed script (the seed's upsert already updates `allowed_values` on re-run — see the `update:` block in `main()`), not a schema/migration change. Do not rename or remove any existing allowed value.

## Fix B: Narrow in↔cm unit conversion

**Current state:** `AttributeDefinition.unit` (e.g. `'in'`) is shown in `ProductSpecificationsForm.tsx:32` purely as a static label next to the value input — there is no conversion logic anywhere in `src/`. A real product's source listing gave `Minimum Height: 28.35 inches` and `Maximum Height: 118 centimeters` on the *same* source table — the canonical unit for this schema is `in` (§17), so an editor entering the 118cm figure today would have to hand-convert it, which §17 explicitly says not to require.

**Required fix — scoped narrowly to in↔cm only, nothing else:**

1. A pure conversion function, e.g. `convertLengthToCanonicalInches(value: number, sourceUnit: 'in' | 'cm'): number`, that returns `value` unchanged when `sourceUnit === 'in'` and divides by `2.54` when `sourceUnit === 'cm'`. Do not build a general multi-unit-family conversion engine — only this one pair, for attributes whose canonical `unit` is `'in'`.
2. In `ProductSpecificationsForm.tsx`, for rows where `row.unit === 'in'` only, render an additional small unit selector (`in` / `cm`, defaulting to `in`) alongside the existing value input, submitted as a new field (e.g. `sourceUnit__${rowKey}`). Rows whose unit is not `'in'` (lb, in/s, dB, months, minutes, or non-numeric types) are unaffected — no selector, no behavior change.
3. In `specificationSaveAction.ts`, before the existing numeric parsing/validation for a `DECIMAL`/`INTEGER` row whose `unit === 'in'`, read the submitted `sourceUnit__${rowKey}` (default to `'in'` if absent, preserving today's behavior exactly for any caller that doesn't send it — e.g. existing tests), convert the raw value to canonical inches via the Fix B function, and use the converted value for everything downstream (validation, storage, draft preservation on failure). Store only the canonical (inches) value — do not add a new column to persist the original source unit/value (matches §17: "database lưu canonical unit").
4. Draft preservation (Spec 001's existing mechanism, `specificationDraftStore.ts`) must preserve the submitted `sourceUnit__${rowKey}` value too, so that if the row fails validation, the admin sees their original unit selection back, not silently reset to `in`.

## Global Constraints

- Do not touch P0-A/P0-B code, Brand/Category relation code (PR #7), or any file outside `specificationSaveAction.ts`, `specificationDraftStore.ts`, `ProductSpecificationsForm.tsx`, the new conversion module, and `prisma/seed-standing-desk-attributes.ts`.
- No new dependencies. No schema/migration changes — Fix A is a data-only change to the seed script; Fix B needs no new Prisma column.
- Existing behavior must be unchanged for every row whose canonical `unit` is not `'in'`, and for any `'in'`-unit row where `sourceUnit` is omitted or already `'in'` (regression guard — the full existing test suite must stay green with zero modifications required to existing passing test *expectations*, only additions).
- Confidence/source-URL/VERIFIED rules from Group A (PR #6) are untouched by this plan — do not modify that logic.

---

### Task 1: Fix A — enum value (tests first)

**Files:** `prisma/seed-standing-desk-attributes.ts`, wherever `desktop_material` enum validation is covered (`tests/productAttributeValidator.test.ts` or similar — find via grep for `desktop_material` or `MDF`)

- [ ] **Step 1:** Add a failing test confirming `ENGINEERED_WOOD` is accepted as a valid `desktop_material` value by the shared validator (using the seed's allowed-values list, not a hardcoded duplicate list).
- [ ] **Step 2:** Add `'ENGINEERED_WOOD'` to the `allowedValues` array for `desktop_material` in `prisma/seed-standing-desk-attributes.ts`.
- [ ] **Step 3:** Run the test. Expected: PASS. Run the full suite: no regressions.

### Task 2: Fix B — conversion module (tests first)

**Files:** `src/lib/products/unitConversion.ts` (new), `tests/unitConversion.test.ts` (new)

- [ ] **Step 1:** Write failing tests for `convertLengthToCanonicalInches`: `('in')` returns the value unchanged (including edge values like `0`, negative — decide and test whatever the existing numeric validation already allows/rejects downstream, don't invent new range rules here); `('cm')` divides by 2.54 (e.g. `118 cm` → `~46.4567 in`, assert with a reasonable floating-point tolerance); an unsupported `sourceUnit` value throws or is rejected in a way the caller can turn into the existing error-collection path (match whatever `specificationSaveAction.ts` already does for other malformed input — look at how it handles invalid `sourceType`/`confidence` today for the pattern to follow).
- [ ] **Step 2:** Implement the function to pass. Run tests: PASS.

### Task 3: Fix B — wire into save action and draft store (tests first)

**Files:** `tests/productSpecificationsAction.test.ts`, `src/lib/products/specificationSaveAction.ts`, `src/lib/products/specificationDraftStore.ts`

- [ ] **Step 1:** Add failing tests: (a) submitting a `unit === 'in'` row with `sourceUnit__<rowKey> = 'cm'` and a raw value converts correctly before validation/storage (assert the persisted `value_number` is the converted inches value, not the raw cm figure); (b) submitting the same row with `sourceUnit__<rowKey>` omitted behaves exactly as today (raw value stored as-is, still treated as inches) — regression guard; (c) submitting `sourceUnit__<rowKey> = 'in'` explicitly behaves identically to omitting it; (d) a row whose `unit` is not `'in'` (e.g. a `lb` row) ignores any `sourceUnit__<rowKey>` field entirely if present — regression guard against accidental scope creep; (e) on validation failure, the draft preserves the submitted `sourceUnit__<rowKey>` value so it round-trips back to the form.
- [ ] **Step 2:** Wire `specificationSaveAction.ts` to call the Task 2 conversion function per Fix B's Step 3 description above. Update `specificationDraftStore.ts`'s `SpecificationDraftRows` shape to include the source unit field per Fix B's Step 4.
- [ ] **Step 3:** Run the new tests. Expected: PASS. Run the full suite: no regressions.

### Task 4: Fix B — form UI (tests first)

**Files:** `tests/productSpecificationsForm.test.ts` (or wherever `ProductSpecificationsForm`/`SpecRowFields` is covered), `src/components/admin/products/ProductSpecificationsForm.tsx`

- [ ] **Step 1:** Add failing tests: a row with `unit === 'in'` renders a source-unit selector defaulting to `in`; a row with any other unit (or no unit) does not render the selector; when a draft (Task 3's preserved value) specifies `sourceUnit: 'cm'`, the selector's default reflects that instead of `in`.
- [ ] **Step 2:** Implement the selector per Fix B's Step 2 description above.
- [ ] **Step 3:** Run the new tests. Expected: PASS. Run the full suite, lint, typecheck, build. Expected: all green.

### Task 5: Verification and evidence

- [ ] **Step 1:** Manually exercise in dev: create/use a `min_height_in` or `max_height_in` row, enter `118` with source unit `cm`, save, and confirm the stored/displayed value is `~46.46` (inches) — matching the real ErGear ontology finding that motivated this plan. Then confirm a plain `in`-unit entry with no unit change still behaves exactly as before.
- [ ] **Step 2:** Record evidence in `artifacts/unit-conversion-material-enum/evidence.md`: test output, manual verification transcript (the 118cm→~46.46in conversion specifically), and confirmation that both blueprint §70 BLOCKER items are closed.
- [ ] **Step 3:** Push the branch, open a PR against `main` (same flow as prior PRs: isolated worktree, own branch, CI green, `mergeable_state: clean`). Do not merge locally.

**After this lands:** Both real BLOCKER ontology issues from the ErGear P2 dry run are closed. The NON-BLOCKER items (motor_count and warranty_months often missing from Amazon's standard spec table) remain logged in blueprint §70 for now — no code change was requested for those; they are editorial/data-sourcing gaps, not schema or validation gaps.
