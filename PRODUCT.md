# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing codebase: Next.js (App Router, Server Components + Server Actions), React, TypeScript, Tailwind CSS, Prisma + Postgres. This `init` covers a redesign of the **Admin** surface (`/admin/*`) specifically; the redesign is authorized to introduce `shadcn/ui`/Radix as an additional UI component layer on top of the existing stack (user-approved), rather than staying pure hand-rolled Tailwind + native HTML forms.

## Users

- **Public site visitors**: shoppers researching home-office/desk gear who want multi-store price comparison and curated product info — not the audience for this Admin redesign, mentioned here only for product context.
- **Admin users**: today, a single solo operator (the site owner) managing the product catalog through a single shared password (no per-user accounts or roles). The owner has confirmed this will expand to additional people (staff/collaborators) sharing the Admin panel in the future — exact roles/permissions model is not yet decided, but the redesign should not assume "one lone expert user forever" and should read cleanly to someone encountering it for the first time.

## Product Purpose

Deskholt is an affiliate content/comparison site for home-office and desk setup products (standing desks today; ergonomic chairs, lighting, cable management as categories exist in the data model). It aggregates multi-store prices (Amazon, Walmart, Target, etc.) and product specifications to help shoppers pick gear, and earns affiliate commission on outbound purchase clicks.

The Admin panel is the internal tool that makes the public catalog possible: creating Products, filling in detailed specifications (an attribute engine with per-category required/optional fields), managing publication lifecycle (Draft/Active/Blocked/Archived) and search-index visibility, and (a feature in progress) managing AffiliateLink offers (merchant, price, stock, tracking URL) per product.

## Positioning

Unlike a single-retailer product page, Deskholt's differentiated mechanism is cross-merchant price comparison plus a structured attribute/specification system (dimensions, load capacity, materials, certifications, etc.) that a single retailer listing doesn't normalize or compare across brands.

## Operating Context

- The Admin panel is where the site owner (and future collaborators) does the actual day-to-day work of growing the catalog: entering new products, filling in specs against category-specific attribute requirements, publishing/unpublishing, and (upcoming) entering affiliate offer data (price, merchant, stock).
- This work is currently bottlenecked on a developer for anything the Admin UI doesn't yet expose (e.g., affiliate link price entry was only possible via a one-off script until very recently) — a recurring theme is closing gaps so admin work is fully self-service.
- Products can have many specification rows (seen up to ~30 attribute rows per product across product-level and variant-level scopes), so data-dense forms are a normal, expected part of this surface, not an edge case.
- No real Amazon Associates (or other network) affiliate tag exists yet — the site is not live/registered for affiliate programs, so `tracking_url` values are placeholders pending real account approval. This is a known, temporary constraint, not something the Admin UI needs to hide or work around specially.

## Capabilities and Constraints

- Auth: single shared `ADMIN_PASSWORD` env var, session cookie — no per-user identity today. A future multi-person model is expected but undecided (open decision, not to be invented here).
- Data model (Prisma): `Product` (status lifecycle, is_indexed, is_sustainable, category/brand relations), `AffiliateLink` (network, price, raw/tracking URL, stock, priority — CRUD UI for this is in progress separately), `Category`/`Brand`, product attributes via an "Attribute Engine" (per-category required/optional specification schema, with source URL/type/confidence metadata per value), `Click` (affiliate click tracking).
- Existing Admin routes: `/admin/login`, `/admin/products` (list + publish/index controls), `/admin/products/new` (create), `/admin/products/[id]/specifications` (attribute entry form).
- A dark/light theme toggle scoped to `/admin/*` (CSS `data-theme` attribute strategy, Tailwind selector-based dark mode) was just implemented and verified working — the user has now chosen a **full redesign** of the Admin visual system rather than building on this, so the current implementation should be treated as evidence/anti-reference only, not preserved.
- Public site (`/`, `/products/[slug]`, `/category/[slug]`) has its own separate, already-rebranded "paper/ink" visual identity and is explicitly **out of scope** for this Admin redesign — must not be touched or affected.
- The redesign's code will be handed to ChatGPT to implement (not this assistant), from a written plan/spec — so the deliverable of this Impeccable engagement is design direction + a plan, not direct code changes in this session.

## Brand Commitments

- Product name: **Deskholt**. Tagline seen on the public site: "Curated Home-Office & Desk Setup Hub" / "Curated Home-Office & Desk Setup Intelligence". Has a logo mark (visible in the public header).
- No fabricated legal, testimonial, or review content anywhere in the product — a standing rule from prior work on this project. This applies to Admin UI copy too (no fake sample data implying real users/reviews exist yet).
- Public site already carries an affiliate-disclosure banner ("As an affiliate, Deskholt may earn a commission from qualifying purchases at no extra cost to you.") — Admin doesn't need this, but it signals the brand's transparency posture.

## Evidence on Hand

- Real seed product data exists (`prisma/seed.ts` and later batches) — real product names/specs researched manually, not scraped/fabricated, per project constitution.
- No real affiliate network account/tag yet for any merchant (Amazon, Walmart, Target, etc.) — tracking URLs are placeholders. State this plainly if the redesign touches any offer/pricing copy; do not imply live commission tracking exists.
- No customer-facing testimonials, press mentions, or third-party proof exist for Deskholt itself (it aggregates *product* sentiment/specs, not site testimonials) — do not invent any for Admin UI mockups (e.g., no fake "logged in as [name]" avatars implying a real team).

## Product Principles

1. **Self-service over developer bottleneck.** Every piece of catalog data (product identity, specs, and now affiliate offers) should be enterable by an admin through the UI, without needing a developer to run a script.
2. **Data density is normal, not an exception.** Specification forms can have 20–30+ fields per product; the design must stay scannable and fast to fill at that density rather than assuming short forms.
3. **Built for more than one person, eventually.** Even though today's Admin has one operator, avoid designs that only make sense to someone who memorized the system (e.g., unlabeled icon-only actions, no empty/first-run guidance) since collaborators are expected to join.
4. **Truthful by default.** No fabricated data, testimonials, or status claims (e.g., no fake "3 people editing" presence indicators, no invented affiliate revenue numbers) — reflect real, current system state only.
5. **Public site and Admin are separate visual worlds.** Nothing in this redesign should change or depend on the public "paper/ink" site identity.

## Accessibility & Inclusion

No specific standard has been mandated by the user. Prior work on this project has kept focus-visible states and readable contrast in both themes as a baseline expectation; carry that forward as a floor, not a ceiling, for the redesign.
