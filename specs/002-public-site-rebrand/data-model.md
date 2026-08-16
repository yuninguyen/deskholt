# Phase 1 Data Model: Public Site Rebrand

This feature is purely presentational — it introduces **no new Prisma models, no database
migrations, and no changes to existing `Product`/`AffiliateLink` query shapes**. The
"entities" below are design-token and component contracts (TypeScript/CSS), not persisted
data.

## Design Tokens (`tailwind.config.ts` `theme.extend`)

| Token group | Keys | Source |
|---|---|---|
| `colors.paper` | `DEFAULT` (#F3F1EA), `alt` (#EAE7DC) | design-system.html §01 |
| `colors.card` | `DEFAULT` (#FBFAF6) | design-system.html §01 |
| `colors.ink` | `DEFAULT` (#1F2421), `soft` (#565B54), `faint` (#8B8F86) | design-system.html §01 |
| `colors.line` | `DEFAULT` (#DBD6C7), `strong` (#C7C1AE) | design-system.html §01 |
| `colors.walnut` | `DEFAULT` (#A8623E), `soft` (#F0E1D8) | design-system.html §01 |
| `colors.blueprint` | `DEFAULT` (#2C5079), `deep` (#1D3A57), `soft` (#E1E9F0) | design-system.html §01 |
| `colors.sage` | `DEFAULT` (#566E4E), `soft` (#E4EBE0) | design-system.html §01 |
| `colors.amber` | `DEFAULT` (#A9762E), `soft` (#F3E7D2) | design-system.html §01 |
| `colors.brick` | `DEFAULT` (#A8432B), `soft` (#F3E0DA) | design-system.html §01 |
| `fontFamily.display` | Space Grotesk | design-system.html §02 |
| `fontFamily.body` | Inter | design-system.html §02 |
| `fontFamily.mono` | IBM Plex Mono | design-system.html §02 |
| `borderRadius.sm/md/lg` | 3px / 6px / 10px | design-system.html §04 |

Validation rule: no other color token (`brand-*`, `dark-*`) may be referenced from any file
under `src/app/(public)/**` or `src/components/ui/**` after migration — a grep for
`brand-|dark-(900|800|700|600)` in those paths must return zero matches once implementation
is complete (verification step in quickstart.md).

## Component Contracts (`src/components/ui/*.tsx`)

### Badge

- **Props**: `variant: 'eco' | 'instock' | 'outstock' | 'best' | 'drop'`, `label: string`
- **Renders**: a dot (`currentColor`) + `label` text — never color alone (FR-009)
- **Relationships**: used by ProductCard and PriceTable rows

### PriceTable

- **Props**: `rows: { network: string; price: number; inStock: boolean; goHref: string }[]`
- **State/derived**: the lowest-priced in-stock row is the "best" row (sage highlight);
  matches existing `is_in_stock`/`orderBy: price asc` query shape already used by
  `products/[slug]/page.tsx` and `go/[slug]` — no new fields required from Prisma
- **Renders**: mono-spaced price values, sage-highlighted best row, blueprint "Go →" button
  per row (disabled/muted style when `!inStock`)

### ProductCard

- **Props**: `name: string; slug: string; category: string; imageUrl: string; lowestPrice?: number; linkCount: number; badges: BadgeProps[]; dimension?: { value: string; label: string }`
- **Renders**: image, category label, name (linked to `/products/[slug]`), badges row,
  mono price, primary "Compare N stores →" button; optional dimension-line motif overlay on
  the image per design-system.html §03/§07

### CookieBanner (new capability, not a restyle — see research.md)

- **State**: `consent: { necessary: true; analytics: boolean; functionality: boolean; advertising: boolean } | null` persisted to `localStorage` under a single versioned key
- **Behavior**:
  - On mount, if `navigator.globalPrivacyControl === true` and no existing consent record, silently write a "declined" (all-false except necessary) record and never render the banner
  - If a consent record already exists, never render the banner
  - Otherwise render the banner; "Accept All" writes all-true; "Customize" opens a modal with the 4 toggle rows (Necessary locked on) and a save action that writes the chosen state
- **Relationships**: rendered once, inside `(public)/layout.tsx`, above the footer

## Restyled Route Files (no data shape changes)

- `src/app/(public)/page.tsx` — same `prisma.product.findMany` query as today, output now passed into `<ProductCard>` instead of inline JSX
- `src/app/(public)/category/[slug]/page.tsx` — same query/filter logic (`is_sustainable` eco filter), output now passed into `<ProductCard>`
- `src/app/(public)/products/[slug]/page.tsx` — same query, `affiliate_links` now passed into `<PriceTable>`
