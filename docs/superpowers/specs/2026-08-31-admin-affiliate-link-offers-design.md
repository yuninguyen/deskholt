# Admin AffiliateLink CRUD (Offers Page) — Design

**Date:** 2026-08-31
**Status:** Approved

## Context

The Admin UI lets an admin create a Product and fill in its specifications, but there is no
way to set its price or merchant link — that data (`AffiliateLink`: network, price, raw/
tracking URL, stock, priority) can currently only be written via a one-off script. This gap
was found through direct dogfooding of the Admin UI ("I couldn't find where to enter the
price"), not speculated — it's the last piece needed to make "admin creates a product without
a developer" actually true end-to-end. Builds on [[2026-08-31-admin-theme-refresh-design]]
(built directly against its theme tokens, not the old dark-only classes).

## Scope

- A new admin sub-page, `/admin/products/[id]/offers`, following the same shape as the
  existing `/admin/products/[id]/specifications` sub-resource page: list existing
  `AffiliateLink` rows for the product, each as an editable form; a separate "Add offer" form
  below to create a new one.
- **Create** and **Update** only — no delete. If an offer is permanently discontinued, the
  admin unchecks "In stock" rather than removing the row (schema already ranks in-stock links
  first via `orderBy: [{ is_in_stock: 'desc' }, { priority_order: 'asc' }]` in `/go/[slug]`).
- Linked from `/admin/products` (table row, per the theme-refresh spec) as an "Offers (N)"
  action next to "Edit specs".

## Fields

| Field | Type | Notes |
|---|---|---|
| `network` | fixed dropdown | `amazon \| walmart \| target \| awin \| impact \| cj` — matches the comment already in `prisma/schema.prisma`. Fixed set (not free text) so it can't drift from what `selectAffiliateLink` in `src/lib/clickTracking.ts` matches against. |
| `price` | number input | required, must be > 0. |
| `raw_url` | url input | required, must be a parseable URL. |
| `is_in_stock` | checkbox | default checked. |
| `priority_order` | number input | optional, default `1` if omitted, must be a positive integer. |

`tracking_url` is **not** a form field — see below.

## `tracking_url` generation

The site has no real Amazon Associates tag (or any other network's affiliate account) yet —
confirmed by the `deskholt_no_affiliate_tag_yet` memory from a prior session. `prisma/seed.ts`
already established the placeholder convention for Amazon: `${raw_url}?tag=deskholt-pending`.
This design reuses that convention uniformly for every network (not just Amazon), since none
of them have real tracking set up: `tracking_url` is computed server-side as `raw_url` plus
`?tag=deskholt-pending` (or `&tag=...` if `raw_url` already has a query string). This is a
placeholder to be revisited — noted with an inline comment in the command file — once real
merchant affiliate accounts exist per network.

## Architecture

Follows the same layering already used by `productCreationCommand.ts` /
`specificationSaveAction.ts`:

- `src/lib/products/affiliateLinkCommand.ts` (new) — pure, testable logic:
  - `parseCreateAffiliateLinkInput(formData)` / `executeCreateAffiliateLink(store, productId, input)`
  - `parseUpdateAffiliateLinkInput(formData)` / `executeUpdateAffiliateLink(store, linkId, input)`
  - `AffiliateLinkStore` interface + `createPrismaAffiliateLinkStore(prisma)`
  - `deriveTrackingUrl(rawUrl)` helper implementing the placeholder-tag rule above.
- `src/app/(admin)/admin/products/[id]/offers/actions.ts` (new) — `'use server'` wiring:
  `createAffiliateLinkAction`, `updateAffiliateLinkAction`, mirroring
  `admin/products/actions.ts`'s `requireAdminSession` + redirect-with-`?error=` pattern.
- `src/app/(admin)/admin/products/[id]/offers/page.tsx` (new) — loads the product (404 via
  `notFound()` if missing, matching the specifications page) and its `affiliate_links`
  ordered by `priority_order`; renders the list + add form.

## Validation & Errors

Same shape as `productCreationCommand.ts`: parsing throws on invalid input, the action
catches and redirects to `?error=invalid-input`; domain-level failures return a typed
`{ ok: false, reason }` result. Reasons: `invalid-input` (bad price/URL/network),
`not-found` (update targets an `AffiliateLink` that doesn't exist or doesn't belong to this
product). Errors render via the same `?error=` query-param banner pattern already used on
`/admin/products/new` and `/admin/products/[id]/specifications`.

## Revalidation

`revalidatePath('/')` (offers affect public price/stock display — see
`product-card-zero-offers-empty-state` fix) plus revalidation of the offers page itself, same
pattern as `productPublishingAction`.

## Testing

- `tests/affiliateLinkCommand.test.ts` (new): create happy path, update happy path, price
  must be `> 0`, network must be one of the fixed set, `raw_url` must be a valid URL,
  `deriveTrackingUrl` appends `?tag=` when the raw URL has no query string and `&tag=` when
  it does, update against a non-existent/mismatched `linkId` returns `not-found`.
- No new E2E test — the surrounding form/redirect/error-banner pattern is already covered by
  existing specifications-page tests; this reuses the same mechanism.

## Explicitly Out of Scope

- Delete.
- Free-text network / adding new merchants beyond the fixed six.
- Real per-network affiliate tag configuration (env var, per-network tag lookup) — still a
  single hardcoded placeholder string, exactly as today's `prisma/seed.ts`.
- Bulk-editing offers across multiple products.
