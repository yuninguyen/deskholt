# Admin Theme Refresh (Dark/Light Toggle) — Design

**Date:** 2026-08-31
**Status:** Approved

## Context

Dogfooding the Admin UI (product creation, specifications, publishing) surfaced a genuine
usability complaint: the interface "looks a bit ugly" — flat gray borders on a fixed dark
background, no visual hierarchy, no way to switch to a lighter theme. This is Admin-only
feedback; the public site (`localhost:3000`) already ships its own "paper/ink" rebrand theme
(warm paper background, ink/walnut/sage accents) from a prior initiative and is explicitly
out of scope here — it keeps its current look unchanged.

Three visual directions were mocked up and compared live (via the brainstorming visual
companion) against the actual `/admin/products` list content:

- **A — Refined Dark**: keep the dark background, add shadow/depth, pill-shaped badges,
  larger radius, gradient primary button.
- **B — Light Minimal**: white/light background, soft shadows, blue accent.
- **C — Compact Table**: replace the current card-per-product list with a dense table.

Decision: don't pick one — give the admin a toggle between A (dark) and B (light), and adopt
C for the product list layout in both themes.

## Scope

- A dark/light toggle scoped to `/admin/*` routes only. The public site's `<html>` and theme
  are untouched — no `dark:` variants are added to any file outside `src/app/(admin)/**` and
  `src/components/admin/**`.
- A new shared layout for the admin route group (`src/app/(admin)/layout.tsx` does not exist
  today — each admin page currently renders its own ad-hoc header). This layout hosts the
  theme wrapper, the FOUC-avoidance script, and a small shared header bar with the toggle
  button.
- Retrofit the 5 existing admin pages/components to theme-aware classes:
  `admin/login/page.tsx`, `admin/page.tsx`, `admin/products/page.tsx`,
  `admin/products/new/page.tsx`, `admin/products/[id]/specifications/page.tsx`,
  `components/admin/products/ProductSpecificationsForm.tsx`.
- Convert `admin/products/page.tsx`'s product list from card-per-product to a compact table
  (mockup C), in both themes.
- The upcoming AffiliateLink Offers page (separate spec) is built directly against the new
  tokens/classes established here — not touched in this spec.

## Architecture

**Dark-mode strategy:** Tailwind 3.4.10 (already installed) supports selector-based dark
mode: `darkMode: ['selector', '[data-theme="dark"]']` in `tailwind.config.ts`. This scopes
`dark:` variants to any ancestor carrying `data-theme="dark"`, instead of Tailwind's default
of a `dark` class on `<html>` — which would require touching the shared root layout
(`src/app/layout.tsx`) that both public and admin routes render through, and would leak into
the public site. The admin layout wrapper sets `data-theme` on a `<div>` it owns; the shared
root `<html>`/`<body>` are never modified.

**Theme resolution & persistence:**
- Source of truth: `localStorage.getItem('admin-theme')` (`'dark' | 'light'`).
- First visit (no stored value): fall back to `prefers-color-scheme` media query.
- `src/app/(admin)/layout.tsx` renders a small inline `<script>` (runs before paint) that
  reads localStorage/media-query and sets `data-theme` on the wrapper synchronously, avoiding
  a flash of the wrong theme — same technique as any standard Tailwind dark-mode setup.
- A client component `ThemeToggle` (new, `src/components/admin/ThemeToggle.tsx`) renders the
  ☀️/🌙 button, flips `data-theme` on click, and writes the choice to localStorage.

**Styling approach:** existing admin class strings are almost entirely dark-only
(`bg-gray-950`, `border-gray-800`, etc.). Each touched file gets:
- Base (unprefixed) classes rewritten to a light palette (per mockup B).
- A parallel `dark:` prefixed class for the current dark look, updated with mockup A's
  polish (pill badges via `rounded-full`, `shadow-lg`/`shadow-2xl` on cards, larger
  `rounded-xl`/`rounded-2xl`, gradient on the primary button).
- No change to the `brand` color values in `tailwind.config.ts` — only spacing/shape/shadow
  and the new light-mode color set are added.

**Product list → table:** `admin/products/page.tsx`'s `.map()` over products currently
renders one bordered card per product with inline lifecycle/index forms. This becomes a
`<table>` with columns Product / Status / Index / Attributes / Actions — the existing
per-row `<form>` elements (lifecycle select, enable/disable index) move into the Actions
cell unchanged in behavior, just laid out for a table row instead of a card.

## Testing

- No new business logic — this is a presentational refactor, so no new unit tests are
  required for the theme mechanism itself.
- Manual verification (screenshots in both themes) for each retrofitted page: login, products
  list (table), create product, specifications form — confirm no contrast/accessibility
  regressions (text still readable, focus rings still visible) in both `data-theme="dark"`
  and `data-theme="light"`.
- Confirm the public site (`/`, `/products/[slug]`, `/category/[slug]`) is visually
  unchanged after this change (spot-check, no `dark:` classes were added there).

## Explicitly Out of Scope

- Any change to the public site's theme, colors, or layout.
- Any change to `brand` color values or fonts.
- The AffiliateLink Offers CRUD page — separate spec, built on top of this once merged.
- Persisting theme choice server-side / per-admin-user (localStorage only, per-browser).
