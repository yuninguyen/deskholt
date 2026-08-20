---

description: "Task list for Imperial Canonical Specs + Public Specs Rollout"
---

# Tasks: Imperial Canonical Specs + Public Specs Rollout

**Input**: Design documents from `/specs/003-imperial-specs-rollout/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md (all present; no contracts/ — feature has no external API surface)

**Tests**: Included — `tests/specsDisplay.test.ts` is explicitly named in plan.md's Source Code structure.

**Organization**: Tasks are grouped by user story (from spec.md: US1–US4, all P1 except US4 which is P3) to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- File paths are exact, relative to repo root

## Path Conventions

Single Next.js project. App code under `src/`, Prisma under `prisma/`, one-off scripts under `scripts/`, tests under `tests/`.

---

## Phase 1: Setup

**Purpose**: Confirm a clean baseline before making changes

- [X] T001 Run `npm test` and `npm run build` from repo root; confirm both pass before any change (baseline for later regression comparison)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Rename the 10 `AttributeDefinition` rows' key/unit from metric to imperial — required before US1 (Admin displays correct unit), US2 (public page displays correct unit), and US3 (fallback gating logic) can be verified correctly.

**🚨 CRITICAL**: No user story work can be verified until this phase is complete.

- [X] T002 Update `prisma/seed-standing-desk-attributes.ts`: rename the 10 attribute keys/units per the mapping in `specs/003-imperial-specs-rollout/data-model.md` (`min_height_mm`→`min_height_in`, `max_height_mm`→`max_height_in`, `max_load_kg`→`max_load_lb`, `product_weight_kg`→`product_weight_lb`, `desktop_width_mm`→`desktop_width_in`, `desktop_depth_mm`→`desktop_depth_in`, `desktop_thickness_mm`→`desktop_thickness_in`, `lifting_speed_mm_s`→`lifting_speed_in_s`, `frame_width_min_mm`→`frame_width_min_in`, `frame_width_max_mm`→`frame_width_max_in`); units change mm→in, kg→lb, mm/s→in/s accordingly; all other 25 attribute rows in the file untouched
- [X] T003 Create `scripts/migrate-specs-to-imperial.ts` with the `AttributeDefinition` rename step: for each of the 10 old keys, `UPDATE` (not delete+recreate) that row's `key` and `unit` to its new imperial value, preserving `id`, so existing `ProductAttribute`/`CategoryAttribute` foreign keys stay intact
- [X] T004 Run `npx tsx scripts/migrate-specs-to-imperial.ts` (definition-rename step) against the local dev DB and verify via Prisma Studio that all 10 rows show the new key/unit and the other 25 `AttributeDefinition` rows are unchanged (quickstart.md Step 2)

**Checkpoint**: Foundation ready — canonical unit is now imperial for all 10 attributes; user story work can begin.

---

## Phase 3: User Story 1 - Editor enters specs in the same units as the source listing (Priority: P1) 🎯 MVP

**Goal**: Editor types the number exactly as Amazon shows it (e.g., "55" for 55 in), with no conversion happening anywhere.

**Independent Test**: Open Admin Specifications tab for a standing desk product, enter a value into a renamed length/weight field, save, confirm the exact number entered is stored and redisplayed with the new imperial unit label — no conversion step.

### Implementation for User Story 1

- [X] T005 [US1] Verify `src/components/admin/products/ProductSpecificationsForm.tsx` (already reads `row.unit` dynamically — no code change required) now renders the 10 renamed fields with imperial unit labels (`in`, `lb`, `in/s`), confirming no hardcoded metric unit strings remain anywhere in Admin (quickstart.md Step 4)
- [X] T006 [US1] Manually enter and save a test value into a renamed field (e.g., Desktop Width) in Admin for a standing-desk product; confirm the exact typed number is stored and redisplayed unchanged on reload (spec.md Acceptance Scenarios 1–3)

**Checkpoint**: User Story 1 fully functional and independently testable — Admin editors now work entirely in imperial units with zero conversion.

---

## Phase 4: User Story 2 - Shopper sees accurate, structured specs on the product page (Priority: P1)

**Goal**: Product pages with saved structured specs show a clean, structured Technical Specifications section in imperial units.

**Independent Test**: View the product page for a product with structured specs saved in Admin; confirm displayed rows (label, value, unit) match what's stored, in imperial units.

### Implementation for User Story 2

- [X] T007 [US2] In `src/app/(public)/products/[slug]/page.tsx`, import `loadSpecificationData` from `src/lib/products/specificationRows.ts` and call it for the current product's id
- [X] T008 [US2] In `src/app/(public)/products/[slug]/page.tsx` (depends on T007), filter the loaded rows to `scope === 'PRODUCT'` plus `scope === 'VARIANT'` rows for the product's default/first active variant, keeping only rows where `existing !== null` and at least one value field (`valueNumber`/`valueString`/`valueBoolean`) is non-null
- [X] T009 [US2] In `src/app/(public)/products/[slug]/page.tsx` (depends on T008), render the filtered rows as the structured Technical Specifications section (label, formatted value, unit per row) when the filtered list is non-empty

**Checkpoint**: User Story 2 functional for the 2 already-migrated products — structured specs now visible to shoppers in imperial units.

---

## Phase 5: User Story 3 - Existing product pages don't break during rollout (Priority: P1)

**Goal**: The 18 products with zero structured specs keep showing their existing freeform specs text, unchanged.

**Independent Test**: View the product page for a product with old freeform specs text but no structured specs saved; confirm it displays exactly as it does today.

### Implementation for User Story 3

- [X] T010 [US3] In `src/app/(public)/products/[slug]/page.tsx` (depends on T009), wrap the existing legacy `specsObj` rendering block in an `else` branch so it only renders when the filtered structured-rows list from T008 is empty, leaving the legacy block's internal markup/logic untouched
- [X] T011 [US3] Manually verify at least 2 unmigrated product pages (e.g. `flexispot-e7-pro`, `fully-jarvis`) render Technical Specifications output identical to current production behavior (quickstart.md Step 6)
- [X] T012 [US3] Manually verify the 2 migrated product pages (`uplift-v2-standing-desk-bamboo-gray`, `autonomous-smartdesk-dual-motor-white`) render the structured section instead of legacy text (quickstart.md Step 5)

**Checkpoint**: User Stories 1–3 all functional together — full rollout complete except historical data conversion (US4).

---

## Phase 6: User Story 4 - Already-entered spec data is converted once, automatically (Priority: P3)

**Goal**: The 8 already-saved length/weight/speed `ProductAttribute` values are auto-converted to their imperial equivalents.

**Independent Test**: Compare a previously-saved metric value against the same field after rollout; confirm it now shows the equivalent imperial number representing the same real-world measurement.

### Implementation for User Story 4

- [X] T013 [US4] Extend `scripts/migrate-specs-to-imperial.ts` with a value-conversion step: for the 8 existing `ProductAttribute` rows tied to the 10 renamed definitions, convert `value_number` (length/speed rows: divide by 25.4; weight rows: multiply by 2.20462), rounded to 1 decimal place; make the step idempotent-safe so re-running the script does not double-convert
- [X] T014 [US4] Run `npx tsx scripts/migrate-specs-to-imperial.ts` (value-conversion step, depends on T013) against the local dev DB and verify the 8 rows now hold correct imperial numbers (quickstart.md Step 3)

**Checkpoint**: All 4 user stories independently functional.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Automated regression coverage and final end-to-end validation

- [X] T015 [P] Write `tests/specsDisplay.test.ts` covering the structured-vs-fallback branching logic introduced in T008/T010 (populated structured rows → structured render; zero structured rows → legacy fallback)
- [X] T016 Run `npm test`; confirm `tests/specsDisplay.test.ts` and the existing `tests/clickTracking.test.ts` both pass
- [X] T017 Run the full `specs/003-imperial-specs-rollout/quickstart.md` validation end-to-end (Steps 1–7)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories (unit labels must be correct before any story can be verified)
- **User Stories (Phase 3–6)**: All depend on Foundational completion
  - US1 (Phase 3): No dependency on other stories
  - US2 (Phase 4): No dependency on US1; independently testable
  - US3 (Phase 5): Builds directly on US2's code (T007–T009 in the same file) — sequential, not parallel, but conceptually independent (tests the *absence* of structured data)
  - US4 (Phase 6): No dependency on US2/US3; extends the same script file as Foundational (T003) but is functionally independent of the public-page work
- **Polish (Phase 7)**: Depends on US2 + US3 (branching logic must exist to test it)

### Within Each User Story

- US2/US3 tasks touch the same file (`page.tsx`) sequentially — T007 → T008 → T009 → T010 (no parallelism within this chain)
- US4 tasks touch the same file (`scripts/migrate-specs-to-imperial.ts`) sequentially — T013 → T014

### Parallel Opportunities

- T001 (Setup) has no dependents blocking it — run first, alone
- T005/T006 (US1) can run in parallel with T007–T009 (US2) once Foundational (T002–T004) is done, since they touch different files (Admin form vs public page)
- T013 (US4, script file) can run in parallel with T007–T010 (US2/US3, page.tsx file) since they touch different files
- T015 (Polish, new test file) can start as soon as T010 is complete, in parallel with any remaining manual verification tasks (T011, T012)

---

## Parallel Example: After Foundational Completes

```bash
# US1 verification and US2 implementation can proceed in parallel (different files):
Task: "Verify ProductSpecificationsForm.tsx renders imperial units (T005)"
Task: "Wire loadSpecificationData into page.tsx (T007)"

# US4 script work can proceed in parallel with US2/US3 page work (different files):
Task: "Extend migrate-specs-to-imperial.ts with value-conversion step (T013)"
Task: "Filter structured rows in page.tsx (T008)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (renames the 10 attributes — CRITICAL, blocks everything)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Confirm Admin editors now work in imperial units with zero conversion
5. This alone fixes the root-cause data-entry bug even before the public-page work ships

### Incremental Delivery

1. Setup + Foundational → canonical units are now imperial
2. Add US1 → validate independently → Admin editors unblocked (root-cause fix shipped)
3. Add US2 + US3 together (same file, sequential) → validate both migrated and unmigrated product pages → public rollout shipped with zero regression risk
4. Add US4 → validate → historical data cleaned up
5. Polish → automated regression test + full quickstart pass

### Suggested Task Execution Order

T001 → T002 → T003 → T004 → (T005, T006 in parallel with T007, T008, T009, T013) → T010 → T011, T012 → T014 → T015 → T016 → T017

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- No `[US]` label on Setup/Foundational/Polish tasks, per format rules
- Commit after each phase checkpoint
- US2 and US3 are implemented as one continuous edit to `page.tsx` (T007–T010) because the fallback (US3) is the `else` branch of the structured-render condition (US2) — they cannot be split into fully separate diffs, but each has its own independent test criteria and can be verified separately
