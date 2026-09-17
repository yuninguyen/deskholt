# Implementation Plan: Product Spec-Diagram Fallback Image

**Branch**: `005-product-spec-diagram` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-product-spec-diagram/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Generate a DeskHolt-branded technical spec diagram (SVG) for Standing Desk products that have
complete VERIFIED core dimensional attributes but no real manufacturer/retailer photo, and use
it as `Product.image_url` in place of the shared generic stock placeholder. The diagram is
rendered on demand by a same-origin Route Handler from the product's own stored
`ProductAttribute` values (no new database table, no new stored asset). The image's own URL
path doubles as the "diagram vs. real photo" origin signal used by the Admin readiness view and
by the structured-data layer, so no schema migration is required.

## Technical Context

**Language/Version**: TypeScript, Next.js (App Router) — matches existing stack, no new runtime.

**Primary Dependencies**: None new. SVG is built with a plain server-side template function
(string-built `<svg>...</svg>` markup), served by a Next.js Route Handler as
`Content-Type: image/svg+xml`. Deliberately avoids adding `@vercel/og`/Satori or any charting
library — the existing project has no such dependency and the diagram content (a handful of
straight dimension lines, numeric labels, a rectangle) does not need one.

**Storage**: Existing PostgreSQL via Prisma. No new table/column. `Product.image_url` is set to
the diagram route's own path (e.g. `/api/product-diagram/[slug]`); no diagram bytes are
persisted anywhere.

**Testing**: `node --test` + `tsx`, matching the existing `tests/*.test.ts` convention already
used throughout this repo (see `package.json` `"test"` script).

**Target Platform**: Existing Next.js web app (Vercel + Neon today, per
`docs/operations/deployment-strategy.md`).

**Project Type**: Web application (existing single Next.js app; no new project boundary).

**Performance Goals**: Diagram must render well within normal page-load budgets; no specific
new performance target beyond "does not visibly slow the product page" — this is a small,
dependency-free SVG string build, not an image-processing pipeline.

**Constraints**: Must never render a diagram for a product missing required core VERIFIED
attributes (FR-003). Must never claim, in structured data or on-page text, that the diagram is
an authentic photo (FR-008, FR-009). Must not require a `next.config.mjs` remote-image-host
change (diagram is served same-origin, unlike existing Amazon/Unsplash photo URLs).

**Scale/Scope**: Initial rollout is exactly 5 named production Standing Desk products (SHW,
Veken 47.2in, Claiks, FEZIBO, OffiGo). Route Handler design is generic per-slug, so it is not
hardcoded to only those 5, but no other category is in scope for this feature.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principle I (Affiliate Data Integrity)**: Not implicated — this feature touches
  `Product.image_url` only, and does so through the existing product-edit write path (Principle
  IV), never `AffiliateLink`/`Click`/`Conversion`. PASS.
- **Principle II (Legal & Platform Compliance)**: Directly relevant — FR-008/FR-009 exist
  specifically so the diagram is never presented as an authentic photo in either structured
  data or on-page UI, avoiding the "fabricated data" pattern the constitution and blueprint
  §3 forbid. No Amazon scraping is involved (diagram is generated from data already legitimately
  in `ProductAttribute`, entered per the existing manual/API-sourced workflow). PASS.
- **Principle III (Flat Permissions)**: Not implicated — no new role/approval state introduced.
  PASS.
- **Principle IV (Save → Redirect, Never Silent AJAX)**: The only new *mutation* surface is
  setting `image_url` to the diagram route path; this MUST go through the existing product-edit
  Server Action + redirect flow already used for real photos (FR-006), not a new silent save
  path. PASS (by requirement, enforced in tasks).
- **Principle V (No Thin pSEO Content)**: The diagram is itself the kind of "distinctive value
  element" the principle asks for (a real data visualization derived from this product's own
  verified specs, not templated text) — reinforces rather than risks this principle. Public
  pages remain SSR/ISR; the diagram route is a plain server-rendered response, no client fetch.
  PASS.
- **Principle VI (Infrastructure Resilience)**: Not implicated — no new backup surface, no new
  IP-hash/rate-limit code path. PASS.
- **Principle VII (Niche Separation)**: Not implicated — no new content vertical. PASS.

No violations requiring the Complexity Tracking table.

## Project Structure

### Documentation (this feature)

```text
specs/005-product-spec-diagram/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── product-diagram/
│   │       └── [slug]/
│   │           └── route.ts          # NEW: renders SVG diagram for one product
│   └── (public)/
│       └── products/
│           └── [slug]/
│               └── page.tsx          # MODIFY: caption/label + structured-data image guard
├── lib/
│   └── products/
│       ├── productDiagram.ts         # NEW: eligibility check + SVG template builder
│       └── productStructuredData.ts  # MODIFY (or its caller): omit image when diagram
└── components/
    └── admin/
        └── products/
            └── (readiness list component)  # MODIFY: show diagram-vs-photo origin badge

tests/
├── productDiagram.test.ts            # NEW: eligibility + SVG content unit tests
└── productDiagramRoute.test.ts       # NEW: Route Handler contract test (404 when ineligible)
```

**Structure Decision**: Single existing Next.js application; no new project. The feature adds
one small library module (`productDiagram.ts`) with the eligibility/rendering logic, one Route
Handler that serves it, and two small, additive modifications to already-existing display code
(`products/[slug]/page.tsx` structured-data call site, and the Admin readiness list). No
Prisma schema change.

## Complexity Tracking

*No Constitution Check violations — table intentionally omitted.*
