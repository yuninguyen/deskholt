# Quickstart: Product Spec-Diagram Fallback Image

Validates the feature end-to-end once implemented. Assumes local dev environment
(`.env` pointing at local `deskholt_db`), per existing repo convention.

## Prerequisites

- Local dev server running (`npm run dev`).
- A Standing Desk product with complete VERIFIED core dimensions (e.g. any of the 5 target
  production products, or an equivalent local fixture) — see `data-model.md` for the required
  field list.
- A second Standing Desk product deliberately missing one required VERIFIED field, to validate
  the ineligible path.

## Scenario 1 — Eligible product gets a diagram (User Story 1)

```powershell
curl.exe -i http://localhost:3000/api/product-diagram/<eligible-slug>
```

**Expected**: `200 OK`, `Content-Type: image/svg+xml`, body contains that product's own
dimension numbers (spot-check width/depth/height-range/max-load against the DB values).

Visit `http://localhost:3000/products/<eligible-slug>` in a browser: the hero image is the
diagram, not the shared stock placeholder, and a visible caption/label identifies it as a
DeskHolt technical diagram (FR-009).

## Scenario 2 — Ineligible product is refused, not degraded (Edge case / FR-003)

```powershell
curl.exe -i http://localhost:3000/api/product-diagram/<ineligible-slug>
```

**Expected**: `404`, no SVG body. The product's existing `image_url` (e.g. stock placeholder)
is unaffected — confirm via the product's Admin edit page that `image_url` did not change.

## Scenario 3 — Structured data omits the diagram as a photo claim (FR-008)

View page source (or fetch the page and grep) for `http://localhost:3000/products/<eligible-slug>`:

```powershell
curl.exe -s http://localhost:3000/products/<eligible-slug> | Select-String '"image"'
```

**Expected**: either no `"image"` key in the `Product` JSON-LD block, or it is present but not
set to the diagram URL — never a bare assertion that the diagram is the product's photo.

## Scenario 4 — Admin readiness view shows origin (User Story 3)

Open the existing Admin catalog/readiness list. Confirm the eligible product (now diagram-backed)
shows a distinct "Diagram" origin indicator, and a product using a real photo shows "Photo" (or
equivalent), without opening either product record.

## Scenario 5 — Replacing a diagram with a real photo requires no special step (FR-006)

Through the existing product-edit form, set `image_url` to a real photo URL for the
diagram-backed product from Scenario 1. Confirm:
- The save uses the existing Server-Action + redirect flow (no new UI).
- The product page now shows the real photo.
- The Admin readiness origin indicator now shows "Photo".
