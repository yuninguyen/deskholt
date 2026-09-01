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
