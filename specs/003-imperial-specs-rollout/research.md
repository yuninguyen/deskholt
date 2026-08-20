# Phase 0 Research: Imperial Canonical Specs + Public Specs Rollout

No `NEEDS CLARIFICATION` markers remain in the Technical Context — all open questions were resolved directly with the user during specification, informed by direct inspection of the running Postgres database and codebase. This document records those decisions for traceability.

## Decision 1: Canonical unit for length/weight/speed specs

- **Decision**: Change the canonical (stored) unit for the 10 standing-desk length/weight/speed attributes from metric (mm/kg/mm-per-s) to imperial (in/lb/in-per-s).
- **Rationale**: The only real data source for this catalog is Amazon listings, which display imperial units. Storing canonical values in a different unit family than the sole source requires a conversion step on both entry and display, which is exactly what caused a previously identified data-entry bug (manual unit-conversion mistake). Eliminating the conversion step eliminates that entire class of bug.
- **Alternatives considered**:
  - *Keep metric canonical, add a display/entry conversion layer* — rejected: still requires conversion math (and rounding-tolerance bookkeeping) on every entry and display, reintroducing the exact risk being eliminated, for no benefit since there is no metric-native data source today.
  - *Support dual units per attribute* — rejected as over-engineering: no current or near-term data source uses metric; adds schema/UI complexity with no user who needs it.

## Decision 2: Migrating already-saved values

- **Decision**: A one-time script updates the 10 `AttributeDefinition` rows' `key`/`unit` in place (not delete+recreate, to preserve their `id` and existing foreign-key references from `ProductAttribute`/`CategoryAttribute`), then converts the `value_number` of the 8 existing affected `ProductAttribute` rows to the equivalent imperial number.
- **Rationale**: Verified via direct DB query that only 8 `ProductAttribute` rows (across 2 products: UPLIFT V2 and Autonomous SmartDesk) use the 10 affected definitions — small enough for a straightforward, auditable one-time script rather than a phased/batched migration.
- **Alternatives considered**:
  - *Leave old rows, create new definitions with new keys* — rejected: orphans the 8 existing values under stale definitions, silently dropping real editor-entered data from the completeness count.

## Decision 3: Public Product Page data source

- **Decision**: The public product page reads structured spec rows via the existing `loadSpecificationData` helper (already used by Admin) for a product; if it returns at least one populated row, render the structured section; otherwise, fall back to today's `product.specs` JSON-blob rendering, unchanged.
- **Rationale**: Verified via direct DB query that 18 of the current 20 catalog products have zero structured `ProductAttribute` rows but all 20 have legacy `specs` text populated. A hard cutover to structured-only rendering would blank the specifications section on 18 already-published product pages — a visible regression. A populated-rows-else-fallback rule ships the improvement for migrated products with zero risk to the rest.
- **Alternatives considered**:
  - *Hard cutover, backfill legacy specs into structured attributes for all 20 products first* — rejected as out of scope: backfilling 18 products' full spec sets is real data-entry work (the exact task memory already tracks as "9+ more products" of ongoing catalog work), not something this feature should silently absorb.
  - *Show both structured and legacy specs together* — rejected: redundant/confusing to a shopper, and the legacy blob has no defined relationship to which structured fields are already covered.

## Decision 4: Reuse vs. duplicate the row-enumeration logic

- **Decision**: Reuse `src/lib/products/specificationRows.ts` (`loadSpecificationData`) as-is from the public page rather than writing a second, parallel query.
- **Rationale**: That module is explicitly documented in its own header as the shared source of truth so "the Admin Specifications page and its Server Action... stay in lock-step" — extending that same guarantee to the public page (all three staying in lock-step) is preferable to a second implementation that could drift.
- **Alternatives considered**: *Write a leaner public-only query* — rejected: `loadSpecificationData` already does the exact join (category → category_attributes → attribute_definition, existing values by row key) needed; a second version would duplicate scope/variant logic and risk disagreeing with Admin over time.
