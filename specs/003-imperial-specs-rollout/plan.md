# Implementation Plan: Imperial Canonical Specs + Public Specs Rollout

**Branch**: `003-imperial-specs-rollout` | **Date**: 2026-08-21 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-imperial-specs-rollout/spec.md`

## Summary

Change the unit of record for the 10 standing-desk length/weight/speed `AttributeDefinition` rows from metric (mm/kg/mm-per-s) to imperial (in/lb/in-per-s) — matching the only real data source (Amazon) — so no conversion math ever happens in the app. Migrate the small set of already-saved `ProductAttribute` values for those attributes to the equivalent imperial numbers, once. Then rewire the public Product Page's "Technical Specifications" section to read structured spec rows from `ProductAttribute`/`AttributeDefinition` (reusing the existing `loadSpecificationData` row-enumeration logic used by Admin), falling back to the current legacy `product.specs` JSON text for any product that has zero structured spec values saved — so the 18 not-yet-migrated products don't regress.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router), Node.js

**Primary Dependencies**: Next.js, React, Prisma ORM (`@prisma/client`), Tailwind CSS

**Storage**: PostgreSQL (local dev via Laragon; `deskholt_db`), accessed via Prisma

**Testing**: Node built-in test runner via `tsx --test tests/*.test.ts` (`npm test`)

**Target Platform**: Web (Next.js server, ISR/SSR per constitution Principle V)

**Project Type**: Web application — single Next.js repo with `(admin)` and `(public)` route groups

**Performance Goals**: No new goals beyond existing page load budgets; this is a data/display change, not a new heavy computation path

**Constraints**: Constitution Principle IV (admin mutations must Save→Redirect, not silent AJAX) — unaffected, no admin mutation flow changes shape, only the underlying attribute `key`/`unit` metadata and stored values change. Constitution Principle V (no thin pSEO content, SSR/ISR required) — unaffected, product page stays server-rendered.

**Scale/Scope**: 10 `AttributeDefinition` rows renamed/re-unit'd; 8 existing `ProductAttribute` rows (across 2 products) numerically migrated; 1 public page template (`src/app/(public)/products/[slug]/page.tsx`) updated to read structured specs with a legacy-text fallback.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Affiliate Data Integrity)** — PASS. No `AffiliateLink`/`Click`/`Conversion` rows touched. `Product.specs` (legacy) is not deleted, only superseded in display for migrated products.
- **Principle II (Legal & Platform Compliance)** — PASS. No Amazon scraping introduced; spec values continue to be entered manually by an editor in Admin, per existing workflow.
- **Principle III (Flat Permissions)** — PASS. No role/approval concept introduced.
- **Principle IV (Save → Redirect)** — PASS. The Admin Specifications Server Action already redirects on save; this feature does not change that flow's shape, only which unit metadata it reads and what values it converts once via a standalone migration script (not a user-facing save path).
- **Principle V (No Thin pSEO Content)** — PASS. Product page remains SSR/ISR (`revalidate = 86400`), unchanged rendering strategy; structured specs are real manufacturer data, not templated filler.
- **Principle VI (Infrastructure Resilience)** — N/A, no IP/rate-limit code touched.
- **Principle VII (Niche Separation)** — N/A, no new vertical/category introduced.

No violations. Complexity Tracking table not needed.

## Project Structure

### Documentation (this feature)

```text
specs/003-imperial-specs-rollout/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma                        # No shape change; AttributeDefinition rows' key/unit values change via seed + migration script
└── seed-standing-desk-attributes.ts     # UPDATED: 10 attribute defs get new key + unit (imperial)

scripts/ (new, one-off)
└── migrate-specs-to-imperial.ts         # NEW: one-time script — renames the 10 AttributeDefinition.key/unit
                                          # values in place (UPDATE, not delete+recreate) and converts the
                                          # existing ProductAttribute.value_number rows for those definitions

src/lib/products/
└── specificationRows.ts                 # REUSED as-is (already unit-agnostic; reads def.unit dynamically)

src/app/(public)/products/[slug]/
└── page.tsx                             # UPDATED: load structured spec rows (loadSpecificationData) for
                                          # the product's default/first active variant; render them if any
                                          # exist, else fall back to the current legacy specsObj rendering

tests/
└── specsDisplay.test.ts                 # NEW: covers the structured-vs-fallback branching logic
```

**Structure Decision**: Single Next.js project (existing repo layout, `(admin)`/`(public)` route groups). No new services/packages — this feature adds one one-time migration script and updates one existing seed file and one existing page component, reusing the existing `specificationRows.ts` row-enumeration helper rather than duplicating its logic.

## Complexity Tracking

*No constitution violations — table not needed.*
