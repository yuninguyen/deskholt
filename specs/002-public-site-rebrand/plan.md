# Implementation Plan: Public Site Rebrand — "Technical Drawing Desk" Design System

**Branch**: `002-public-site-rebrand` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-public-site-rebrand/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Replace the current dark "glass-card"/brand-500 (green) theme with the "technical drawing desk" design
system (paper/ink palette, walnut/blueprint/sage/amber/brick accents, Space Grotesk + Inter + IBM Plex Mono)
across all public-facing pages (root layout nav/footer, home, category, product) and shared UI (price
table, cookie banner, badges, product card), using the real logo asset. `/admin/*` must render unchanged.
Technical approach: extract the current inline `<html>/<body>` nav/footer chrome out of the shared root
layout into a new `(public)` route group layout carrying the new design tokens, add a sibling `(admin)`
route group layout that freezes today's admin chrome exactly as-is, and shrink the root layout to a bare
`<html>/<body>` + font loader shell — because today `(admin)/*` has no layout.tsx of its own and silently
inherits the root layout's nav/footer/disclosure banner, so editing the root layout in place would visibly
break admin pages despite the "don't touch admin" requirement.

## Technical Context

**Language/Version**: TypeScript 5.5, Next.js 16.3 (App Router, React 18.3)

**Primary Dependencies**: Tailwind CSS 3.4, `next/font/google` (Space Grotesk, Inter, IBM Plex Mono), `lucide-react` for icons, Prisma client for existing data queries (unchanged)

**Storage**: PostgreSQL via Prisma — unchanged; this feature makes no schema or query changes

**Testing**: `npm run lint`, `npm run typecheck`, `npm test` (tsx --test), manual browser verification via dev server (no visual regression tooling currently in the repo)

**Target Platform**: Server-rendered web app (Next.js App Router, ISR for public pages), evergreen desktop + mobile browsers

**Project Type**: Web application — single Next.js app with route groups (`(public)` new, `(admin)` existing)

**Performance Goals**: No regression vs. current — public pages keep `revalidate = 86400` (ISR); font loading must not introduce render-blocking requests (use `next/font/google` with `display: swap`)

**Constraints**: Zero visual/behavioral change to `/admin/*`; zero change to routes, data bindings, or affiliate-link logic; `prefers-reduced-motion: reduce` must collapse transitions to instant

**Scale/Scope**: 4 route files restyled (root layout + home + category + product), ~2-3 new small shared UI pieces (Badge, ProductCard extraction is optional — see Structure Decision), 1 new cookie-consent banner (does not currently exist in the codebase — see research.md), global CSS + Tailwind theme token replacement

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Affiliate Data Integrity** — N/A to this feature (no changes to Product/AffiliateLink/Click/Conversion persistence or blog shortcode rendering). PASS.
- **II. Legal & Platform Compliance** — Cookie banner is being newly built (see research.md); it MUST still satisfy "Customize opens real per-category toggles" and "GPC signal auto-declines, no re-prompt" even though no prior implementation exists to preserve. Affiliate Disclosure banner in the root layout must continue rendering on every page. PASS, with the cookie-banner scope tracked explicitly in research.md.
- **III. Flat Permissions** — N/A, no admin permission changes. PASS.
- **IV. Save → Redirect** — N/A, no admin mutations touched. PASS.
- **V. No Thin pSEO Content** — N/A, no new content pages; existing ISR/SSR rendering is preserved unchanged. PASS.
- **VI. Infrastructure Resilience** — N/A, no backend/infra changes. PASS.
- **VII. Niche Separation** — N/A, no new content vertical. PASS.
- **Additional Constraint — Route Handler for `/go/[slug]`**: unaffected, no changes to `src/app/go/[slug]`. PASS.

No violations requiring Complexity Tracking justification.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
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
│   ├── layout.tsx                  # SHRUNK: bare <html>/<body> + font vars only, no nav/footer
│   ├── globals.css                 # REPLACED: design-system tokens + tailwind layers
│   ├── (public)/                   # NEW route group — carries new design system
│   │   ├── layout.tsx              # NEW: nav (real logo), footer, disclosure banner, cookie banner — new tokens
│   │   ├── page.tsx                # MOVED from src/app/page.tsx, restyled
│   │   ├── category/[slug]/page.tsx        # MOVED, restyled
│   │   ├── products/[slug]/page.tsx        # MOVED, restyled
│   │   └── affiliate-disclosure/page.tsx   # MOVED (styling only, content unchanged)
│   ├── (admin)/                    # EXISTING — gets its own layout.tsx (NEW file)
│   │   ├── layout.tsx              # NEW: replicates today's inherited dark chrome exactly, isolates from (public)
│   │   └── admin/...               # UNCHANGED page files
│   └── go/[slug]/...               # UNCHANGED (Route Handler, out of scope)
├── components/
│   ├── ui/                         # NEW small shared pieces used by (public) pages
│   │   ├── Badge.tsx               # NEW: dot + label, variant per design-system badge types
│   │   ├── PriceTable.tsx          # NEW: extracted from inline product-page markup
│   │   ├── ProductCard.tsx         # NEW: extracted from inline home/category markup
│   │   └── CookieBanner.tsx        # NEW: banner + customize modal, GPC detection
│   └── ProductSchema.tsx           # UNCHANGED
└── lib/
    └── consent/                    # NEW: minimal cookie-consent helper (localStorage read/write, GPC check)
        └── cookieConsent.ts

tailwind.config.ts                  # REPLACED: color tokens, font families, radius scale
```

**Structure Decision**: Single Next.js app (no separate frontend/backend split — this is a
Next.js App Router monolith). The key structural move is introducing two route groups —
`(public)` (new design system) and `(admin)` (frozen current look) — each with their own
`layout.tsx`, so the shared root `layout.tsx` no longer renders any visual chrome and thus
cannot leak new tokens into `/admin/*`. Existing page files under `src/app/{page,category,products,affiliate-disclosure}` move one level into `src/app/(public)/...` (route paths are
unchanged — route groups don't affect URLs). Inline card/badge/price-table markup that is
currently duplicated across `page.tsx`/`category/[slug]/page.tsx`/`products/[slug]/page.tsx`
is extracted into `src/components/ui/` so the design system's components are defined once
and reused, per FR-007/FR-009/FR-010's "consistently reused everywhere" requirement.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — Constitution Check above passed cleanly for every applicable principle. This section is intentionally empty.
