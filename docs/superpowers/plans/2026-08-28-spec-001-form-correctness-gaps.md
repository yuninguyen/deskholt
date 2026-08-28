# Spec 001 Form-Correctness Gaps (P1, Group A) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code, since `main` is currently clean after PR #3/#4/#5. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Close two concrete, already-verified gaps in the blueprint's P1 "form correctness" checklist (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §5 P1 scope list): **(A) VERIFIED requires a valid source**, and **(B) preserve unsaved values on validation failure**. Both live in `src/lib/products/specificationSaveAction.ts` and `src/components/admin/products/ProductSpecificationsForm.tsx`, which were just merged in PR #5 (Spec 001 T017–T021 convergence) — this plan is the next increment on top of that, not a redo of it.

This is explicitly **Group A** of a larger P1 audit: low-risk, narrowly-scoped fixes. It does **not** cover Group B (Brand/Category wiring to Product, explicit default variant, Available Options concept, AffiliateNetwork/Merchant/MerchantProduct/Offer modeling, Admin Sources/Offers/queue UI) — those are separate, larger architecture decisions requiring their own plan.

## Gap A: VERIFIED requires a valid source

**Current behavior (verified by reading the code, not assumed):** `src/lib/products/specificationSaveAction.ts:92-94` accepts any of `VERIFIED | LIKELY | UNVERIFIED` from the raw form field with no further check. Line 143 sets `verified_at` whenever `confidence === 'VERIFIED'`, regardless of whether `source_url`/`source_type` are present or valid. An admin can currently save a row as `VERIFIED` with both source fields empty.

**Required fix:** When the submitted (or resulting) confidence for a row is `VERIFIED`, the row must have a non-empty `sourceUrl` that parses as a valid absolute URL, and a `sourceType` that is one of the allowed enum values. If not, treat it as a validation error for that row (same error-collection path as the existing numeric/boolean/validator errors already in the function) — do not silently downgrade confidence and do not silently drop the source requirement.

## Gap B: Preserve unsaved values on validation failure

**Current behavior (verified by reading the code):** On any validation error, `specificationSaveAction.ts:112-117` redirects to `.../specifications?error=1&count=N&detail=<first-5-errors-joined>` with **no row data carried forward**. `ProductSpecificationsForm.tsx` (`SpecRowFields`) seeds every input's `defaultValue` purely from `existing` (the last-saved DB state, via `loadSpecificationData`). Because this app uses full Save→Redirect (blueprint §37, intentionally kept), the redirected page re-fetches from DB and the admin loses every value they typed in *every* row — not just the invalid one — including in unrelated Product-level and Variant sections.

**Required fix:** On validation failure, the admin must see the exact values they just submitted (across all rows, not just the failing one) when the page re-renders after redirect, without weakening the "single source of truth on redirect" principle for anything that DID save successfully.

**Design constraint — no client-side state store, no query-string blob:** Do not encode row data in the URL (row count is unbounded, URL length limits apply, and it would leak entered data into server logs/browser history). Use a short-lived, server-side draft: on validation failure, store the submitted raw row values keyed by a random opaque token, set that token in a cookie (or in the existing `error=1` query string, whichever is simpler given the current admin auth cookie pattern in `src/lib/admin/auth.ts`), and have the specifications page (`src/app/(admin)/admin/products/[id]/specifications/page.tsx`) look up and consume (read-once, then discard) that draft when present, merging it over `existing` as the form's default values. The draft must:
- expire quickly (a few minutes) and never survive a successful save;
- be scoped to the exact `productId` it was submitted for (do not leak one product's draft into another product's specifications page);
- hold no more than the current form's own field set — don't invent new fields.

Pick the simplest mechanism that satisfies this (in-memory Map keyed by token is acceptable for V1's single-instance Admin traffic — the blueprint's own P0-B section explicitly accepts simpler-than-durable solutions until a real operational need forces more); do not build a database table or Redis-backed draft store for this.

## Global Constraints

- Do not touch P0-A/P0-B code (`productAccessPolicy.ts`, `clickPersistence.ts`, `/go` route, sitemap, canonical URL logic).
- Do not modify `productAttributeValidator.ts`'s existing validation rules (category/scope/type checks) — this plan adds a *new*, separate confidence/source rule at the Server Action layer, not inside the shared validator, since the validator's job (per its existing tests) is attribute-shape validation, not confidence-workflow policy.
- Do not change the Save→Redirect architecture itself (blueprint §37) — both fixes work within it.
- Preserve every existing passing behavior: blank-row skip, clear-to-delete, source-without-value rejection, stale-ENUM preservation (T020), missing-active-Variant warning (T017). The full suite (229 tests as of `main`) must stay green plus whatever you add.
- No new dependencies (no Redis, no new Prisma model) for the draft-preservation mechanism.

---

### Task 1: Gap A — tests first

**Files:** `tests/productSpecificationsAction.test.ts`

- [x] **Step 1:** Add failing tests: (a) submitting `confidence=VERIFIED` with empty `sourceUrl` is rejected with zero writes; (b) submitting `VERIFIED` with a non-URL string in `sourceUrl` (e.g. `"not a url"`) is rejected; (c) submitting `VERIFIED` with empty/invalid `sourceType` is rejected; (d) submitting `VERIFIED` with a valid absolute URL and a valid `sourceType` succeeds and persists `verified_at`; (e) `LIKELY`/`UNVERIFIED` rows are unaffected by this rule even with empty source fields (regression guard — don't over-tighten).
- [x] **Step 2:** Run `npm test -- tests/productSpecificationsAction.test.ts`. Expected: new cases FAIL.

### Task 2: Gap A — implement

**Files:** `src/lib/products/specificationSaveAction.ts`

- [x] **Step 1:** Add the VERIFIED-requires-source check in the same per-row loop that already collects `errors` (before pushing to `parsedRows` as `kind: 'write'`). Push a clear error string (e.g. `${rowLabel}: VERIFIED requires a valid source URL and source type.`) and `continue`, matching the existing error-handling shape exactly — do not introduce a second error-collection mechanism.
- [x] **Step 2:** Run `npm test -- tests/productSpecificationsAction.test.ts`. Expected: PASS.
- [x] **Step 3:** Run the full suite to confirm no regression: `npm test`.

### Task 3: Gap B — tests first

**Files:** `tests/productSpecificationsAction.test.ts`, `tests/productSpecificationsForm.test.ts`, and whatever new module you introduce for the draft store (e.g. `tests/specificationDraftStore.test.ts`)

- [x] **Step 1:** Design and name the draft-store module (e.g. `src/lib/products/specificationDraftStore.ts`) exposing something like `saveDraft(productId, rawFormEntries): token` and `takeDraft(productId, token): rawFormEntries | null` (read-once semantics — a second `takeDraft` call with the same token returns `null`).
- [x] **Step 2:** Write failing tests for: token uniqueness, read-once consumption, TTL expiry, product-id scoping (a token minted for product A must not be servable for product B), and that a successful save never leaves a draft behind for that product.
- [x] **Step 3:** Write failing tests for the Server Action: on validation failure, a draft is saved and the redirect URL includes the token; on success, no draft is created and any prior draft for that product is cleared.
- [x] **Step 4:** Write failing tests for the specifications page/form: when a valid, unexpired draft token is present in `searchParams` for the current `productId`, each row's rendered default value comes from the draft over `existing` DB data; if the token is missing, expired, wrong-product, or already consumed, the form falls back to `existing` exactly as it does today (regression guard).
- [x] **Step 5:** Run the new/updated test files. Expected: FAIL.

### Task 4: Gap B — implement

**Files:** `src/lib/products/specificationDraftStore.ts` (new), `src/lib/products/specificationSaveAction.ts`, `src/app/(admin)/admin/products/[id]/specifications/page.tsx`, `src/components/admin/products/ProductSpecificationsForm.tsx`

- [x] **Step 1:** Implement the draft store per Task 3's design.
- [x] **Step 2:** Wire the Server Action: on any validation failure path (both Gap A's new check and every pre-existing error path), save the raw submitted row values as a draft and append the token to the existing `error=1&count=N&detail=...` redirect URL rather than replacing it.
- [x] **Step 3:** Wire the page: read the token from `searchParams`, call `takeDraft`, and pass the resulting draft (if any) down to `ProductSpecificationsForm` alongside `data`.
- [x] **Step 4:** Update `ProductSpecificationsForm`/`SpecRowFields` so each field's `defaultValue` prefers the draft's value for that `rowKey` (value, sourceUrl, sourceType, confidence) when present, falling back to `existing` exactly as before when absent — for both a row that already existed and a blank row the admin was filling in fresh.
- [x] **Step 5:** Run all four test files from Task 3. Expected: PASS.
- [x] **Step 6:** Run the full suite, lint, typecheck, build. Expected: all green, no regressions to any of the 229 pre-existing tests.

### Task 5: Verification and evidence

- [x] **Step 1:** Manually exercise the flow in dev: submit a form with one row `VERIFIED` + empty source → confirm redirect shows the error AND every other row's typed value (including in a different section) is still visible; fix the one bad row and resubmit → confirm it saves and the draft is gone (reload the page — values should now come from DB, not a stale draft).
- [x] **Step 2:** Record evidence in `artifacts/spec-001-form-correctness/evidence.md`: test output, manual verification transcript, and explicit confirmation that Gap A and Gap B are both closed per the blueprint's P1 checklist wording.
- [ ] **Step 3:** Push the branch, open a PR against `main` (same flow as PR #3/#4/#5: isolated worktree, own branch, CI green, `mergeable_state: clean`). Do not merge locally.

**After this lands:** Group A of the P1 audit is closed. Group B (Brand/Category relations, explicit default variant, Available Options, AffiliateNetwork/Merchant/MerchantProduct/Offer, Admin Sources/Offers/queue UI) remains and needs its own architecture-decision-first plan, similar in spirit to the P0-B plan's "Required architecture decision" step, before any implementation starts.
