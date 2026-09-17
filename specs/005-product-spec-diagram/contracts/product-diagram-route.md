# Contract: `GET /api/product-diagram/[slug]`

## Request

```text
GET /api/product-diagram/{slug}
```

No query parameters, no auth required (same visibility as the public product page itself; the
route only ever exposes data already shown on that product's public page).

## Responses

### 200 OK — eligible product

```text
Content-Type: image/svg+xml
Cache-Control: public, max-age=<TBD in tasks — short-to-moderate, values change when
  attributes are re-verified>

<svg ...>  -- DeskHolt Blueprint-Blue dimension-line diagram for this product's
              current VERIFIED desktopWidthIn/desktopDepthIn/minHeightIn/maxHeightIn/maxLoadLb
              (and optional frameColor/desktopMaterial when present), per data-model.md
</svg>
```

### 404 Not Found — ineligible or unknown product

Returned when:
- the slug does not match any `Product`, or
- the product exists but `DiagramEligibility.eligible` is `false` (FR-003) — i.e. missing or
  non-VERIFIED required dimensional data.

No SVG body is returned in this case (plain 404), so this route can never be pointed to by
`Product.image_url` for an ineligible product — if it ever is (e.g. stale data), the image
simply fails to load rather than rendering incomplete/fabricated values.

## Consumers

- `Product.image_url` value itself, when set to this route's path (rendered by `next/image` in
  `src/app/(public)/products/[slug]/page.tsx`, and anywhere else the product's image is shown,
  e.g. category listing cards).
- Admin readiness view, to determine `ImageOrigin` from the stored `image_url` (does not need to
  call this route — origin is derived from the URL string itself per `data-model.md`).

## Non-goals

- Not a general-purpose image proxy or CDN.
- Not authenticated/rate-limited beyond whatever applies to the rest of the public site — it
  exposes no data that is not already public on the product's own page.
