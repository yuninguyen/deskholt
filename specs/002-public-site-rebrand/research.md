# Phase 0 Research: Public Site Rebrand

## Decision: `/admin/*` isolation strategy

**Decision**: Introduce `src/app/(public)/layout.tsx` (new, carries the new design system's
nav/footer/cookie-banner/disclosure banner) and `src/app/(admin)/layout.tsx` (new, replicates
today's inherited chrome so admin pages render identically). Shrink `src/app/layout.tsx` to a
bare `<html>/<body>` shell that only loads font variables — no visual chrome of its own.

**Rationale**: Inspected the current tree — `src/app/(admin)/admin/*` has no `layout.tsx` of
its own today, so it silently inherits the public nav/footer/disclosure-banner chrome and
`<body>` classes from the shared root `src/app/layout.tsx`. If the root layout is edited in
place to carry the new design tokens (paper background, ink text, new nav/footer), every
`/admin/*` page would visually change too — directly violating the explicit "KHÔNG đụng route
/admin/*" requirement (FR-013/FR-014). Route groups (`(public)`, `(admin)`) do not affect URL
paths, so this is a pure internal reorganization with no routing/SEO impact.

**Alternatives considered**:
- *Leave root layout as-is, add conditional rendering by pathname* — rejected: fragile
  (`usePathname`/middleware checks scattered through a shared layout), and Server Components
  in the root layout can't easily branch on route group without extra plumbing that route
  groups already solve natively.
- *Duplicate the whole root layout inside `(admin)` and leave the shared root layout
  restyled* — rejected: still requires the shared root layout to carry zero chrome (otherwise
  admin would get double chrome), which is exactly what shrinking the root layout achieves
  directly, so the extra duplication step adds nothing.

## Decision: Cookie consent banner is a new build, not a restyle

**Decision**: Build `src/components/ui/CookieBanner.tsx` and `src/lib/consent/cookieConsent.ts`
from scratch, matching the design system's cookie-banner visual spec (ink banner, paper text,
Customize modal with 4 toggle rows, Necessary locked on) and satisfying the Legal & Platform
Compliance constitution principle (GPC signal auto-declines and does not re-prompt; consent
persists across visits) — but there is no pre-existing implementation to "preserve."

**Rationale**: Repo-wide search for `cookie`/`Cookie` found only admin session-cookie code
(`src/lib/admin/auth.ts`, `src/middleware.ts`, login `actions.ts`) — there is no consent
banner component, no consent-cookie helper, and no GPC-detection logic anywhere in `src/`.
The feature spec's User Story 3 was written assuming an existing implementation to restyle;
in practice this is new functionality using the design system's visual spec as the UI
target and the constitution's compliance principle as the behavioral target. Scope is kept
minimal: client-side consent state in `localStorage` (no new DB table, no admin UI for
consent audit — out of scope for this visual-rebrand feature) plus a GPC check via
`navigator.globalPrivacyControl`.

**Alternatives considered**:
- *Skip the cookie banner entirely since "no prior version exists to restyle"* — rejected:
  the user's request explicitly lists "cookie banner" as an in-scope surface, and the
  constitution's Legal & Platform Compliance principle is NON-NEGOTIABLE; shipping the public
  rebrand without any consent mechanism would be a compliance regression, not neutral.
- *Third-party consent-management library* — rejected: adds a new dependency and possible
  cost/vendor lock-in for a small, well-specified requirement (4 fixed categories, GPC
  check, localStorage persistence) that a ~100-line component comfortably covers.

## Decision: Extract shared Badge / PriceTable / ProductCard components

**Decision**: Create `src/components/ui/Badge.tsx`, `PriceTable.tsx`, `ProductCard.tsx` and
use them from `(public)/page.tsx`, `(public)/category/[slug]/page.tsx`, and
`(public)/products/[slug]/page.tsx`, replacing the currently-duplicated inline JSX/Tailwind
markup for these three UI pieces.

**Rationale**: Today, product-card and badge markup is hand-duplicated (near-identically)
across the home page and category page files (both use the same `glass-card` product tile
JSX inline), and the price-table markup only exists inline in the product page. FR-007,
FR-009, and FR-010 each require the corresponding component to be styled "consistently" and
"everywhere it appears" — duplicating the new markup a second time would reintroduce the same
drift risk the design system doc explicitly warns about (`design-system.html` §07/§08: "1
component, nhiều nơi dùng"). Extracting them once keeps the new styling as the single source
of truth and is the smallest change that satisfies the requirement without doing unrelated
refactoring elsewhere in the codebase.

**Alternatives considered**:
- *Keep markup inline per-page, just swap Tailwind classes in place* — rejected: guarantees
  future drift (already happened once with the current `glass-card` duplication) and directly
  works against the design system's own stated component philosophy.

## Decision: Font loading via `next/font/google`

**Decision**: Load Space Grotesk, Inter, and IBM Plex Mono using `next/font/google` in the
root `layout.tsx`, exposing them as CSS variables (`--font-display`, `--font-body`,
`--font-mono`) consumed by `globals.css`/Tailwind `fontFamily` theme extension, with
`display: 'swap'`.

**Rationale**: This matches the design system doc's own "Dev handoff" note ("Font load qua
`next/font/google` thay vì link tag khi build thật") and avoids the render-blocking
`<link>`-tag approach used only in the standalone HTML mockups. `next/font/google`
self-hosts the font files at build time (no runtime Google Fonts request), which is strictly
better for performance than the mockup's `<link rel="preconnect">` approach.

**Alternatives considered**:
- *Runtime `<link>` tags as in the mockup HTML* — rejected: introduces a render-blocking
  external request per page load; the design system doc itself calls this out as a
  mockup-only shortcut, not the production approach.

## Decision: Tailwind token replacement, not a parallel token system

**Decision**: Replace the `brand`/`dark` color scale in `tailwind.config.ts` with the full
design-system palette (paper/card/ink/walnut/blueprint/sage/amber/brick + variants) and add
`fontFamily.display/body/mono`, `borderRadius.sm/md/lg` matching the design system's radius
scale. `globals.css` keeps the `@tailwind base/components/utilities` structure but replaces
the `.glass-card`/`.glass-nav` custom classes with the design system's `.dim-line`,
paper-grid `body` background, and any small custom classes that aren't cleanly expressible as
Tailwind utilities (e.g. the grid-ruled background pattern, the toggle switch).

**Rationale**: The codebase already uses Tailwind as its styling mechanism (per Assumptions
in spec.md); introducing a second, parallel CSS-variable-only system (like the standalone
mockup HTML files do) would fragment styling approaches for no benefit, since Tailwind's
`theme.extend` already supports arbitrary token names and the mockups' CSS variables map
directly onto Tailwind config values.

**Alternatives considered**:
- *Keep raw CSS variables (`--paper`, `--ink`, etc.) as the primary mechanism, use them via
  `style={{}}` or `var()` in Tailwind arbitrary values* — rejected: works but abandons
  Tailwind's utility-class ergonomics (`bg-paper`, `text-ink`) that the rest of the codebase
  already relies on; only used for the one value that has no clean utility-class equivalent
  (the paper grid background), applied once in the new `(public)/layout.tsx`.
