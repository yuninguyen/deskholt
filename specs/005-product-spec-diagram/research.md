# Phase 0 Research: Product Spec-Diagram Fallback Image

No Technical Context fields were left as `NEEDS CLARIFICATION`; this document records the
rationale and alternatives considered for the decisions already made in `plan.md`, per Phase 0
convention.

## Decision 1: SVG built with a plain template function, no rendering library

- **Decision**: Build the diagram as a server-side string template producing raw
  `<svg>...</svg>` markup, served by a Route Handler with `Content-Type: image/svg+xml`.
- **Rationale**: The diagram content is simple (a rectangle, a handful of straight dimension
  lines, numeric/unit labels) and does not need a charting/rendering library. The repo has no
  existing `@vercel/og`/Satori/canvas dependency to reuse, and adding one purely for this would
  be disproportionate (Simplicity First / YAGNI — matches project's existing "no unit-conversion
  engine until proven necessary" precedent in the Blueprint).
- **Alternatives considered**:
  - `@vercel/og` (Satori-based `ImageResponse`) — rejected: adds a new dependency and a JSX→PNG
    render pipeline for output that plain SVG string templating already satisfies; PNG output
    is also unnecessary since SVG scales cleanly and is directly inspectable/diffable in tests.
  - A canvas/skia-based raster renderer — rejected: heavier dependency, raster output, no
    benefit over SVG for straight lines and text.
  - Pre-generating and storing diagram files in object storage — rejected: introduces a new
    storage/asset-management surface for content that is cheap to compute on every request from
    data already in Postgres; contradicts the spec's own assumption that no new storage entity
    is required.

## Decision 2: Diagram origin is derived from the `image_url` path, not a new column

- **Decision**: A product's image is a "diagram" if and only if `image_url` starts with the
  diagram route's own path prefix (e.g. `/api/product-diagram/`); otherwise it is treated as a
  real photo. No new `Product` column is added.
- **Rationale**: Every other required behavior (FR-005 admin origin label, FR-008 structured
  data guard, FR-009 caption) only needs a boolean "is this a diagram", and that boolean is
  already fully determined by which URL is stored. A same-origin, single-purpose route path is
  a reliable, refactor-safe discriminator and avoids a schema migration for a fact that is
  already implicit in the data.
- **Alternatives considered**:
  - New `Product.image_source` enum column (`REAL_PHOTO` / `GENERATED_DIAGRAM`) — rejected as
    unnecessary for v1: it duplicates information already recoverable from the URL, and adds a
    migration + a second place that could drift out of sync with the actual `image_url`. Revisit
    only if a future need (e.g. filtering/reporting at the database level) makes the derived
    check insufficient.
  - Storing origin in a sibling table — rejected as clear over-engineering for a single boolean.

## Decision 3: Eligibility check lives in one shared library function

- **Decision**: `src/lib/products/productDiagram.ts` exports one function that, given a
  product's current `ProductAttribute` rows, returns either the eligible dimension values or an
  ineligible result — used by both the Route Handler (to 404 instead of rendering when
  ineligible, per FR-003) and any future Admin "generate diagram" action.
- **Rationale**: Matches the repo's existing pattern of centralizing scope/validation logic in
  one module that all call sites share (e.g. `specificationRows.ts`, `productAttributeValidator.ts`)
  rather than duplicating the required-fields check in multiple places.
- **Alternatives considered**: Inlining the check directly in the Route Handler — rejected
  because the Admin readiness view (FR-005) and any future manual "regenerate" action would need
  the identical check, and duplicating it risks the two going out of sync.

## Decision 4: Structured data omits `image` entirely when the product uses a diagram

- **Decision**: When `image_url` is diagram-origin, the `ProductSchema`/JSON-LD caller passes
  `image: undefined` instead of the diagram URL (FR-008).
- **Rationale**: `schema.org`/Google Merchant guidance expects `image` to be an authentic
  product photo; asserting a technical diagram in that field risks exactly the kind of
  fabricated-data problem the Constitution's Legal & Platform Compliance principle and Blueprint
  §3 already forbid. Omitting the field is the conservative, no-new-risk default. The diagram
  still renders visually on the page (FR-001/FR-002); it is only excluded from the
  machine-readable "this is an authentic photo" claim.
- **Alternatives considered**: Including the diagram URL in `image` anyway — rejected, directly
  conflicts with FR-008 and the spec's own compliance-driven default.
