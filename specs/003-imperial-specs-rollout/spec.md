# Feature Specification: Imperial Canonical Specs + Public Specs Rollout

**Feature Branch**: `003-imperial-specs-rollout`

**Created**: 2026-08-21

**Status**: Draft

**Input**: User description: "Make the source-of-truth unit for standing-desk length/weight/speed specs match the retailer listings (Amazon, imperial: inches/pounds) instead of metric, eliminating the need for any ongoing conversion. Also wire the public Product Page to display structured spec data (label/value/unit) sourced from the Admin Specifications system, replacing the legacy freeform specs text, without regressing products that haven't been migrated to structured specs yet."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Editor enters specs in the same units as the source listing (Priority: P1)

An editor filling in a product's specifications in the Admin Specifications tab types the number exactly as the retailer (Amazon) shows it — e.g., "55" for a 55-inch desktop width, "120" for a 120 lb weight capacity — and that is the value stored, with no unit math involved anywhere in the process.

**Why this priority**: Removes the root cause of a previously identified data-entry bug (manual unit conversion mistakes). It's the entry point for all spec data, so getting this right protects every downstream use of the data.

**Independent Test**: Can be fully tested by opening the Admin Specifications tab for a standing desk product, entering a value into a length/weight/speed field, saving, and confirming the exact number entered is what's stored and redisplayed — no conversion step involved.

**Acceptance Scenarios**:

1. **Given** an editor is on the Admin Specifications tab for a length attribute (e.g., Desktop Width), **When** they type "55", **Then** the system stores 55 and labels the field's unit as inches — no conversion is performed.
2. **Given** an editor is on the Admin Specifications tab for a weight attribute (e.g., Maximum Load Capacity), **When** they type "120", **Then** the system stores 120 and labels the field's unit as pounds — no conversion is performed.
3. **Given** an editor reopens a previously saved length/weight/speed field, **When** they view it, **Then** the number shown is identical to what was originally entered (no rounding drift, since no conversion ever happens).

---

### User Story 2 - Shopper sees accurate, structured specs on the product page (Priority: P1)

A shopper viewing a product page that has been fully filled out in the Admin Specifications tab sees a clean, structured "Technical Specifications" section — sourced from the same verified data editors maintain in Admin — with dimensions and weight shown in the same units (inches, pounds) the shopper would have seen on Amazon.

**Why this priority**: This is the customer-facing payoff of maintaining structured spec data at all; without it, the Admin Specifications system produces data nobody outside the admin ever sees.

**Independent Test**: Can be fully tested by viewing the product page for a product that has structured specs saved in Admin and confirming the displayed spec rows (label, value, unit) match what's stored, in imperial units for length/weight/speed attributes.

**Acceptance Scenarios**:

1. **Given** a product has structured spec values saved via the Admin Specifications tab, **When** a shopper views its product page, **Then** the Technical Specifications section shows those values with their labels and units (e.g., "Desktop Width — 55.0 in"), not the old freeform text.
2. **Given** a product has both product-level and variant-level structured specs saved, **When** a shopper views the product page, **Then** both are shown together in one specifications section for that product's default variant.
3. **Given** an attribute has no saved value for a product, **When** a shopper views the product page, **Then** that attribute is simply omitted from the list — no blank or placeholder row is shown.

---

### User Story 3 - Existing product pages don't break during rollout (Priority: P1)

Most products in the catalog have not yet had their specs entered into the Admin Specifications system — they only have the old freeform specs text. Their product pages must keep showing that existing text exactly as before, since nothing about their listing has changed.

**Why this priority**: Without this, rolling out structured specs would blank out the specifications section on the majority of already-published product pages — a visible regression for customers, not an improvement.

**Independent Test**: Can be fully tested by viewing the product page for a product that has old freeform specs text but no structured specs saved, and confirming it displays exactly as it does today.

**Acceptance Scenarios**:

1. **Given** a product has old freeform specs text but zero structured spec values saved, **When** a shopper views its product page, **Then** the Technical Specifications section shows the old freeform text, unchanged.
2. **Given** a product has at least one structured spec value saved, **When** a shopper views its product page, **Then** the structured specs are shown instead of the old freeform text for that product.

---

### User Story 4 - Already-entered spec data is converted once, automatically (Priority: P3)

The handful of length/weight/speed spec values already entered in the Admin Specifications tab (before this change) are automatically updated to the new imperial numbers, so editors don't have to find and manually retype them.

**Why this priority**: Protects existing work from being silently lost or left in an inconsistent (wrong-unit) state, but affects a small, known set of already-entered values rather than blocking new work.

**Independent Test**: Can be fully tested by comparing a previously-saved length/weight/speed value (in its old metric number) against the same field after rollout and confirming it now shows the equivalent imperial number representing the same real-world measurement.

**Acceptance Scenarios**:

1. **Given** a spec value was saved before this change (e.g., 1397 recorded as millimeters), **When** an editor views that field after rollout, **Then** it shows the equivalent imperial number (e.g., 55.0, labeled inches) representing the same real-world measurement.

---

### Edge Cases

- What happens to a product that has old freeform specs text AND some (but not all) structured specs saved? The structured specs take over as soon as at least one value exists for that product (per User Story 3, Scenario 2) — this is treated as "migration in progress," and only the structured section is shown, potentially with fewer visible rows than the old text had until the editor finishes entering the rest.
- What happens when an attribute's unit is not length/weight/speed (e.g., decibels, months, minutes, plain counts, yes/no values, category options)? It is entered and displayed unchanged — this feature does not touch non-convertible attributes.
- What happens to the old freeform specs data for a product once it has structured specs? It is left stored as-is (not deleted); it simply stops being the source shown to shoppers for that product.
- What happens if a product's structured specs include a variant-level attribute but the product has multiple variants? Only the specs for the product's default/first active variant are shown alongside the product-level specs, consistent with how the product page already presents a single default view.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: For every length, weight, and speed spec attribute currently defined in metric units, the system MUST change its unit of record to the corresponding imperial unit (inches for length/speed, pounds for weight), so editors enter and view values in the same units as the source retailer listings.
- **FR-002**: System MUST NOT require any unit conversion, in either direction, as part of normal editor entry or normal shopper viewing of these attributes going forward.
- **FR-003**: All previously saved values for the affected length/weight/speed attributes MUST be updated once, automatically, to the equivalent imperial number representing the same real-world measurement — with no loss of data and no manual re-entry required.
- **FR-004**: Attributes whose unit is not length, weight, or speed (e.g., decibels, months, minutes, counts, yes/no values, category options) MUST remain entirely unaffected by this change.
- **FR-005**: The Public Product Page MUST display a structured Technical Specifications section (label, value, unit per row) sourced from the same data editors maintain in the Admin Specifications tab, for any product that has at least one saved structured spec value.
- **FR-006**: For a product with zero saved structured spec values, the Public Product Page MUST continue displaying its existing freeform specifications text exactly as it does today.
- **FR-007**: The structured Technical Specifications section MUST include both product-level spec values and the values for the product's default/first active variant, presented together in one list.
- **FR-008**: The structured Technical Specifications section MUST omit any attribute that has no saved value for the product (no blank or placeholder rows).
- **FR-009**: The structured Technical Specifications section MUST NOT be shown at all if a product has zero saved structured spec values (consistent with the existing empty-state behavior of the section it replaces).
- **FR-010**: This feature MUST NOT change which spec fields exist, which are required, or how spec completeness/readiness is determined for a product — it only changes the unit of record for a subset of fields and how already-saved data is presented to shoppers.

### Key Entities

- **Spec Attribute Definition (existing)**: Defines a spec's key, label, and unit of record. For length/weight/speed standing-desk attributes, the unit of record changes from metric to imperial as part of this feature; no attributes are added or removed.
- **Product Specification Value (existing)**: The stored value for a given product's (or variant's) spec. Previously-saved length/weight/speed values are updated once to the new imperial numbers; all other stored values are untouched.
- **Legacy Product Specs Text (existing)**: The freeform specs text currently shown on product pages. It remains stored and continues to be the display source only for products that have no structured spec values yet.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Editors entering length, weight, or speed spec values type the exact number shown on the source retailer listing, with zero manual unit conversion, for 100% of affected fields.
- **SC-002**: 100% of previously saved length/weight/speed spec values are present and numerically correct (representing the same real-world measurement) after the one-time update, with zero data loss.
- **SC-003**: Every product page for a product with at least one saved structured spec value shows a structured Technical Specifications section instead of freeform text.
- **SC-004**: Every product page for a product with zero saved structured spec values shows exactly the same content it showed before this change (no regression).
- **SC-005**: 100% of displayed length/weight/speed values on product pages are in the same unit family (inches/pounds) used on the source retailer listings.

## Assumptions

- This feature applies to the length, weight, and speed attributes currently defined for the standing-desks category (10 attributes: min/max height, max load, product weight, desktop width/depth/thickness, lifting speed, frame width min/max); no new attributes are introduced.
- Only 2 of the current catalog's products have any structured spec values saved today; the other 18 continue showing their existing freeform specs text unchanged until an editor fills in their structured specs.
- "Default/first active variant" for the purposes of the public specs display means the same variant selection the product page already treats as primary elsewhere; this feature does not add variant switching to the public page.
- The legacy freeform specs field is not deleted or altered by this feature — it remains available as a fallback for products not yet migrated to structured specs.
- Bulk/CSV import of spec data remains out of scope for this feature.
- One decimal place of precision for both inches and pounds is sufficient for desk specs and matches the precision typically shown on Amazon listings.
