# Feature Specification: Admin Product Specifications (V1-alpha)

**Feature Branch**: `001-admin-product-specifications`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Admin Product Specifications module (V1-alpha) for Deskholt — let a content editor enter typed product specifications (attributes) for Standing Desks at /admin/products/{id}/specifications, backed by a new Attribute Engine (Brand, Category, ProductVariant, AttributeDefinition, CategoryAttribute, ProductAttribute, Merchant, MerchantProduct, Offer), added additively on top of the existing Product/AffiliateLink/Click/Conversion tables without breaking them, so the team can enter 10 real Standing Desks fast."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enter typed specs for a Standing Desk (Priority: P1)

A content editor opens a Standing Desk product in Admin and sees every attribute the
Standing Desks category defines (dimensions, mechanism, frame, desktop, warranty,
derived/questionable), grouped and pre-populated with any values already entered. They
type in a value, paste a source URL, pick a source type and confidence, and save the whole
form in one action.

**Why this priority**: This is the only capability the 10-real-product checkpoint depends
on. Without it, specs can only be entered via Prisma Studio, which the roadmap explicitly
rejects for editors.

**Independent Test**: Seed one Standing Desk product with zero attributes, open its
Specifications page, fill in the required PRODUCT-scope fields, save, and confirm the
values persist and reload correctly on next visit.

**Acceptance Scenarios**:

1. **Given** a Standing Desk product with an active Variant, **When** the editor opens
   `/admin/products/{id}/specifications`, **Then** they see one row per PRODUCT-scope
   attribute, one row per active-Variant-per-VARIANT-scope-attribute, and one
   Product-level row plus one row per active Variant for each DERIVED-scope attribute.
2. **Given** a Standing Desk product with no Variants yet, **When** the editor opens the
   Specifications page, **Then** VARIANT-scope attribute sections show a warning to create
   a Variant first instead of rendering unusable rows.
3. **Given** a row where the editor enters a value but leaves Source URL/Type blank,
   **When** they save, **Then** the value is persisted with `confidence = UNVERIFIED` and
   no error is raised (source fields are optional per row).
4. **Given** a row where the editor enters a Source URL but leaves Value blank, **When**
   they save, **Then** the whole save is rejected with a clear per-row error and no
   partial write occurs.
5. **Given** an existing verified row, **When** the editor clears its Value field entirely
   and saves, **Then** the corresponding `ProductAttribute` record is deleted.
6. **Given** the editor sets Confidence to `VERIFIED` on a row, **When** they save,
   **Then** `verifiedAt` is set to the save time; **when** they set it to `LIKELY` or
   `UNVERIFIED`, **Then** `verifiedAt` is cleared to null.

---

### User Story 2 - See completeness at a glance (Priority: P2)

While filling in a product's specs, the editor can see how many required attributes are
still missing so they know when the product is "done enough" to move to the next one.

**Why this priority**: Without a completeness signal, editors have no way to know when
they can stop and move to the next of the 10 products, and QA has no way to spot
half-finished products later.

**Independent Test**: Seed a product with 5 of 7 required PRODUCT-scope attributes filled
in; open the Specifications page and confirm the completeness indicator reads 5/7 (or the
equivalent percentage) without needing any other page.

**Acceptance Scenarios**:

1. **Given** a Standing Desk product, **When** the editor views the Specifications page,
   **Then** they see a count of required targets met vs. total required targets, counting
   one target per required PRODUCT attribute and one target per required VARIANT attribute
   per active Variant.
2. **Given** the editor fills in a previously-missing required field and saves,
   **When** the page reloads, **Then** the completeness count increases accordingly.

---

### User Story 3 - Reuse the same validation for future bulk import (Priority: P3)

A developer building the future CSV import feature can call the same validation logic the
Admin form uses today, without duplicating the scope/type/category rules.

**Why this priority**: Lower priority because CSV import itself is out of scope for this
feature, but the validator must be built as a standalone, reusable module from day one to
avoid the two-implementations-drift risk the roadmap explicitly calls out.

**Independent Test**: Call the validator module directly (outside any HTTP request) with a
few valid and invalid `ProductAttribute` inputs and confirm it returns the correct
`{ valid, errors }` result without touching the Admin UI.

**Acceptance Scenarios**:

1. **Given** an attribute input whose `attributeDefinitionId` does not belong to the
   product's category, **When** the validator runs, **Then** it returns an error naming
   the mismatched category.
2. **Given** a VARIANT-scope attribute input with no `variantId`, **When** the validator
   runs, **Then** it returns a scope-mismatch error.
3. **Given** a variant input whose `variantId` belongs to a different product,
   **When** the validator runs, **Then** it returns a cross-product mismatch error.

### Edge Cases

- What happens when two browser tabs save the same product's specs concurrently? Last
  write wins per row; this is acceptable for a 1-3 person editor team (per Constitution
  Principle III — flat permissions, no review pipeline).
- What happens when an editor deletes a Variant that already has ProductAttribute rows?
  Out of scope for this feature (no Variant-delete UI is introduced here); existing rows
  would become orphaned only if deletion happens directly in the database.
- What happens when an ENUM attribute's stored value no longer appears in
  `allowedValues` (definition changed after the value was saved)? The form must still
  display the stored value and flag it as invalid rather than silently dropping it.
- What happens when a product's Category has zero CategoryAttribute rows (misconfigured
  category)? The Specifications page shows an empty state rather than erroring.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide `/admin/products/{id}/specifications` rendering one row
  per applicable attribute for the product's category, grouped by PRODUCT, VARIANT (per
  active Variant), and DERIVED (Product-level + per active Variant).
- **FR-002**: System MUST allow entering, per row: Value, Source URL, Source Type,
  Confidence.
- **FR-003**: System MUST save the entire form as a single action (per Constitution
  Principle IV: full-page redirect after save, no silent AJAX).
- **FR-004**: System MUST leave a row with no value untouched (no record created) when
  saved blank.
- **FR-005**: System MUST delete an existing `ProductAttribute` record when its value is
  cleared and the form is saved.
- **FR-006**: System MUST reject the save (with a per-row error, no partial write) when a
  row has a Source URL/Type but no Value.
- **FR-007**: System MUST set `verifiedAt` to the save timestamp when Confidence is
  `VERIFIED`, and clear it to null for `LIKELY`/`UNVERIFIED`.
- **FR-008**: System MUST validate every non-blank row through one shared validator (used
  by both the Admin form and, later, CSV import) before writing to the database, checking:
  the attribute definition exists; the attribute belongs to the product's category; the
  scope/variantId combination is valid (PRODUCT ⇒ no variantId, VARIANT ⇒ variantId
  required, DERIVED ⇒ either); when a variantId is present, that variant belongs to this
  product; and exactly one value column matches the attribute's data type (with ENUM
  values checked against the allowed list).
- **FR-009**: System MUST enforce at most one PRODUCT-level value per (product, attribute)
  and at most one VARIANT-level value per (variant, attribute) at the database level, not
  only in application code.
- **FR-010**: System MUST display a completeness indicator (required targets met / total
  required targets) on the Specifications page.
- **FR-011**: System MUST warn the editor and avoid rendering unusable VARIANT-scope rows
  when the product has no active Variant yet.
- **FR-012**: System MUST NOT alter or remove any existing `Product`, `AffiliateLink`,
  `Click`, or `Conversion` data, fields, or public-facing routes (`/product/[slug]`,
  `/go/[slug]`) as a side effect of adding this feature.
- **FR-013**: System MUST scope this feature to the Standing Desks category only; no other
  category's attribute schema is seeded or required by this feature.
- **FR-014**: Admin routes introduced by this feature MUST NOT distinguish user roles
  (per Constitution Principle III) — any authenticated admin session can edit specs.

### Key Entities

- **Brand**: A manufacturer (e.g. FlexiSpot). Referenced optionally by Product.
- **Category**: A product category (e.g. Standing Desks) with a tree structure; defines
  which attributes apply via CategoryAttribute.
- **ProductVariant**: A size/color/material variation of an existing Product; VARIANT-scope
  attribute values are entered per active Variant.
- **AttributeDefinition**: A reusable attribute (key, label, scope, data type, unit,
  allowed values for ENUM) shared across categories.
- **CategoryAttribute**: Join table declaring which AttributeDefinitions apply to a
  Category, whether required, and display order.
- **ProductAttribute**: A single typed value for one (product[, variant], attribute)
  combination, with source URL/type, confidence, and verified timestamp.
- **Merchant / MerchantProduct / Offer**: Deferred to a later feature; not built by this
  spec, but the schema note below reserves room for them since they appear in the same
  migration family.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: An editor can enter all specifications for one Standing Desk product
  (~30-40 attributes across Product/Variant/Derived rows) in a single form session without
  needing Prisma Studio or developer help.
- **SC-002**: The team can enter all 10 test Standing Desks' specifications within the V1
  checkpoint timeframe using only this Admin page.
- **SC-003**: Zero existing product, price, click, or conversion records are altered or
  lost after this feature ships (verified by row-count and spot-check comparison before
  and after).
- **SC-004**: 100% of invalid save attempts (wrong scope, wrong category, mismatched
  variant, source-without-value) are caught before any database write, with zero silent
  data corruption in manual testing.
- **SC-005**: The completeness indicator matches a manual count of required-fields-filled
  for at least 3 spot-checked products.

## Assumptions

- The existing `Product` table (String `cuid` id, flat `category` string field) is kept
  exactly as-is. The new Attribute Engine tables (`Brand`, `Category`, `ProductVariant`,
  `AttributeDefinition`, `CategoryAttribute`, `ProductAttribute`) are added as a new,
  additive layer. `ProductAttribute.productId` and `ProductVariant.productId` reference
  the existing `Product.id` (String), not a new Int id — this avoids rewriting
  `/product/[slug]`, `/go/[slug]`, `AffiliateLink`, `Click`, and `Conversion`, all of which
  key off the current String id. `Merchant`/`MerchantProduct`/`Offer` from the source
  design are deferred; `AffiliateLink` continues to serve that role for now.
- The datasource moves from SQLite to PostgreSQL (already required by `.env` and by the
  two partial unique indexes this feature depends on for real uniqueness enforcement).
  This is an infrastructure prerequisite already completed as part of this feature's
  setup, not a future dependency.
- One new `Category` row ("Standing Desks") is created and linked to existing Standing
  Desk products by matching their current `category` string field; the string field
  itself is left untouched (existing public pages keep working unmodified).
- No admin authentication system exists yet in this repo. This feature assumes a minimal
  session gate is added (or a placeholder marked clearly as temporary) sufficient to keep
  `/admin/*` off public search/navigation; building a full auth system is out of scope —
  only enough gating to not expose an open write endpoint.
- "Active Variant" means `ProductVariant.isActive = true`.
- Users are the 1-3 person Deskholt content team (per Constitution Principle III); no
  concurrent-editing conflict resolution beyond last-write-wins is required.
