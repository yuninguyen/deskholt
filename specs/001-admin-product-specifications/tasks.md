# Tasks: Admin Product Specifications (V1-alpha)

**Plan**: [plan.md](./plan.md)

- [ ] T001 Switch `prisma/schema.prisma` datasource to `postgresql`, point at `.env` `DATABASE_URL`
- [ ] T002 Add additive models to `prisma/schema.prisma`: `Category`, `Brand`, `ProductVariant`, `AttributeDefinition`, `CategoryAttribute`, `ProductAttribute`, plus 4 enums, plus back-relations on `Product`
- [ ] T003 `npx prisma db push` to apply schema to Postgres; verify existing `Product`/`AffiliateLink`/`Click`/`Conversion` rows survive
- [ ] T004 `prisma/partial-indexes.sql` — the two partial unique indexes (String-id adapted), applied via `prisma db execute`
- [ ] T005 [P] `src/lib/products/productAttributeValidator.ts` — port validator (productId/variantId as string)
- [ ] T006 [P] `prisma/seed-standing-desk-attributes.ts` — Category + 35 AttributeDefinitions + CategoryAttribute, matched to existing `category="standing-desks"` products; also creates one ProductVariant per existing Standing Desk product so VARIANT rows are usable
- [ ] T007 Run seed script, verify Category/AttributeDefinition/CategoryAttribute/ProductVariant rows created without touching existing tables
- [ ] T008 [P] `src/lib/admin/auth.ts` — minimal shared-password session gate (signed cookie, env var `ADMIN_PASSWORD`)
- [ ] T009 `src/middleware.ts` — gate `/admin/*` except `/admin/login` behind the session check
- [ ] T010 `src/app/(admin)/admin/login/page.tsx` + `actions.ts` — login form, Server Action sets cookie, redirects
- [ ] T011 `src/app/(admin)/admin/products/page.tsx` — minimal list of Standing Desk products linking to their specifications page
- [ ] T012 `src/app/(admin)/admin/products/[id]/specifications/page.tsx` — loads product, category, CategoryAttribute rows, existing ProductAttribute values, active Variants; computes completeness; renders form
- [ ] T013 `src/components/admin/products/ProductSpecificationsForm.tsx` — grouped rows (PRODUCT / VARIANT per variant / DERIVED product+variant), one field set per row (value/source URL/source type/confidence), submit button
- [ ] T014 `src/app/(admin)/admin/products/[id]/specifications/actions.ts` — Server Action: parse form rows, run validator per non-blank row, transaction of find-then-update-or-create/delete, `redirect()` back to the same page on success, return field errors on failure (no partial write)
- [ ] T015 Manual verification against spec.md acceptance scenarios (US1 rows 1-6, US2 completeness, US3 validator edge cases) using one real seeded Standing Desk product
- [ ] T016 `gitnexus_detect_changes()` before commit, per CLAUDE.md
