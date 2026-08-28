# Group B-1: Wire Brand/Category Relations to Product

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close the "Brand / Category relations" gap in the blueprint's P1 scope list (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §5). This is **Group B-1**: the first, lowest-risk slice of the larger P1 Group B audit. It is purely a data-model + backend read-path correctness fix — there is currently no Admin UI for creating or editing a Product's category/brand (Products only come from `prisma/seed.ts`), so this plan touches **no user-facing Admin screen**.

## Current state (verified by reading the code, not assumed)

- `prisma/schema.prisma` already has `Category` (slug, name, description, is_active) and `Brand` (slug, name, website) models — but `Product` has **no relation to either**. `Product.category` (line 21) is a plain `String`.
- `Brand` is **completely unused**: zero references anywhere in `src/` or `prisma/seed.ts`. It is orphaned schema.
- `Category` **is** read today, but only via an implicit string join, duplicated in two places:
  - `src/lib/products/productAttributeValidator.ts:55-58`: `prisma.category.findUnique({ where: { slug: product.category } })`
  - `src/lib/products/specificationRows.ts:53-54`: the same pattern.

  Both do a **second round-trip query** to resolve the category by slug instead of using a real Prisma relation/`include`. This is the "legacy dual-read" pattern the blueprint's P1 scope list explicitly names — it works, but it's not a real relation and can silently drift (e.g. a `Product.category` value with no matching `Category` row fails validation with a message rather than a schema-enforced link).

## What this plan does

1. Add a nullable `category_id` FK + relation from `Product` to `Category`, and a nullable `brand_id` FK + relation from `Product` to `Brand`. **Nullable and additive** — no destructive migration, no forced backfill-or-fail.
2. Backfill `category_id` for all existing Products by matching `Product.category` (string) to `Category.slug`, in a one-off script — not a blocking migration step, so a product whose string category has no matching `Category` row is left with `category_id = null` and is reported, not silently dropped or errored.
3. Update the two existing read-sites (`productAttributeValidator.ts`, `specificationRows.ts`) to use the relation (`include: { category_ref: true }` or equivalent) instead of a second `findUnique` by slug, when `category_id` is set — falling back to the current slug-lookup behavior when it isn't (dual-read, exactly as the blueprint's P1 wording allows).
4. Leave `Product.category` (string) field **untouched** — do not rename, remove, or stop writing it. Cutting over fully to the relation and retiring the string field is a *future* follow-up once every read-site is confirmed migrated and there's Admin UI to write it, not part of this plan.

## Explicitly out of scope (do not attempt in this plan)

- **Brand data population.** No real brand data exists yet; this plan wires the relation but leaves `brand_id = null` for all products. Assigning real brands is a content task, not a schema task.
- **Admin UI for creating/editing a Product's category or brand.** No such UI exists today (Products are seed-only) — do not build one as a side effect.
- **Explicit default variant, Available Options, AffiliateNetwork/Merchant/MerchantProduct/Offer modeling, Admin Sources/Offers/queue UI.** These are separate Group B items needing their own plans (Offer/Merchant modeling in particular needs an architecture-decision-first plan like P0-B's, since it touches public pricing display and P0-B's click/redirect path).
- **Making `category_id` `NOT NULL`** or removing the string `category` field. That is a future cutover step once every write-path also writes the relation, which requires Admin UI that doesn't exist yet.

## Global Constraints

- Do not touch P0-A/P0-B code (`productAccessPolicy.ts`, `clickPersistence.ts`, `/go` route, sitemap, canonical URL/offer logic) or Spec 001's `specificationSaveAction.ts`/`specificationDraftStore.ts`/form-correctness code merged in PR #5/#6.
- Migration must be purely additive (new nullable columns + indexes only). Run it against a disposable database first, per the same discipline as P0-A3/P0-B (never against a populated/production datasource).
- The backfill script must be idempotent (safe to re-run) and must report, not silently swallow, any `Product.category` value with no matching `Category.slug`.
- Full test suite (249 as of `main` after PR #6) must stay green plus whatever you add.

---

### Task 1: Schema migration (additive, nullable)

**Files:** `prisma/schema.prisma`, new migration under `prisma/migrations/`

- [x] **Step 1:** Add `brand_id String?` and a `brand Brand? @relation(fields: [brand_id], references: [id])` to `Product`; add the inverse `products Product[]` on `Brand`. Add `category_id String?` and `category_ref Category? @relation(fields: [category_id], references: [id])` to `Product` (name it distinctly from the existing `category` string field — do not reuse the name `category` for the relation); add the inverse `products Product[]` on `Category`. Index both new FK columns.
- [x] **Step 2:** Generate the migration (`prisma migrate dev` against a disposable database) and verify it contains only additive `ALTER TABLE ... ADD COLUMN` + index statements, no data-destructive SQL.
- [x] **Step 3:** Run the migration against a fresh disposable database (same pattern as prior plans: owned, loopback, high port, explicit URL, deleted after verification) and confirm it applies cleanly on top of the existing migration chain.

### Task 2: Backfill script — tests first

**Files:** `scripts/backfill-product-category.ts` (new), `tests/backfillProductCategory.test.ts` (new)

- [x] **Step 1:** Write failing tests for a pure function (e.g. `resolveCategoryBackfill(products, categories)`) that, given Products and Categories, returns which Products should get which `category_id`, and which Products have no match (report list) — keep the matching logic testable without a real database.
- [x] **Step 2:** Write failing tests confirming the script is idempotent: running the resolution twice against the same data produces the same result and does not overwrite an already-set `category_id` with a different value unless the underlying `category` string changed.
- [x] **Step 3:** Implement the pure resolver to pass, then a thin script wrapper that reads real Products/Categories via Prisma, applies the resolution, and prints a summary (matched count, unmatched `Product.category` values with product ids/slugs).
- [x] **Step 4:** Run the script against a disposable seeded database (not populated/production) and confirm every seeded standing-desk Product's `category_id` now points at the correct `Category` row.

### Task 3: Update read-sites to use the relation — tests first

**Files:** `tests/productAttributeValidator.test.ts`, `tests/productSpecificationsAction.test.ts` (or wherever `specificationRows.ts` is covered), `src/lib/products/productAttributeValidator.ts`, `src/lib/products/specificationRows.ts`

- [x] **Step 1:** Add failing tests: when a Product has `category_id` set, the validator/row-loader resolves the category via the relation (single query, `include`) and produces identical validation results to today; when `category_id` is `null` (unbackfilled/edge case), the existing slug-lookup fallback still works exactly as it does on `main` today.
- [x] **Step 2:** Update both files to `include`/`select` the `category_ref` relation on the initial Product query, use it when present, and fall back to the current `prisma.category.findUnique({ where: { slug: product.category } })` call only when `category_id` is null. Do not change any error message wording or validation rule semantics — this is a data-access change, not a behavior change.
- [x] **Step 3:** Run the updated test files. Expected: PASS. Run the full suite (`npm test`) to confirm zero regressions against the 249-test baseline.

### Task 4: Verification and evidence

- [x] **Step 1:** Run `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build`. All green.
- [x] **Step 2:** Run the full flow once more end-to-end against a fresh disposable database: apply migrations → seed → run backfill script → confirm every seeded Product now has `category_id` set and the two updated read-sites still validate correctly for an existing Standing Desk product's specifications save.
- [x] **Step 3:** Record evidence in `artifacts/group-b1-brand-category/evidence.md`: migration SQL reviewed, backfill script output (matched/unmatched counts), before/after query-count note for the two read-sites (confirming the extra round-trip is gone when `category_id` is set), and full test/lint/typecheck/build results.
- [ ] **Step 4:** Push the branch, open a PR against `main` (same flow as PR #3/#4/#5/#6: isolated worktree, own branch, CI green, `mergeable_state: clean`). Do not merge locally.

**After this lands:** Brand/Category relations exist and are actually used by the two read-sites that need them, with zero UI or behavior change. The next Group B item — AffiliateNetwork/Merchant/MerchantProduct/current Offer modeling — is materially larger (touches public pricing display and P0-B's click/redirect path) and needs its own architecture-decision-first plan before any implementation starts, same as P0-B did. Default variant and Available Options remain deferred per the blueprint's own guidance (§13: "Không build generic option engine lớn trước khi pattern được xác nhận qua nhiều product") until real multi-variant product data exists during the P2 ontology stage.
