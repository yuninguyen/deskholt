# Feature Specification: Product Spec-Diagram Fallback Image

**Feature Branch**: `005-product-spec-diagram`

**Created**: 2026-09-17

**Status**: Draft

**Input**: User description: "Product spec-diagram fallback image: for Standing Desk products that have complete VERIFIED structured attributes (desktop dimensions, height range, max load, material, frame color) but no real manufacturer/retailer product photo, generate a DeskHolt-branded technical spec diagram (dimension-line style, per blueprint §4 "Blueprint Blue" visual identity) to use as the product's image_url instead of a generic stock placeholder. This must not misrepresent the product as a real photo — it should read clearly as an editorial/technical diagram, consistent with blueprint §3's "DeskHolt technical diagrams" visual category. Initial target: apply to the 5 production NEEDS IMAGE standing desks (SHW, Veken 47.2in, Claiks, FEZIBO, OffiGo) identified in the Neon production catalog audit, all of which already have 7/7 completeness on VERIFIED product-level attributes."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor closes the image gap for a data-complete product (Priority: P1)

A content editor has a Standing Desk product with fully verified specifications (dimensions,
height range, load capacity) but only a generic stock photo shared across unrelated
products. The editor triggers generation of a DeskHolt technical diagram for that product,
which becomes the product's displayed image in place of the stock photo.

**Why this priority**: This is the entire point of the feature — turning data-complete,
image-blocked products into publish-ready products without waiting on manufacturer/retailer
photo rights or Amazon API access.

**Independent Test**: Pick one of the 5 initially targeted products (all already at 7/7
VERIFIED-attribute completeness), generate its diagram, and confirm the product's image is
now a diagram unique to that product's own dimensions — not the shared stock URL used by
other products.

**Acceptance Scenarios**:

1. **Given** a Standing Desk product with all required VERIFIED dimensional attributes present,
   **When** the editor requests diagram generation, **Then** the product's image reflects that
   product's own stored dimensions/specs and no longer matches the generic stock placeholder
   URL shared by unrelated products.
2. **Given** a product whose diagram was generated, **When** the editor later obtains a real
   manufacturer/retailer photo for that product, **Then** the editor can replace the diagram
   with the real photo through the same image field, with no special migration step.

---

### User Story 2 - Visitor is never misled into thinking the diagram is a real product photo (Priority: P1)

A site visitor or Google search-result viewer looking at a product page or listing sees the
diagram and can tell, without confusion, that it is a DeskHolt-produced technical
illustration — not an official photo of the physical product.

**Why this priority**: This directly protects DeskHolt's non-hands-on positioning and
product-identity trust (per the project's editorial policy against showing something the
user is not actually about to receive). Getting this wrong is a trust and platform-compliance
risk, not just a cosmetic one, so it carries equal priority to User Story 1.

**Independent Test**: Show the generated diagram to someone unfamiliar with the feature and
confirm they identify it as a technical diagram rather than a product photo, without being
told in advance.

**Acceptance Scenarios**:

1. **Given** a generated diagram is displayed on a product page, **When** a visitor views it,
   **Then** the diagram is visually and contextually distinguishable from an official product
   photograph (consistent DeskHolt "Blueprint Blue" editorial style: dimension lines, neutral
   background, mono typography for data — not a photorealistic rendering).
2. **Given** a product uses a generated diagram, **When** the page is viewed, **Then** nothing
   on the page or in its underlying data claims the diagram is an official manufacturer or
   retailer photo.

---

### User Story 3 - Editor can tell at a glance which products still need a real photo (Priority: P2)

While reviewing catalog readiness, an editor can distinguish, without opening each product,
which products are using a generated diagram (still wanted: a real photo eventually) versus
an authentic manufacturer/retailer photo.

**Why this priority**: Without this, a diagram could quietly become a permanent substitute
that never gets revisited when real photo rights become available (e.g. after Amazon
Associates/PA-API access is active), silently freezing product pages at a lower visual
quality than necessary.

**Independent Test**: Open the existing catalog readiness view and confirm diagram-backed
products are labeled distinctly from real-photo products, without needing to inspect the
image URL directly.

**Acceptance Scenarios**:

1. **Given** a mix of diagram-backed and real-photo products, **When** an editor reviews
   catalog readiness, **Then** each product's image origin (real photo vs. generated diagram)
   is visible without opening the product record.

---

### Edge Cases

- What happens when a product is missing one or more of the required VERIFIED dimensional
  attributes (e.g. no confirmed max load, or height range incomplete)? The system MUST NOT
  generate a diagram for that product; the product keeps its current image state unchanged.
- What happens when a product's underlying VERIFIED attribute values change after a diagram
  was already generated (e.g. a re-verification corrects a dimension)? The diagram MUST
  reflect the product's current stored values whenever it is (re)generated or displayed —
  it must never contradict the specification table shown elsewhere on the same page.
- What happens when a product later gains additional Variant-level detail (e.g. frame color)
  after its diagram was generated from Product-level data only? Regenerating the diagram MAY
  incorporate the new detail, but its absence MUST NOT block generation for the Product-level
  data that is already complete.
- What happens if diagram generation is attempted for a category other than Standing Desks
  (e.g. chairs, lighting) that has no comparable structured attribute schema? The system MUST
  decline to generate a diagram rather than produce one with fabricated or missing values.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST be able to produce a DeskHolt-branded technical diagram for a
  Standing Desk product that has complete VERIFIED values for its core physical
  attributes (desktop width, desktop depth, height range minimum and maximum, maximum load
  capacity).
- **FR-002**: The diagram MUST use DeskHolt's established editorial visual identity
  (Blueprint Blue palette, dimension-line presentation, mono typography for numeric data) and
  MUST NOT attempt to visually resemble a photorealistic manufacturer/retailer product photo.
- **FR-003**: System MUST NOT generate a diagram for a product missing any of the core
  physical attributes listed in FR-001; that product's image MUST remain in its current state
  (e.g. the shared stock placeholder) until either the missing data is verified or a real
  photo becomes available.
- **FR-004**: The diagram's displayed values MUST be sourced directly from the product's
  currently stored attribute values at the time of generation or display, so the diagram can
  never show a number that contradicts the product's own specification table.
- **FR-005**: Editors MUST be able to distinguish, from the existing catalog readiness view,
  which products currently use a generated diagram versus an authentic photo, without opening
  each product individually.
- **FR-006**: Replacing a generated diagram with a real manufacturer/retailer photo MUST use
  the same product image field/workflow already used for real photos today — no separate
  migration procedure.
- **FR-007**: Generating, displaying, or replacing a diagram MUST NOT modify the product's
  underlying `Product` or `ProductAttribute` records as a side effect.
- **FR-008**: The diagram MUST NOT be represented in the page's structured product data
  (e.g. `Product`/`Offer` schema markup consumed by search engines and shopping surfaces) in a
  way that asserts it is an authentic product photograph; structured "image" data MUST either
  be omitted or explicitly scoped to reflect that no authentic photo currently exists.
- **FR-009**: Any diagram or its surrounding presentation MUST make clear, through visible
  labeling or caption text, that it is a DeskHolt-produced technical illustration and not an
  official manufacturer/retailer photo.

### Key Entities

- **Product**: Existing entity gains a distinguishable image-origin state — "authentic photo"
  vs. "DeskHolt technical diagram" — used to decide diagram eligibility and to drive the
  editor-facing origin label described in FR-005. No change to Product's existing identity
  fields.
- **ProductAttribute (VERIFIED, Product-scope)**: The data source for the diagram's displayed
  values (desktop width/depth, height range, max load, and optionally material/frame color).
  The diagram is a derived visual representation of this already-existing data, not a new
  fact source.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 5 initially targeted Standing Desk products (currently sharing one of two
  generic stock placeholder photos) each display a distinct, product-specific image after
  this feature ships — none of the 5 still shows a stock photo shared with an unrelated
  product.
- **SC-002**: Zero products with incomplete core VERIFIED dimensional data ever receive a
  generated diagram — 100% of diagrams shown correspond to products meeting the FR-001
  completeness bar at the time of generation.
- **SC-003**: In an unprompted review, people shown a generated diagram alongside a real
  product photo correctly identify which is which in at least 95% of cases.
- **SC-004**: An editor reviewing catalog readiness can identify each product's image origin
  (diagram vs. real photo) without opening the individual product record, for 100% of
  products in the catalog.

## Assumptions

- This feature initially applies only to the Standing Desks category, and specifically to the
  5 named production products already confirmed at 7/7 VERIFIED-attribute completeness; wider
  category rollout (chairs, lighting, cable-management) is a future decision and is out of
  scope here, since those categories currently lack a comparable structured attribute schema.
- "Core physical attributes" for diagram eligibility means Product-scope desktop width,
  desktop depth, height range (min/max), and max load capacity — the same fields already
  confirmed VERIFIED for all 5 target products. Variant-level detail (frame color, material)
  is optional enrichment, not a gating requirement.
- Structured product data (schema.org / search & shopping surfaces) for these products will
  either omit the `image` field or otherwise avoid asserting the diagram is an authentic
  photo, consistent with FR-008; a photo-carrying `image` field is only used once a real
  photo exists.
- No new long-term storage entity is assumed to be required; how the diagram is produced and
  persisted (on-demand render vs. pre-generated asset) is an implementation decision left to
  the planning phase, not this specification.
- Replacing a diagram with a real photo is expected to happen product-by-product over time as
  photo rights become available (e.g. manufacturer permission, or Amazon PA-API access once
  Associates approval and affiliate tag activation are complete) — this feature does not
  depend on or block that separate effort.
