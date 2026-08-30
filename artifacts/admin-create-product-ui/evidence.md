# Admin Create Product UI — Verification Evidence

## Scope implemented

- Product identity only: name, slug, existing Category, optional Brand, description, image URL, optional UPC/SKU, and sustainability flag.
- Successful creation redirects to `/admin/products/<id>/specifications?created=1`.
- The new Product is written as `DRAFT`, `is_indexed: false`, with both legacy `category` and relational `category_id` populated.
- No AffiliateLink, ProductAttribute, ProductVariant, Category-creation UI, upload integration, or product-creation scripts were changed.

## Automated checks

| Command | Result | Evidence |
| --- | --- | --- |
| `node --experimental-strip-types tests/productCreationCommand.test.ts` | Pass | 12 tests passed, 0 failed. Covers parsing, required fields, slug and URL validation, optional fields, checkbox semantics, missing Category, duplicate slug, Draft/category dual-write, no Brand upsert when absent, unique-conflict mapping, and safe Brand persistence. Node emitted its existing `MODULE_TYPELESS_PACKAGE_JSON` warning because the project does not declare `"type": "module"`; it did not affect test execution. |
| `node C:\laragon\www\deskholt\node_modules\typescript\bin\tsc --noEmit` | Pass | Exit 0 with no output. This direct invocation was required because `npx` is blocked by the sandbox PowerShell wrapper. |
| `node C:\laragon\www\deskholt\node_modules\eslint\bin\eslint.js . --max-warnings=0` | Pass | Exit 0 with no output. |
| `npm run lint` | Pass with harness wrapper noise | ESLint printed no violations. `npm.ps1` then emitted an unrelated `$LASTEXITCODE` strict-mode warning; the harness did not report a non-zero exit. The direct ESLint invocation above independently exited 0. |
| `npm test` | Pass (external verification) | Reviewer ran the suite against a disposable PostgreSQL 18 database: 310 passed, 0 failed, 8 opt-in skipped, including all 12 `productCreationCommand` tests. This sandbox's earlier `spawn EPERM` result occurred before test bodies ran and was environmental. |
| `npm run build` | Pass (external verification) | Reviewer ran `npm install` in this worktree, then `npm run build`; build passed and emitted the `/admin/products/new` route. |

## TDD record

1. `tests/productCreationCommand.test.ts` was written before `productCreationCommand.ts`; the initial run failed because the requested APIs were absent.
2. The command module was implemented; the focused command test passed.
3. Action and page tests were written before their implementations. The project-standard `tsx` test runner cannot execute in this sandbox because `esbuild` and Node test workers require child processes. TypeScript and ESLint validate their source and imports.
4. Concurrency and Brand-persistence regression tests were added after review, run red against the prior implementation, then passed after the minimal fixes.

## Manual verification

External reviewer verification used the real `executeCreateProduct` function with the Prisma store against a disposable PostgreSQL 18 database:

1. Created `Manual Verify Desk` successfully.
2. Confirmed `status = DRAFT`, `is_indexed = false`, plus matching `category_id` and `brand_id`.
3. Submitted the same slug again and received `{ ok: false, reason: 'slug-taken' }`.

The Server Action itself was not submitted over HTTP because it cannot be exercised through a plain curl request, but its dependency-injected action tests cover its redirect and revalidation contract.

## Access and review notes

- `/admin/products/new` uses the established admin route gate: `src/proxy.ts` matches `/admin/:path*` and redirects requests without a valid session before the page fetches Categories or renders. The server action independently calls `requireAdminSession()` before parsing or mutation.
- Code review prompted two integrity hardenings: database unique conflicts from concurrent create attempts now map to `slug-taken`, and Brand lookup is exact-name first with a lossless non-empty internal slug for new names, so a formatted collision cannot rename an existing Brand.

## Outcome

This closes the Product-identity portion of the "editor can enter data without developer intervention" gap: an admin can create a Product via the UI and continue into the already-existing specifications flow. Attributes, variants, and merchant offers remain deliberately separate steps. Full-suite, build, and disposable-database verification were completed externally because this sandbox cannot spawn the required child processes.
