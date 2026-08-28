# P0-A3 US1 Fail-Closed Acceptance

Date: 2026-08-27

## Policy

All eight `ProductStatus`/`is_indexed` combinations pass the exact closed decision matrix. Non-active statuses remain non-public, non-listable, non-sitemap, and non-commerce even when `is_indexed=true`. ACTIVE + false is public/commerce-eligible but `noindex,follow`; ACTIVE + true is eligible for public discovery and indexing.

## Creation and seed

The active TypeScript seed explicitly creates `DRAFT + is_indexed=false` Products. The legacy `prisma/seed.js` file and stale ESLint ignore were removed. The operational reference scan is empty.

## Commerce

Found DRAFT/BLOCKED/ARCHIVED Products return HTTP 404 before UUID/Redis/Click/URL side effects. ACTIVE Products preserve queue attribution and merchant redirect behavior. All-out-of-stock links use the mandatory `priority_order` fallback. Missing Products and Products with no affiliate links preserve redirect-home behavior.

## Listing predicate

Homepage and category queries compose `INDEXABLE_PRODUCT_WHERE` (`status: ACTIVE`, `is_indexed: true`) rather than filtering `is_indexed` alone.

## Verification

```text
node --experimental-test-module-mocks --import tsx --test tests/goProductAccess.test.ts: 7/7 PASS
npx tsx --test tests/clickTracking.test.ts tests/productAccessPolicy.test.ts tests/p0A3Integration.test.ts tests/p0A3SeedSafety.test.ts: 25/25 PASS
npm run typecheck: PASS
```
