# Feature Specification: Public Site Rebrand — "Technical Drawing Desk" Design System

**Feature Branch**: `002-public-site-rebrand`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Rebrand toàn bộ Deskholt public site sang design system mới "technical drawing desk" (paper kẻ ô, palette walnut/blueprint/sage/amber/brick, font Space Grotesk + Inter + IBM Plex Mono), theo đúng deskholt-design-system.html và deskholt-full-layout-v2.html ở root repo. Thay theme dark "glass-card"/brand-500 hiện tại trong src/app/layout.tsx và src/app/globals.css và tailwind.config. Áp dụng cho: layout.tsx (nav/footer), trang chủ, category page, product page, price table, cookie banner, badges, product card. Dùng logo thật logo_deskholt_transparent-background.webp thay icon/text placeholder hiện tại. KHÔNG đụng route /admin/* — giữ nguyên UI tối giản đã có ở đó."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Visitor lands on the site and reads it as a trustworthy price-comparison desk, not a generic dark storefront (Priority: P1)

A visitor arrives at deskholt.com (home, a category listing, or a product page) from search or a shared link. Instead of the current dark "glass-card" theme, they see a light, paper-textured, grid-ruled surface with warm ink text, a real logo, and precise mono-spaced numbers for prices and dimensions — communicating "measured and reliable" rather than "generic SaaS dark mode."

**Why this priority**: This is the core deliverable — every other story is a variation of "this surface now uses the new design system." Without this, nothing else in the rebrand exists.

**Independent Test**: Load `/` in a browser after the change; visually and via computed styles confirm the paper background, ink text color, Space Grotesk headings, and real logo are present instead of the old dark/brand-500 theme.

**Acceptance Scenarios**:

1. **Given** a visitor loads the home page, **When** the page renders, **Then** the background shows the paper grid texture, body text uses the ink/paper palette (not dark-900/gray-100), and headings render in Space Grotesk.
2. **Given** a visitor loads the home page, **When** they look at the header, **Then** they see the real Deskholt logo image (from `logo_deskholt_transparent-background.webp`) instead of the placeholder icon + "DESKHOLT" text lockup.
3. **Given** a visitor scrolls to the footer, **When** the footer renders, **Then** it uses the dark "ink" footer treatment (not the current dark-900/gray-800 tokens) consistent with the design system's footer component.

---

### User Story 2 - Visitor compares prices across stores and immediately recognizes the primary "buy" action (Priority: P1)

On a product page or within a comparison block, the visitor sees a price table and Buy Now / Go buttons restyled per the design system: blueprint blue reserved exclusively for the primary affiliate-linking action, badges (In Stock / Out of Stock / Best Price / Eco-Friendly / Price Drop) with both a color and a dot indicator, and the best-price row highlighted in sage.

**Why this priority**: The price table and Buy/Go button are the site's core monetization surface (per the project's Affiliate Data Integrity principle); the visual rebrand must not weaken users' ability to identify the actionable, revenue-generating element.

**Independent Test**: Load a product page and a category page independently; confirm the price table's best-price row is sage-highlighted, the Go/Buy button uses blueprint (not the old brand-500 green), and every badge shows a status dot plus text (not color alone).

**Acceptance Scenarios**:

1. **Given** a product page with multiple store listings, **When** the price table renders, **Then** the lowest-price row is visually distinguished with the sage "best" treatment and every other row uses the neutral card style.
2. **Given** a product that is in stock at one store and out of stock at another, **When** badges render, **Then** each badge shows both a colored dot and text label ("In Stock" / "Out of Stock") so status is not conveyed by color alone.
3. **Given** any Buy Now / Go button on the site, **When** it renders, **Then** its background is the blueprint color and no other interactive element on the page uses that same color for a non-purchase action.

---

### User Story 3 - Visitor accepts or customizes cookie consent under the new visual style without losing existing consent behavior (Priority: P2)

A first-time visitor sees the cookie banner restyled to the ink-on-paper treatment from the design system (dark ink banner, paper-colored buttons) but all existing consent logic (Customize modal with per-category toggles, GPC auto-decline, no re-prompt after GPC) continues to work unchanged.

**Why this priority**: Cookie consent is legally mandated (Legal & Platform Compliance principle) — the rebrand must be purely visual here and must not regress consent logic, but it's lower priority than the primary page/monetization surfaces since it's a single shared component.

**Independent Test**: Trigger the cookie banner on a fresh session; confirm it renders with the new ink/paper styling, the Customize modal still exposes Necessary/Analytics/Functionality/Advertising toggles, and behavior (GPC auto-decline, consent persistence) is unchanged from before the rebrand.

**Acceptance Scenarios**:

1. **Given** a first-time visitor with no consent cookie, **When** the page loads, **Then** the cookie banner renders using the ink background / paper text treatment instead of the current dark theme, with "Customize" and "Accept All" buttons styled per the new button component.
2. **Given** a visitor opens "Customize", **When** the modal renders, **Then** it shows the same four toggle categories with the same locked/unlocked behavior as before, restyled to the new card and toggle component look.
3. **Given** a visitor's browser sends a Global Privacy Control signal, **When** the page loads, **Then** the banner auto-hides and records "declined" exactly as it did before the rebrand (no behavior change, style change only).

---

### User Story 4 - Admin continues using the existing minimal admin UI, completely unaffected by the rebrand (Priority: P1)

Someone managing product specifications in `/admin/*` sees no visual change at all — the admin area keeps its current minimal styling, unaffected by the new tokens, fonts, or components introduced for the public site.

**Why this priority**: Explicitly called out as an exclusion by the requester; regressing the admin UI (which was just shipped and verified) would break already-working, recently-tested functionality and violate the "surgical changes" principle.

**Independent Test**: Load any `/admin/*` route before and after the rebrand and confirm pixel-for-pixel/style-for-style there is no visual difference and no shared class names or tokens were altered in a way that changes admin rendering.

**Acceptance Scenarios**:

1. **Given** the rebrand has been applied to the public site, **When** an authenticated user loads `/admin/products`, **Then** the page renders identically to how it rendered before the rebrand (same colors, fonts, layout).
2. **Given** global stylesheets are updated for the public site, **When** they are loaded on an `/admin/*` route, **Then** no new global color/font/background rule unintentionally overrides the admin area's existing minimal styling.

---

### Edge Cases

- What happens on a page where the design-system reference files don't specify an exact visual for every existing element (e.g. an existing component not shown in `deskholt-design-system.html` / `deskholt-full-layout-v2.html`)? → The nearest equivalent design-system component/token is applied by extrapolation, prioritizing internal consistency (e.g. a card that isn't explicitly specced reuses `.product-card` conventions) over inventing new visual language.
- How does the system handle users with `prefers-reduced-motion: reduce`? → Transitions collapse to instant color/state changes; no hover-slide or motion-based affordances are relied upon to convey information.
- How does the system handle keyboard-only navigation across restyled interactive elements (nav links, Buy/Go buttons, cookie toggles)? → Every interactive element retains a visible 2px focus outline in the blueprint color; no `outline: none` without a visible replacement.
- What happens if the real logo asset fails to load? → The logo `<img>` includes descriptive `alt` text ("Deskholt") so the brand name is still conveyed to assistive tech and in the broken-image case.
- What happens to color-contrast-sensitive users reading long-form blog/category text on the new paper background? → Body text uses `ink`/`ink-soft` tokens verified to meet at least AA contrast against the `paper` background per the design system's accessibility table.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The root layout (`src/app/layout.tsx`) MUST render the site header/nav and footer using the "technical drawing desk" design system's tokens and component structure (paper background, ink text, walnut/blueprint/sage/amber/brick accents) instead of the current dark "glass-card"/brand-500 theme.
- **FR-002**: The root layout's header MUST display the real Deskholt logo image sourced from `logo_deskholt_transparent-background.webp` in place of the current icon-glyph + "DESKHOLT" text lockup.
- **FR-003**: Global styling (`src/app/globals.css`) and the Tailwind theme configuration MUST expose the design system's full color palette (paper, paper-alt, card, ink, ink-soft, ink-faint, line, line-strong, walnut, walnut-soft, blueprint, blueprint-deep, blueprint-soft, sage, sage-soft, amber, amber-soft, brick, brick-soft) and the three font roles (display: Space Grotesk, body: Inter, mono: IBM Plex Mono) as reusable tokens, replacing the current `dark`/`brand` token scale for public-facing pages.
- **FR-004**: The home page MUST be restyled to the new design system while preserving its existing content sections (hero, category quick-nav, price drops, editor's comparison, latest blog posts, eco-friendly banner, newsletter signup).
- **FR-005**: The category listing page MUST be restyled to the new design system, including the filter sidebar and the product grid, while preserving existing filter/sort/pagination functionality.
- **FR-006**: The product detail page MUST be restyled to the new design system, including the price comparison table appearing above the fold, badges, pros/cons sections, and related-products area, while preserving existing data bindings.
- **FR-007**: The price comparison table component MUST use the design system's `.price-table` styling: mono-spaced numeric values, the lowest-priced/best row highlighted in sage, and a blueprint-colored "Go" action per row.
- **FR-008**: The cookie consent banner and its "Customize" modal MUST be restyled to the design system's ink-on-paper cookie component while preserving all existing consent logic (per-category toggles, GPC auto-decline detection, consent persistence, locked "Necessary" toggle).
- **FR-009**: Status badges (Eco-Friendly, In Stock, Out of Stock, Best Price, Price Drop) MUST use the design system's badge component (colored pill + status dot + label text) and MUST NOT convey status through color alone.
- **FR-010**: The product card component MUST use the design system's `.product-card` styling, including the dimension-line motif for a highlighted spec (e.g. width/height) where that data is available.
- **FR-011**: All buttons across restyled public pages MUST follow the design system's button hierarchy — blueprint primary reserved exclusively for actions that lead to an affiliate/outbound link, secondary (outlined) for non-monetizing actions, ghost for tertiary/inline actions.
- **FR-012**: Every restyled interactive element (buttons, links, toggles, nav items) MUST retain a visible focus indicator (2px outline in the blueprint color or equivalent) for keyboard navigation.
- **FR-013**: Routes under `/admin/*` MUST NOT be modified by this rebrand and MUST continue rendering with their current existing styling, unaffected by any new global token, font, or component change made for the public site.
- **FR-014**: Any global CSS or Tailwind theme change made for the rebrand MUST be scoped or verified so it does not alter the visual appearance of `/admin/*` routes.
- **FR-015**: All text content, copy, routes, URLs, and data bindings on restyled pages MUST remain unchanged from their pre-rebrand behavior — this is a visual/styling change only, not a content or functionality change (except where explicitly required, such as swapping the placeholder logo for the real logo asset).
- **FR-016**: Transitions and hover states on restyled elements MUST respect `prefers-reduced-motion: reduce` by collapsing to instant state changes.

### Key Entities

- **Design Tokens**: The named set of colors (paper, ink, walnut, blueprint, sage, amber, brick and their variants), font roles (display/body/mono), spacing scale, and radius scale defined in `deskholt-design-system.html`, to be made available as reusable values (e.g. CSS variables / Tailwind theme extensions) across the public site.
- **Restyled Surfaces**: The root layout (nav + footer), home page, category page, product page — each an existing page/route whose visual presentation changes but whose underlying data and routes do not.
- **Shared Components**: Price comparison table, cookie consent banner, badge, product card, button — cross-page UI pieces that must be restyled once and consistently reused everywhere they appear.
- **Logo Asset**: `logo_deskholt_transparent-background.webp`, the real brand mark replacing the current placeholder icon + text lockup in the nav and footer.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of public-facing pages (home, category, product) and the shared header/footer/cookie-banner/price-table/badge/product-card components visually match the "technical drawing desk" design system's color palette, typography, and component styling defined in `deskholt-design-system.html`.
- **SC-002**: The real Deskholt logo appears in place of the placeholder icon/text lockup on 100% of pages that render the site header or footer.
- **SC-003**: 0 visual or functional regressions are observed on any `/admin/*` route after the rebrand is applied (verified by side-by-side comparison before/after).
- **SC-004**: 0 loss of existing functionality on restyled pages — filters, sorting, pagination, cookie consent toggles, GPC handling, and affiliate Go/Buy links all continue to work exactly as before the rebrand.
- **SC-005**: All restyled body text meets at least AA contrast against its background, and all restyled primary text meets AAA contrast, consistent with the design system's documented accessibility targets.
- **SC-006**: 100% of interactive elements on restyled pages (buttons, links, toggles) remain operable and visibly focused via keyboard-only navigation.

## Assumptions

- The two reference files (`deskholt-design-system.html` for tokens/components, `deskholt-full-layout-v2.html` for full-page composition) are the single source of truth for the new visual design; where they don't cover a specific existing element, the nearest equivalent design-system pattern is extrapolated rather than inventing new visual language.
- "Public site" is scoped to everything outside `/admin/*`: the root layout, home page, category pages, product pages, and the shared components explicitly named by the requester (nav/footer, price table, cookie banner, badges, product card). Other public routes not explicitly named (e.g. blog article pages, legal pages) are restyled opportunistically using the same tokens/components since they share the root layout, but are not the primary acceptance target of this feature.
- This is a purely visual/presentational rebrand: no database schema changes, no new content, no changes to affiliate-link logic, consent-logic behavior, or SEO/routing structure are in scope.
- The existing Tailwind + CSS Modules/utility-class approach in `src/app/globals.css` and `tailwind.config.ts` continues to be the styling mechanism; the rebrand replaces token values and component classes rather than introducing a new styling framework.
- Font loading will use `next/font/google` (or equivalent self-hosted approach) for Space Grotesk, Inter, and IBM Plex Mono, consistent with the design system doc's own dev-handoff note, rather than a runtime `<link>` tag.
- "Admin route unaffected" means the `/admin/*` route group's own layout/styles are preserved as-is; if the admin route group currently inherits any token from the root layout that this rebrand changes, the admin route group's styles must be adjusted (isolated) so its rendered appearance does not change, per FR-013/FR-014.
