# Real Seed Data (Batch 1) — Design

**Date:** 2026-08-11
**Status:** Approved

## Context

Deskholt currently ships with 4 sample products in `prisma/seed.ts`, all using placeholder
Amazon tracking links (`?tag=deskholt-20`, a fake tag) and Unsplash stock photos. Per
Stage-0.md, the roadmap's next step after DB/Next.js initialization is importing real seed
data. The site owner does not yet have an approved Amazon Associates account or a
pre-researched product list, so this batch focuses on compiling real, verifiable product
data now and wiring in the real affiliate tag later as a single find-and-replace.

## Scope

- 20 real products across the 5 core home-office categories already used by the schema:
  `standing-desks`, `ergonomic-chairs`, `lighting`, `cable-management`, `monitor-accessories`
  (~4 products per category).
- Single network per product for this batch: `amazon` only. Walmart/Target/Impact are
  skipped — no accounts exist for those networks yet, so no fabricated links.
- This is Batch 1 of the larger 100–200 product goal from Stage-0.md Step 3; later batches
  repeat this same process.

## Data Sourcing

- Product name, indicative price, and specs are gathered via web search of real, in-market
  products (e.g. Uplift, Fully, Herman Miller, Steelcase, BenQ, Anker) — manual research and
  entry, not bulk HTML scraping, per Constitution Principle II.
- `raw_url`: the real public Amazon product URL for that item (no affiliate tag).
- `tracking_url`: same URL with a placeholder tag appended — `?tag=deskholt-pending` — so
  every row can be bulk find-replaced with the real Associates tag in one pass once the
  account is approved.
- `upc_code`: left blank where not publicly findable; not fabricated.
- `is_sustainable`: set `true` only when the product's own listing/spec sheet states
  recycled/sustainable materials — not inferred or guessed.

## Images

Amazon product images are not hotlinked (breaks ToS, links rot). Continue using
topic-appropriate Unsplash stock photos, consistent with the existing 4 sample products,
until real product photography/licensed images are available (tracked as future work, not
in this batch).

## Implementation

- Rewrite `prisma/seed.ts` to define 20 real products (same code shape as today: one
  `prisma.product.create` per item with nested `affiliate_links.create`).
- Run `npm run db:seed` to repopulate `dev.db`.
- Verify by running `npm run dev` and checking home, `/category/[slug]`,
  `/products/[slug]`, and `/go/[slug]` render correctly against the new data.

## Explicitly Out of Scope

- Getting an Amazon Associates account approved (separate, non-code task for the site owner).
- Building the Admin Panel (next subsystem after this).
- Multi-network price comparison / Entity Matching (needs UPC data + multiple network
  accounts — later stage per Constitution's Entity Matching constraint).
- Batches 2+ toward the full 100–200 product target.
