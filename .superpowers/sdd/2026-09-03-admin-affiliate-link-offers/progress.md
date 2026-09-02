# Admin AffiliateLink Offers SDD ledger

## Approved design and plan
- User approved the architecture: pure command layer, protected dependency-injected Server Actions, Admin-only shadcn/token/i18n UI, explicit linkId+productId cross-product guard, product offers link/count, and public revalidation.
- Execution plan: `docs/superpowers/plans/2026-09-03-admin-affiliate-link-offers-execution.md`.
- Global constraints: no Prisma/schema/dependency/public visual changes; no legacy Admin UI; `tracking_url` stays server-only placeholder.

## Task 1 — AffiliateLink command layer
- Implemented `src/lib/products/affiliateLinkCommand.ts` and `tests/affiliateLinkCommand.test.ts` only; no Prisma schema, action, UI, i18n, or public-code changes.
- TDD RED: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkCommand.test.ts` failed as expected with `Cannot find module '../src/lib/products/affiliateLinkCommand.ts'` before implementation.
- TDD GREEN: the same focused command test command passed 11/11 tests after implementation. Coverage includes fixed networks, finite positive prices, parseable raw URLs, optional positive-integer priority/default `1`, server-derived placeholder tracking URLs, typed create/update results, missing IDs, product-bound cross-product/missing update rejection, and Prisma lookup scoping by both link and product ID.
- GitNexus: refreshed the stale index with `npx gitnexus analyze` (2,218 nodes, 3,615 edges, 111 flows). Pre-edit impact attempts for new `affiliateLinkCommand` and `parseCreateAffiliateLinkInput` reported `Target ... not found`; these new symbols therefore had no indexed callers or execution-flow blast radius. No high/critical risk was reported.
- Validation after implementation: focused test command passed 11/11; `npm run lint` passed with zero warnings; `npm run typecheck` passed. No port-3200 listener was present, so no user-owned HMR process was stopped, restarted, or cleared.
- Scope/diff: `git diff --check` passed. Existing unrelated working-tree changes remain untouched: `PRODUCT.md`, GitNexus-generated AGENTS/CLAUDE and `.claude/skills/gitnexus/*` updates. `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted before commit but the installed GitNexus CLI reports `unknown command 'detect-changes'`.

## Task 1 review follow-up — fragment-safe tracking URL
- Review finding verified: the previous `deriveTrackingUrl` appended its tag to the full raw string, placing it inside a `#fragment` and incorrectly treating `?` inside that fragment as a request query.
- TDD RED: added exact regression assertions for `https://shop.test/item#details` and `https://shop.test/item#details?tab=1`; focused test command failed 1/12 with actual `https://shop.test/item#details?tag=deskholt-pending` versus expected pre-fragment query output.
- GREEN: changed only `deriveTrackingUrl` to split once at `#`, choose `?`/`&` from the pre-fragment segment, add the pending tag, then reattach the unchanged fragment. No URL serialization is used, preserving unrelated raw URL presentation. Focused command suite passed 12/12.
- GitNexus: `npx gitnexus impact deriveTrackingUrl --direction upstream --repo admin-redesign-shadcn-i18n` reported `Target 'deriveTrackingUrl' not found`, confirming the user-reported absence from the current index and no indexed blast radius.
- Verification: `npm run lint`, `npm run typecheck`, and `git diff --check` passed. `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` will be re-attempted before the follow-up commit; this CLI previously reported `unknown command 'detect-changes'`.

## Task 1 second review follow-up — multi-hash fragment preservation
- Review finding verified: `rawUrl.split('#', 2)` retained only the first fragment component and dropped subsequent literal `#` content.
- TDD RED: added the direct `https://shop.test/item#one#two` regression assertion. The focused suite failed 1/13, producing `https://shop.test/item?tag=deskholt-pending#one` instead of the required full-suffix output.
- GREEN: replaced the split with `indexOf('#')` plus `slice` for the pre-fragment URL and entire fragment suffix, exactly preserving multi-hash fragments. The focused suite passed 13/13.
- GitNexus: pre-edit `deriveTrackingUrl` impact attempt again reported `Target 'deriveTrackingUrl' not found`; there is no current indexed blast radius.
- Verification: `npm run lint`, `npm run typecheck`, and `git diff --check` passed. `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` will be attempted before commit; the installed CLI previously reported `unknown command 'detect-changes'`.

## Task 2 — Protected AffiliateLink Server Actions
- Added only `src/app/(admin)/admin/products/[id]/offers/actions.ts` and `tests/affiliateLinkActions.test.ts`, binding Task 1's create/update parsers and commands through independently injected action factories. No UI, i18n, Prisma/schema, public-code, or unrelated instruction-file changes were made.
- GitNexus: before introducing the new action factory symbols, `npx gitnexus impact createCreateAffiliateLinkAction --direction upstream --repo admin-redesign-shadcn-i18n` and the corresponding `createUpdateAffiliateLinkAction` query both reported `Target ... not found`; these new symbols have no indexed callers or execution-flow blast radius. No high/critical risk was reported.
- TDD RED: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkActions.test.ts` failed 6/6 as expected because the offers actions module did not exist.
- GREEN: action tests now cover both factory auth gates before parser/store work, valid-product invalid-input redirects, malformed-without-product fallback routing, update `not-found` routing with no update, and create/update success paths that revalidate exactly `/` and `/admin/products/product-1/offers` before `?saved=1`. The combined focused command passed 19/19 tests: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkActions.test.ts tests/affiliateLinkCommand.test.ts`.
- Verification: `npm run lint` and `npm run typecheck` passed; `git diff --check` passed after quoting the route path for PowerShell. Unrelated GitNexus-generated `AGENTS.md`, `CLAUDE.md`, `.claude/skills/gitnexus/*`, and untracked `PRODUCT.md` changes remain excluded.
- Pre-commit detector: `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted against the staged Task 2 scope and the installed CLI returned `error: unknown command 'detect-changes'`; no alternative detector command was substituted.

## Task 2 review follow-up — product ID route safety and absent-product mapping
- Root cause: Task 1 accepted any non-empty `productId`, while Task 2's malformed-input fallback interpolated a non-empty raw submitted value into the offers redirect. A nonexistent but syntactically valid product also surfaced Prisma's `P2003` foreign-key exception instead of the typed invalid-input result.
- GitNexus: pre-edit impact attempts for `parseCreateAffiliateLinkInput`, `executeCreateAffiliateLink`, `parseOfferInput`, and `submittedProductId` found no indexed target. The ambiguous `requiredText` search resolved only to the unrelated publishing command and was not edited; no high/critical risk was reported.
- TDD RED: the focused command/action suite failed 3/22 for the missing unsafe-ID parser validation and absent-product `P2003` mapping. An additional action-level regression then failed with the unsafe raw redirect `/admin/products/../x/offers?error=invalid-input`, proving the fallback interpolation gap.
- GREEN: added one shared validator for a single safe URL route segment (`^[A-Za-z0-9_-]+$`), used at the create/update parser boundary and in the action fallback before constructing an offers route. It preserves existing CUID-style and test IDs such as `product-1`, rejects delimiter/navigation IDs, and makes unsafe/missing IDs redirect only to `/admin/products?error=invalid-input`. `executeCreateAffiliateLink` now maps only `P2003` around `store.createAffiliateLink` to `{ ok: false, reason: 'invalid-input' }`, mirroring the established P2002 handling shape without a new store API or lookup.
- Focused GREEN: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkActions.test.ts tests/affiliateLinkCommand.test.ts` passed 22/22.
- Verification: `npm run lint`, `npm run typecheck`, and both working/staged `git diff --check` checks passed.
- Pre-commit detector: `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted against the staged correction scope and the installed CLI returned `error: unknown command 'detect-changes'`; no substitute detector was used.

## Task 2 re-review follow-up — direct executor safe-ID guards
- Root cause: public `executeCreateAffiliateLink(store, productId, input)` and `executeUpdateAffiliateLink(store, linkId, input)` guarded only blank product IDs, so direct callers could bypass parser-level safe route-segment validation and reach store methods with delimiter/navigation IDs.
- GitNexus: fresh pre-edit upstream impact attempts for both executor symbols returned `Target ... not found`; no indexed callers or execution-flow blast radius were reported.
- TDD RED: direct create/update tests using `../x`, `x?foo=bar`, and `x#fragment` failed 2/24 because the executors returned successful results and invoked the fake stores.
- GREEN: changed only executor guards to use the established shared `isSafeAffiliateLinkProductId` invariant while preserving the existing empty-`linkId` guard. Direct unsafe calls now return `{ ok: false, reason: 'invalid-input' }` before every create/find/update operation.
- Focused GREEN: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkActions.test.ts tests/affiliateLinkCommand.test.ts` passed 24/24.
- Verification: `npm run lint`, `npm run typecheck`, and working/staged `git diff --check` passed.
- Pre-commit detector: `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted against the staged guard scope and the installed CLI returned `error: unknown command 'detect-changes'`; no substitute detector was used.

## Task 3 — Offers translations and Admin offers page
- Added only `src/lib/admin/i18n/en.ts`, `src/lib/admin/i18n/vi.ts`, `src/app/(admin)/admin/products/[id]/offers/page.tsx`, and `tests/adminOffersPage.test.ts`; this ledger entry records the task. Public UI, tokens, schemas, dependencies, and existing action/command behavior were not changed.
- GitNexus: refreshed the stale index (`2,335` nodes, `3,874` relationships, `126` flows). Upstream impact for existing `en` and `vi` dictionaries was LOW with zero direct dependents and zero affected flows; the Admin offer query identified the existing authenticated action flow. No high/critical risk occurred.
- TDD RED: `node --experimental-test-module-mocks --import tsx --test tests/adminOffersPage.test.ts tests/adminI18n.test.ts` failed as expected: the `offers` dictionaries were absent and the offers page module did not exist.
- GREEN coverage: EN/VI offer dictionary shape and `products.actions.offers`; direct server translations; awaited Promise params/search params; missing-product `notFound`; priority-ordered offer query; one product-scoped update form per offer; separate create form; hidden product/link IDs; hidden network backing the disabled existing Select; editable named create Select; six translated network labels; stock status badge; saved/invalid banners; defaults; and no `tracking_url` field or hardcoded visible offer labels.
- Type correction: the generated Prisma client models `Product.category` as a scalar string and `AffiliateLink.network` as a string. The final page selects/displays the scalar category and narrows each persisted network solely for translated-label indexing; focused test, typecheck, lint, complete tests, and diff checks passed afterwards.
- Impeccable detector (once after UI implementation): `node C:\laragon\www\deskholt\.agents\skills\impeccable\scripts\detect.mjs --json "src/app/(admin)/admin/products/[id]/offers/page.tsx" "src/lib/admin/i18n/en.ts" "src/lib/admin/i18n/vi.ts"` returned `[]`.
- Final verification: focused i18n/Admin visual suite passed 17/17; `npm run typecheck`, `npm run lint`, `npm test` (362 pass, 8 intentional skips), and `git diff --check` passed. Unrelated generated AGENTS/CLAUDE/.claude and `PRODUCT.md` changes remain excluded.

## Task 3 review follow-up — Admin-token saved banner
- Review ruling recorded: the missing Products `Offers (N)` entry point remains Task 4 scope and was not changed here.
- Verified the review finding in the offers page: its `role="status"` saved banner used raw `border-emerald-*`, `bg-emerald-*`, `text-emerald-*`, and `dark:text-emerald-*` utilities despite the Admin palette having no success semantic token.
- GitNexus: refreshed stale index (`2,357` nodes, `3,920` relationships, `127` flows); `OffersPage` upstream impact is LOW, with one direct test caller and no affected execution flows.
- TDD RED: added the source regression in `tests/adminOffersPage.test.ts`; focused test run failed 1/5 because the raw emerald utilities remained.
- GREEN: changed only the saved banner class to `border-admin-primary/30 bg-admin-primary/10 text-admin-foreground`, preserving its structure, status semantics, copy, and error banner.
- Verification: focused Admin offers/i18n/shadcn/visual suite passed 18/18; `npm run lint`, `npm run typecheck`, and `git diff --check` passed. Impeccable detector was run once after the edit on the page and test and returned `[]`.

## Task 4 — Products Offers entry point
- Added the translated `Offers (N) →` link in the established second Actions link row of the Admin Products list, next to Edit specifications. Its href is product-bound (`/admin/products/${product.id}/offers`); no first-row lifecycle/Save/index control, form, table-scroll, or public route behavior changed.
- The existing product `_count` query retains `product_attributes` and now selects `affiliate_links`; the count is rendered beside the translated offers label.
- GitNexus: after stale-index refresh, `AdminProductsPage` upstream impact was LOW with 0 direct callers and 0 affected processes. No high/critical risk occurred.
- TDD RED: the focused products test failed because `_count.affiliate_links` was absent. GREEN: focused Task 4 suite passed 13/13; full `npm test` passed 364 with 0 failures and 8 intentional skips. `npm run lint`, `npm run typecheck`, cached diff check, and post-edit Impeccable detector all passed (`[]`).
- Pre-commit `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted but this installed CLI reports `unknown command 'detect-changes'`. Commit `706c15e` contains only the products page and its regression test; pre-existing generated instruction/skill changes and untracked `PRODUCT.md` remain excluded.

## Task 1 security correction — HTTP(S)-only URLs and conditional update
- Root cause verified: `URL.canParse()` accepted `javascript:alert(1)` and `data:text/html,x`; `appendClickId()` constructs a `URL` and `/go/[slug]` consumes the persisted tracking URL as a redirect target. Separately, update performed a product-scoped read followed by an id-only mutation, leaving an association-change window.
- GitNexus pre-edit impact: `executeUpdateAffiliateLink` was LOW with 0 direct callers and 0 affected processes; `createPrismaAffiliateLinkStore` was LOW with 2 direct action wrappers and 2 affected processes; `parseOfferInput` was LOW with 2 direct parser callers and 2 action processes. No HIGH/CRITICAL result occurred.
- TDD RED: `node --experimental-test-module-mocks --import tsx --test tests/affiliateLinkCommand.test.ts` failed 3/20: both create/update parsers accepted `javascript:`/`data:` schemes and a no-row conditional mutation produced a null-id TypeError.
- GREEN: parsing now constructs `new URL(rawUrl)` and accepts exactly `http:` or `https:`; existing valid HTTPS coverage remains green. `AffiliateLinkStore.updateAffiliateLink(linkId, productId, data)` now returns `{ id } | null`; the Prisma adapter uses `updateMany` constrained by both IDs and returns null unless exactly one row changes. The executor preserves the existing read, maps null to `{ ok: false, reason: 'not-found' }`, and action test fakes use the new method contract. P2003 create handling is unchanged.
- Regression coverage: create/update parsing reject both non-web schemes; the executor simulates a successful lookup followed by a zero-row conditional update and proves `not-found` plus unchanged stored data; the Prisma adapter test asserts the exact `updateMany` predicate/data.
- Verification: focused command/action suite passed 28/28; `npm run lint` and `npm run typecheck` passed; full `npm test` passed 368 with 0 failures and 8 intentional skips. The pre-commit GitNexus detector is re-attempted for this correction before commit.

## Task 1 security re-review — executor URL validation
- Root cause verified: the HTTP(S) boundary existed only at FormData parsing. Both public executor functions accept runtime input objects, so a direct caller could bypass parsing, derive a tracking URL from `javascript:`/`data:`, and invoke persistence.
- GitNexus pre-edit impact: both executors were LOW with 0 direct callers/0 processes; `parseOfferInput` was LOW with 2 direct parser callers and 2 action processes; the Prisma store adapter remains LOW with 2 direct action wrappers and 2 processes. No HIGH/CRITICAL result occurred.
- TDD RED: the focused command suite failed 2/23 because direct create and update calls with both non-web schemes returned success and touched the instrumented store.
- GREEN: a single pure `normalizeSafeAffiliateLinkRawUrl` validator trims runtime input, constructs a URL, and accepts only exact `http:`/`https:` protocols. Parser and both executors reuse it. Executors return `invalid-input` before every store method for invalid runtime URLs and use the same normalized raw URL as parser input for valid values. The existing atomic Prisma `updateMany` adapter is unchanged.
- Regression coverage: direct create and update each test both `javascript:` and `data:` values with create/find/update instrumentation proving zero calls; valid HTTPS command behavior remains green. The association-race test is stateful: lookup changes the stored owner before the conditional mutation, which returns null without changing the stored price.
- Verification: focused command/action suite passed 30/30; `npm run lint`, `npm run typecheck`, `git diff --check`, and full `npm test` passed (370 pass, 0 fail, 8 intentional skips). The pre-commit detector is re-attempted before this scoped commit.
