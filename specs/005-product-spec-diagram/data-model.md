# Phase 1 Data Model: Product Spec-Diagram Fallback Image

No new Prisma models or columns. This document describes the derived shapes used internally by
the feature, sourced entirely from existing `Product` and `ProductAttribute` rows.

## Existing entities used (unchanged)

- **Product** (existing): `slug`, `image_url`, `category` fields are read; `image_url` is
  written through the existing product-edit Server Action, exactly as for a real photo upload.
  No new field.
- **ProductAttribute** (existing): read at two different scopes, matching each key's actual
  scope in `prisma/seed-standing-desk-attributes.ts` (verified against the schema, not assumed):
  Product-scope (`variant_id IS NULL`) for `min_height_in`, `max_height_in`, `max_load_lb`;
  Variant-scope (`variant_id` set) for `desktop_width_in`, `desktop_depth_in`, read from the
  product's first active `ProductVariant` (`is_active = true`, earliest `created_at`) — the same
  variant `loadSpecificationData()` already treats as canonical for a single-variant product.
  All rows filtered to `confidence = 'VERIFIED'`. No new field.

## Derived shape: `DiagramEligibility`

Computed by `productDiagram.ts`, not persisted.

```text
DiagramEligibility =
  | { eligible: true; dimensions: DiagramDimensions }
  | { eligible: false; missing: string[] }   // list of missing/unverified required keys

DiagramDimensions = {
  desktopWidthIn: number
  desktopDepthIn: number
  minHeightIn: number
  maxHeightIn: number
  maxLoadLb: number
  // optional enrichment, included only when present and VERIFIED — never required
  frameColor?: string
  desktopMaterial?: string
}
```

**Validation rule (FR-001/FR-003)**: `eligible: true` requires all five required fields to exist
as `confidence = 'VERIFIED'` `ProductAttribute` rows for the given product, each at its real
scope: `minHeightIn`, `maxHeightIn`, `maxLoadLb` as Product-scope rows (`variant_id IS NULL`);
`desktopWidthIn`, `desktopDepthIn` as Variant-scope rows (`variant_id` set) on the product's
first active `ProductVariant`. If a product has no active `ProductVariant` at all, treat
`desktopWidthIn`/`desktopDepthIn` as missing (not an error) — the result is `eligible: false`
with both keys listed in `missing`. Any missing or non-VERIFIED required field makes the whole
result `eligible: false`.

## Derived shape: `ImageOrigin`

Computed wherever `Product.image_url` is read for display or structured data — not persisted.

```text
ImageOrigin = 'REAL_PHOTO' | 'GENERATED_DIAGRAM'

isDiagramUrl(imageUrl: string): boolean
  // true iff imageUrl starts with the diagram route's path prefix, e.g. '/api/product-diagram/'
```

**State transitions**: A product starts with whatever `image_url` it has today (stock
placeholder or real photo → `REAL_PHOTO` per this derivation, since it is not diagram-origin).
Setting `image_url` to the diagram route's path moves it to `GENERATED_DIAGRAM`. Setting
`image_url` to any other URL (a real photo) moves it back to `REAL_PHOTO` — this is the existing
product-edit flow, unchanged (FR-006).

## Contract-bearing values

`DiagramDimensions` values are formatted for on-image display; no unit conversion is introduced
(values are already stored in the canonical imperial units per Blueprint §17, so the diagram
renders them as-is: inches, pounds).
