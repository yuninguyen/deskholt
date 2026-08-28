# Spec 001 Convergence Progress

## T017 — Missing active Variant warning

Status: COMPLETE

- Impact analysis: `ProductSpecificationsForm` and `SpecRowFields` upstream risk LOW; no affected GitNexus process reported.
- RED reproduced: Product with only inactive Variants rendered neither Variant rows nor a warning.
- Fix: warning now keys off `activeVariants.length === 0`; copy distinguishes no Variants from inactive-only Variants.
- Focused tests: 3/3 PASS.
- Focused ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Diff check/review: PASS; presentation-only change, no persistence or row-enumeration semantics changed.
- Review findings after fix: none.

## T018 — Shared ProductAttribute validator tests

Status: COMPLETE

- GitNexus limitation: symbol-name lookup resolved the archived/reference validator rather than the production path; exact production symbol was not indexed. Source inspection confirms the Specifications Server Action as the production caller.
- Added 9 focused tests covering unknown definitions, category-schema mismatch, PRODUCT/VARIANT/DERIVED scope, missing/cross-Product Variants, exactly one value column, DECIMAL/INTEGER/BOOLEAN/STRING semantics, and ENUM allowlists.
- Focused tests: 9/9 PASS against the existing production validator; no production change was required.
- Focused ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Scope review: only the new test file changed for T018.
- Review findings: none; required FR-008 and US3 validator cases are directly covered.

## T019 — Specifications Server Action behavioral tests

Status: COMPLETE

- Impact: `saveSpecificationsAction` LOW. Shared `loadSpecificationData` is HIGH-impact across Admin action/page and public Product detail, so it was deliberately left unchanged.
- RED reproduced: no testable action factory existed; all six behavioral tests failed before implementation.
- Added a framework-neutral `specificationSaveAction` dependency boundary and retained a minimal async `'use server'` production wrapper.
- Added 6 tests proving source-without-value rejection before transaction, blank skip, clear-to-delete, update/create semantics, one shared VERIFIED timestamp across an update and create with one `now()` call, LIKELY null timestamp, redirect-after-success, and zero writes after validating an earlier valid row plus a later invalid row with row-specific outcomes.
- Focused Spec 001 regression: 24/24 PASS.
- Focused ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Next production build: PASS, including `/admin/products/[id]/specifications` Server Action compilation.
- Review finding fixed before completion: synchronous factory export was moved out of the `'use server'` module to avoid invalid Next.js Server Action exports.
- Final scope review/diff check: PASS.

## T020 — Stale ENUM preservation and warning

Status: COMPLETE

- Impact analysis: `SpecRowFields` and `ProductSpecificationsForm` LOW.
- RED reproduced: stored ENUM `PNEUMATIC` disappeared when `allowedValues` contained only `ELECTRIC` and `MANUAL_CRANK`.
- Fix: render the stale stored value as the selected option, mark the select `aria-invalid`, link accessible help text with `aria-describedby`, and show a visible `role=alert` warning requiring a new allowed value before save.
- Focused form tests: 4/4 PASS.
- Focused Spec 001 regression: 25/25 PASS.
- Focused ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Review: invalid legacy value remains visible but cannot be persisted again because the existing shared validator rejects it; no silent data loss or validation bypass.
- Review findings after fix: none.

## T021 — Disposable seeded acceptance and preservation

Status: COMPLETE

- Target: owned loopback PostgreSQL 18 cluster on random high port; explicit acceptance opt-in required. No ambient, Neon, Vercel, or production datasource accepted.
- Clean migrations: baseline + P0-A3 PASS.
- Seed: 20 Products, 20 AffiliateLinks, 35 AttributeDefinitions, 35 CategoryAttributes, 5 active Standing Desk Variants.
- Three-Product completeness spot-check: each began at 0/9 required rows.
- Controlled target Product: save moved completeness 0/9 → 9/9; all 9 required rows persisted as VERIFIED with non-null verified timestamps.
- Clear-to-delete acceptance: one required row removed; completeness moved 9/9 → 8/9.
- Save redirects: 2/2 expected Specifications success redirects.
- Protected preservation before/after: Product 20, AffiliateLink 20, Click 0, Conversion 0; exact protected snapshot hash remained `d9f4fce33a4fa1904a36985a3c7a63aeaa54a406928d350346fc1cfd37c30f2a`.
- Evidence: `artifacts/spec-001/t021-disposable-acceptance.json`.
- Verifier ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Safety review: explicit loopback/high-port/opt-in gate; disposable cluster stopped and deleted after evidence capture.
- Review findings after fix: none.

## Final convergence and regression

Status: PASS

- Rechecked the five convergence findings F1–F5 against current code, tests, and evidence: all are satisfied; no additional convergence task was appended.
- Full ESLint: PASS, zero warnings.
- Standalone TypeScript no-emit: PASS.
- Full Node suite: 190/190 PASS.
- Next production build: PASS; 13 static pages generated and all dynamic routes compiled.
- Final `git diff --check`: PASS.
- GitNexus CLI has no `detect-changes` command in the installed version; impact checks were run before each existing-symbol edit and this limitation remains for any future commit gate.
- External reviewer dispatch was attempted twice but the subagent runtime failed before producing a review; task-level self-review and full verification evidence remain recorded above.
- Remaining non-blocking warning: Next.js deprecates the `middleware` filename in favor of `proxy`; outside Spec 001 convergence scope.
