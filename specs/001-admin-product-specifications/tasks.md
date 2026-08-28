# Tasks: Admin Product Specifications (V1-alpha)

**Plan**: [plan.md](./plan.md)

- [x] T001 Switch `prisma/schema.prisma` datasource to `postgresql`, point at `.env` `DATABASE_URL`
- [x] T002 Add additive models to `prisma/schema.prisma`: `Category`, `Brand`, `ProductVariant`, `AttributeDefinition`, `CategoryAttribute`, `ProductAttribute`, plus 4 enums, plus back-relations on `Product`
- [x] T003 `npx prisma db push` to apply schema to Postgres; verify existing `Product`/`AffiliateLink`/`Click`/`Conversion` rows survive
- [x] T004 `prisma/partial-indexes.sql` — the two partial unique indexes (String-id adapted), applied via `prisma db execute`
- [x] T005 [P] `src/lib/products/productAttributeValidator.ts` — port validator (productId/variantId as string)
- [x] T006 [P] `prisma/seed-standing-desk-attributes.ts` — Category + 35 AttributeDefinitions + CategoryAttribute, matched to existing `category="standing-desks"` products; also creates one ProductVariant per existing Standing Desk product so VARIANT rows are usable
- [x] T007 Run seed script, verify Category/AttributeDefinition/CategoryAttribute/ProductVariant rows created without touching existing tables
- [x] T008 [P] `src/lib/admin/auth.ts` — minimal shared-password session gate (signed cookie, env var `ADMIN_PASSWORD`)
- [x] T009 `src/middleware.ts` — gate `/admin/*` except `/admin/login` behind the session check
- [x] T010 `src/app/(admin)/admin/login/page.tsx` + `actions.ts` — login form, Server Action sets cookie, redirects
- [x] T011 `src/app/(admin)/admin/products/page.tsx` — minimal list of Standing Desk products linking to their specifications page
- [x] T012 `src/app/(admin)/admin/products/[id]/specifications/page.tsx` — loads product, category, CategoryAttribute rows, existing ProductAttribute values, active Variants; computes completeness; renders form
- [x] T013 `src/components/admin/products/ProductSpecificationsForm.tsx` — grouped rows (PRODUCT / VARIANT per variant / DERIVED product+variant), one field set per row (value/source URL/source type/confidence), submit button
- [x] T014 `src/app/(admin)/admin/products/[id]/specifications/actions.ts` — Server Action: parse form rows, run validator per non-blank row, transaction of find-then-update-or-create/delete, `redirect()` back to the same page on success, return field errors on failure (no partial write)
- [x] T015 Manual verification against spec.md acceptance scenarios (US1 rows 1-6, US2 completeness, US3 validator edge cases) using one real seeded Standing Desk product
- [ ] T016 `gitnexus_detect_changes()` before commit, per CLAUDE.md — unavailable in this runtime; MCP impact/detect tools are absent and the installed CLI has no `detect-changes` command, so staged path/diff/full verification is the required fallback

## Phase 1: Convergence

- [x] T017 Update `src/components/admin/products/ProductSpecificationsForm.tsx` to show the create-Variant warning whenever the product has no active Variant, including when only inactive Variants exist, per FR-011 and US1/AC2 (partial)
- [x] T018 Add focused shared-validator tests covering category mismatch, PRODUCT/VARIANT/DERIVED scope rules, missing/cross-product variants, exactly-one-value-column enforcement, numeric/boolean/string validation, and ENUM allowed values per FR-008, US3/AC1–3, and SC-004 (missing)
- [x] T019 Add Server Action behavioral tests proving one-action validation before writes, source-without-value rejection with zero partial writes, blank-row skip, clear-to-delete, transactional find/update/create behavior, verified timestamp set/clear semantics, and redirect-after-success per FR-003–FR-007 and US1/AC3–6 (missing)
- [x] T020 Preserve and visibly flag a stored ENUM value that is no longer present in `allowedValues` instead of silently dropping it from the Specifications form, per the stale-ENUM edge case (partial)
- [x] T021 Run disposable seeded Standing Desk acceptance for US1/US2, compare protected legacy table counts/spot checks before and after, verify completeness manually on at least three Products, and record secret-free evidence for T015, SC-003, and SC-005 (missing)
