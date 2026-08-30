# Minimal Admin "Create Product" UI

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Close the real gap identified in `docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §70 ("Follow-up decision" after the P2 dry-run stop) — there is currently no Admin UI for creating a Product's identity. All 7 P2 dry-run products were created via one-off scripts (`scripts/create-product-ergear-egesd5b.ts` and similar), not through the Admin UI, which is the one §59 exit criterion ("editor can enter data without developer intervention for normal cases") not yet demonstrated. This plan builds a minimal Create Product page and Server Action, scoped strictly to Product identity — nothing else.

## Explicitly out of scope (do not build in this plan)

- **AffiliateLink creation.** A new Product is created with zero merchant listings; adding one stays a separate, later step (either a future Admin UI increment or a script, per the still-deferred Merchant/Offer decision in §70).
- **ProductAttribute/ProductVariant creation in the same flow.** The existing `/admin/products/[id]/specifications` page already handles this — after creating a Product's identity, redirect there (Save→Redirect, §37) so the admin continues in the existing, proven flow rather than duplicating it.
- **Brand/Category creation UI.** Category must already exist (there is currently only `standing-desks`) — do not let this form create a new Category. Brand *may* be created inline (upsert by name) since Brand rows are lightweight and this is exactly the workflow the P2 scripts already used (e.g. creating `ergear`/`shw`/`veken` on the fly) — but do not build a separate "manage brands" UI.
- **Image upload.** `image_url` stays a plain text URL input — no file upload, no storage integration. This matches every product entered so far (all use either a real hosted image URL or the shared stock-photo placeholder).

## Design — follow the exact pattern of `productPublishingCommands.ts` / `productPublishingAction`

Read `src/lib/products/productPublishingCommands.ts` and `src/app/(admin)/admin/products/actions.ts` before starting — this plan's new code must mirror that pattern exactly (pure parse/execute functions with a `Store` interface for testability, a thin `'use server'` wrapper, dependency injection), not invent a new convention.

**New pure module: `src/lib/products/productCreationCommand.ts`**
- `parseCreateProductInput(formData: FormData): CreateProductInput` — extracts and trims: `name` (required), `slug` (required, must match the existing slug pattern used elsewhere — lowercase, digits, hyphens only; reject anything else with a clear parse error, do not auto-slugify), `categorySlug` (required), `brandName` (optional, trimmed empty → treated as absent), `description` (required — every real product entered so far has one), `imageUrl` (required — `Product.image_url` is `NOT NULL` in the schema; validate it's a syntactically valid absolute URL, matching the strictness already used elsewhere in this codebase, e.g. `URL.canParse` as used in `specificationSaveAction.ts`), `upcCode` (optional), `isSustainable` (checkbox, boolean).
- `ProductCreationStore` interface: `slugExists(slug): Promise<boolean>`, `findCategoryBySlug(slug): Promise<{ id: string } | null>`, `upsertBrand(name: string): Promise<{ id: string }>`, `createProduct(data): Promise<{ id: string }>`.
- `executeCreateProduct(store, input): Promise<CreateProductResult>` where `CreateProductResult = { ok: true; productId: string } | { ok: false; reason: 'category-missing' | 'slug-taken' | 'invalid-input' }` — checks category exists (fail `category-missing` if not — do not create one), checks slug isn't already taken (fail `slug-taken` — do not silently suffix or overwrite), upserts the Brand only if `brandName` was given, then creates the Product with `status: 'DRAFT'`, `is_indexed: false`, `category: categorySlug` (the legacy string field, kept populated per the dual-write pattern already established for every product created this session) and `category_id` set to the real Category's id.
- `createPrismaProductCreationStore(prisma): ProductCreationStore` — the real implementation.

**Server Action wiring:** add `createProductAction` to `src/app/(admin)/admin/products/actions.ts` (same file as `productPublishingAction`), following the exact same `requireAdminSession()` → parse → execute → `revalidatePath('/admin/products')` → `redirect(...)` shape. On success, redirect to `/admin/products/${productId}/specifications?created=1` (continues straight into the existing specifications flow — this is the point of the whole plan). On failure, redirect back to `/admin/products/new?error=<reason>` preserving the reason the same way `productPublishingAction` does for its errors.

**New page: `src/app/(admin)/admin/products/new/page.tsx`**
- Requires admin auth (same `requireAdminSession`-equivalent check as every other admin page — verify how `admin/products/page.tsx` and `admin/products/[id]/specifications/page.tsx` each currently gate access and match whichever pattern they use).
- Fetches the list of existing Categories (currently just `standing-desks`) for a `<select>` — do not hardcode `'standing-desks'` as the admin page currently does for its product list; that's a pre-existing narrowing you are not asked to fix here, just don't copy it into new code.
- A plain HTML form (`<form action={createProductAction}>`) with inputs for: name, slug, category (select), brand name (optional text), description (textarea), image URL, UPC/SKU (optional), is_sustainable (checkbox). Match the existing dark-theme admin styling already used in `ProductSpecificationsForm.tsx`/`admin/products/page.tsx` (same Tailwind classes/conventions) — do not introduce a new visual style.
- Renders the `?error=` query param as an inline error message, same convention as `admin/products/page.tsx`'s existing error banner.

**Link from the list page:** add a "+ New Product" link/button on `src/app/(admin)/admin/products/page.tsx` pointing to `/admin/products/new`.

## Global Constraints

- Do not touch `productPublishingCommands.ts`, the specifications save action/form, any P0-A/P0-B file, or any of the product-creation scripts from Products #1–7.
- Do not add AffiliateLink, ProductAttribute, or ProductVariant creation to this flow (see "out of scope" above).
- Full existing test suite must stay green plus whatever this plan adds.
- No new dependencies.

---

### Task 1: Pure command module (tests first)

**Files:** `src/lib/products/productCreationCommand.ts` (new), `tests/productCreationCommand.test.ts` (new)

- [ ] **Step 1:** Write failing tests for `parseCreateProductInput`: valid full input parses correctly; missing `name`/`slug`/`categorySlug`/`description`/`imageUrl` each throws a clear error; a `slug` containing spaces/uppercase/special characters is rejected (do not auto-normalize it); an invalid `imageUrl` (not a parseable absolute URL) is rejected; empty `brandName`/`upcCode` are treated as absent (undefined/null), not empty strings; `isSustainable` checkbox absence parses as `false`, presence as `true` (match the HTML checkbox convention — a checked box sends its value, an unchecked one sends nothing).
- [ ] **Step 2:** Write failing tests for `executeCreateProduct` against a fake in-memory `ProductCreationStore`: succeeds and returns the new product id when category exists and slug is free; returns `{ ok: false, reason: 'category-missing' }` without calling `createProduct` when the category doesn't exist; returns `{ ok: false, reason: 'slug-taken' }` without calling `createProduct` when the slug already exists; calls `upsertBrand` only when `brandName` was provided, never when absent; the created Product's `category` (string) and `category_id` are both set to match the found category.
- [ ] **Step 3:** Implement both functions to pass. Run tests: PASS.

### Task 2: Server Action wiring (tests first)

**Files:** `tests/adminProductsActions.test.ts` (or wherever `productPublishingAction`'s existing tests live — extend that file, matching its dependency-injection test pattern), `src/app/(admin)/admin/products/actions.ts`

- [ ] **Step 1:** Write failing tests for `createProductAction` (using the same dependency-injected `createProductPublishingAction`-style pattern, e.g. `createCreateProductAction(dependencies)`): unauthenticated request is rejected the same way `productPublishingAction` rejects one; successful creation redirects to `/admin/products/${productId}/specifications?created=1`; each failure reason redirects to `/admin/products/new?error=<reason>`; `revalidatePath('/admin/products')` is called on success.
- [ ] **Step 2:** Implement to pass.

### Task 3: Admin page + list-page link (tests first, where the existing test infrastructure supports it — otherwise verify manually and say so in evidence)

**Files:** `src/app/(admin)/admin/products/new/page.tsx` (new), `src/app/(admin)/admin/products/page.tsx`

- [ ] **Step 1:** If existing admin pages have any test coverage (check for a test file covering `admin/products/page.tsx`'s rendering) follow that pattern for the new page; otherwise, skip to Step 2 and rely on manual verification in Task 4 — do not invent a testing approach the rest of the admin UI doesn't already use.
- [ ] **Step 2:** Implement the new page (form) and add the "+ New Product" link to the list page.
- [ ] **Step 3:** Run the full suite, lint, typecheck: all green.

### Task 4: Verification and evidence

- [ ] **Step 1:** Manually exercise the flow in dev against a disposable database: log in as admin, go to `/admin/products/new`, create a real or clearly-labeled-test product with a category that exists, confirm redirect to its specifications page with `?created=1`, confirm the Product row exists with `status: DRAFT`, `is_indexed: false`, correct `category_id`/`brand_id`. Then attempt a duplicate slug and confirm the `slug-taken` error path works.
- [ ] **Step 2:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 3:** Record evidence in `artifacts/admin-create-product-ui/evidence.md`: test output, manual verification transcript (screenshots not required, but describe what was seen at each step), and explicit confirmation this closes the "editor can enter data without developer intervention" gap for Product identity (attributes/variants/offers still require separate steps, as scoped above).
- [ ] **Step 4:** Push the branch, open a PR against `main`. Do not merge locally.

**After this lands:** creating a new Product's identity no longer requires a one-off script — an admin can do it through the UI, then continue into the existing specifications flow to add structured attributes. AffiliateLink creation remains the next gap if/when Merchant/Offer work is picked back up (§70).
