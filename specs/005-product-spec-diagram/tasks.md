# Tasks: Product Spec-Diagram Fallback Image

**Input**: Design documents from `/specs/005-product-spec-diagram/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/product-diagram-route.md, quickstart.md

**Tests**: Included — this repo's established convention (`tests/*.test.ts`, `node --test`) covers
every existing feature, and `plan.md`'s Project Structure already names the two new test files.

**Organization**: Tasks are grouped by user story (US1/US2/US3 from spec.md) to enable
independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Paths are project-relative from repo root, matching `plan.md`'s Project Structure.

---

## Phase 1: Setup

**Purpose**: Confirm no collision with existing code before adding new files.

- [X] T001 Confirm `src/lib/products/productDiagram.ts` and `src/app/api/product-diagram/[slug]/route.ts` do not already exist (`git status`/`ls`), and confirm no other route currently owns the `/api/product-diagram/` path prefix.

**Checkpoint**: No new dependency, no config change needed (per research.md Decision 1) — Setup is otherwise complete.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: The single shared primitive both US2 and US3 depend on — origin detection from `image_url`.

**⚠️ CRITICAL**: US2 and US3 cannot start until this phase is complete. US1 does not depend on this phase and may proceed in parallel.

- [X] T002 [P] Implement and export `DIAGRAM_ROUTE_PREFIX` and `isDiagramUrl(imageUrl: string): boolean` in `src/lib/products/productDiagram.ts`, per data-model.md's `ImageOrigin` shape.
- [X] T003 [P] Unit tests for `isDiagramUrl` in `tests/productDiagram.test.ts` (true for `/api/product-diagram/<slug>`, false for a real Amazon/Unsplash URL, false for an empty string).

**Checkpoint**: `isDiagramUrl` available and tested — US2 and US3 may now begin.

---

## Phase 3: User Story 1 - Editor closes the image gap for a data-complete product (Priority: P1) 🎯 MVP

**Goal**: A Standing Desk product with complete VERIFIED core dimensions gets a working, product-specific diagram in place of the shared stock photo.

**Independent Test**: `curl` the new route for one of the 5 target production slugs and confirm a 200 SVG response containing that product's own dimension numbers; confirm the product page hero image is no longer the shared stock URL.

### Tests for User Story 1

> Write these tests FIRST; confirm they fail before the corresponding implementation task.

- [X] T004 [P] [US1] Unit tests for `getDiagramEligibility(productId)` in `tests/productDiagram.test.ts`: all five required VERIFIED fields present (height/load Product-scope, width/depth Variant-scope on the first active Variant) → `eligible: true` with correct `dimensions`; one field missing → `eligible: false` with that key in `missing`; one field present but `confidence !== 'VERIFIED'` → `eligible: false`; product has no active `ProductVariant` → `eligible: false` with `desktopWidthIn`/`desktopDepthIn` in `missing`.
- [X] T005 [P] [US1] Contract tests for the Route Handler in `tests/productDiagramRoute.test.ts`, per `contracts/product-diagram-route.md`: unknown slug → 404, eligible fixture → 200 with `Content-Type: image/svg+xml` and the fixture's own numbers present in the body, ineligible fixture (missing one required field) → 404 with no SVG body.

### Implementation for User Story 1

- [X] T006 [US1] Implement `getDiagramEligibility(productId): DiagramEligibility` in `src/lib/products/productDiagram.ts`, reading `min_height_in`/`max_height_in`/`max_load_lb` as Product-scope (`variant_id IS NULL`) rows and `desktop_width_in`/`desktop_depth_in` as Variant-scope rows on the product's first active `ProductVariant`, per the corrected data-model.md. (Depends on T004 existing as failing tests.)
- [X] T007 [US1] Implement `renderDiagramSvg(dimensions: DiagramDimensions, productName: string): string` in `src/lib/products/productDiagram.ts` — DeskHolt "Blueprint Blue" dimension-line SVG template (rectangle + dimension lines + mono-styled numeric labels for width/depth/height range/max load, optional frame color/material when present). (Depends on T006.)
- [X] T008 [US1] Implement `GET` in `src/app/api/product-diagram/[slug]/route.ts`: look up `Product` by slug (404 if none) → call `getDiagramEligibility` (404 if `eligible: false`) → call `renderDiagramSvg` → return `200` with `Content-Type: image/svg+xml`, per `contracts/product-diagram-route.md`. (Depends on T006, T007, T005 as failing tests.)
- [X] T009a [US1] **Amendment (discovered while executing T009):** `parseEditProductInput()` in `src/lib/products/productEditCommand.ts:55` rejects any `imageUrl` that is not `URL.canParse`-valid, which excludes the relative diagram path `/api/product-diagram/{slug}` by design (confirmed by the existing test at `tests/productEditCommand.test.ts:92`, which deliberately asserts a relative path like `/images/desk.jpg` is rejected). Add a narrow, explicit exception: accept `imageUrl` when it starts with `DIAGRAM_ROUTE_PREFIX` (`/api/product-diagram/`) from `src/lib/products/productDiagram.ts`, in addition to the existing `URL.canParse` absolute-URL path — not a general relaxation of the absolute-URL requirement. Write a RED test first (relative diagram path currently rejected), then implement, then confirm the existing `/images/desk.jpg` rejection test still passes unchanged.
- [ ] T009 [US1] Once T008 (and T009a) is deployed, set `image_url` to `/api/product-diagram/{slug}` for the 5 named production Standing Desks (`shw-48in-standing-desk-drawer-black`, `veken-47-2in-standing-desk-black`, `claiks-standing-desk-rustic-brown`, `fezibo-standing-desk-maple`, `offigo-63in-lshape-standing-desk-black`) through the existing product-edit Server Action (`src/app/(admin)/admin/products/[id]/edit/actions.ts`), applied against the **Neon production database** (not localhost — confirmed diverged this session), one product at a time with before/after verification.

**Checkpoint**: User Story 1 is fully functional and independently testable — the route serves real diagrams, and the 5 target products display them.

---

## Phase 4: User Story 2 - Visitor is never misled into thinking the diagram is a real photo (Priority: P1)

**Goal**: The diagram is visually and structurally distinguishable from an authentic product photo, on-page and in structured data.

**Independent Test**: View a diagram-backed product page; confirm a visible "technical diagram, not an official photo" caption, and confirm the page's `Product` JSON-LD block does not assert the diagram as an authentic `image`.

**Depends on**: Phase 2 (T002, `isDiagramUrl`).

### Tests for User Story 2

- [X] T010 [P] [US2] Test that the `ProductSchema` JSON-LD call site omits (or does not set to the diagram URL) the `image` prop when `isDiagramUrl(product.image_url)` is true, and includes it normally for a real-photo `image_url` — extend the existing structured-data test coverage (see `tests/productStructuredData.test.ts` if present, otherwise add alongside the page's existing tests).

### Implementation for User Story 2

- [X] T011 [US2] In `src/app/(public)/products/[slug]/page.tsx`, use `isDiagramUrl(product.image_url)` to pass `image: undefined` (instead of `product.image_url`) into `<ProductSchema>` when true, per FR-008 / research.md Decision 4. (Depends on T002, T010.)
- [X] T012 [US2] In `src/app/(public)/products/[slug]/page.tsx`, render a visible caption/label near the hero `<Image>` when `isDiagramUrl(product.image_url)` is true (e.g. "DeskHolt technical diagram — not an official product photo"), per FR-009. (Depends on T002.)
- [X] T012a [US2] **Amendment (found in production after T009):** Next.js `next/image`'s optimizer (`/_next/image`) returns `400` for SVG sources by default (security default; confirmed live for all 5 target products — the diagram itself is a valid 200 SVG, only the `next/image` optimization layer rejects it), because `next.config.mjs` does not set `images.dangerouslyAllowSVG`. Fix narrowly: in `src/app/(public)/products/[slug]/page.tsx`, when `isDiagramUrl(product.image_url)` is true, render a plain `<img>` (not `next/image`'s `<Image>`) for the hero image, matching the existing `<Image>`'s sizing/classes as closely as practical; keep `<Image>` unchanged for real-photo products. Do not enable `images.dangerouslyAllowSVG` app-wide — that would relax SVG handling for every image in the app, not just DeskHolt's own server-generated diagrams. Add/extend a test asserting the diagram branch does not use `next/image`.
- [X] T012b [US2] **Amendment (found via user screenshot after T012a):** `src/components/ui/ProductCard.tsx:29` (used for homepage/category listing cards) has the identical bug as T012a — it always renders `next/image`'s `<Image src={imageUrl} .../>` unconditionally, so any diagram-backed product shows a blank card image. This was named as a consumer in `contracts/product-diagram-route.md` ("anywhere else the product's image is shown, e.g. category listing cards") but never turned into a task — planning gap. Fix identically to T012a: import `isDiagramUrl` from `src/lib/products/productDiagram.ts`, and when `isDiagramUrl(imageUrl)` is true, render a plain `<img>` instead of `<Image>`. Add a test for `ProductCard` covering both branches (diagram → plain `<img>`, real photo → `next/image` `<Image>`), matching this repo's existing component-test conventions.
- [X] T012c [US2] **Amendment (found via user screenshot after T012a):** the diagram `<img>`'s `object-cover` class crops the SVG to fill its container, cutting off edge content (observed live: the "in depth" dimension label clipped at the right edge on the Veken product page) — `object-cover` is correct for real photos but wrong for a diagram whose edge labels matter. In both `src/app/(public)/products/[slug]/page.tsx` (T012a) and `src/components/ui/ProductCard.tsx` (T012b), use `object-contain` instead of `object-cover` specifically for the diagram `<img>` branch only; leave `object-cover` unchanged for the real-photo `<Image>` branch in both files.

**Checkpoint**: User Stories 1 AND 2 both work independently — diagrams render correctly and never claim to be authentic photos.

---

## Phase 5: User Story 3 - Editor can tell at a glance which products still need a real photo (Priority: P2)

**Goal**: The existing Admin Standing Desks list (`src/app/(admin)/admin/products/page.tsx`) shows each product's image origin without opening the record.

**Independent Test**: Open `/admin/products`; confirm diagram-backed and real-photo products are visibly labeled differently in the same table.

**Depends on**: Phase 2 (T002, `isDiagramUrl`).

### Tests for User Story 3

- [X] T013 [P] [US3] Test that the Admin products list marks a diagram-backed product's origin distinctly from a real-photo product's origin — extend existing Admin products page test coverage (matching the pattern of other `admin*Page.test.ts` files in `tests/`).

### Implementation for User Story 3

- [X] T014 [US3] Add an image-origin indicator (e.g. a small "Diagram" / "Photo" badge) to each row of the products table in `src/app/(admin)/admin/products/page.tsx`, computed via `isDiagramUrl(product.image_url)`. (Depends on T002, T013.)
- [X] T015 [P] [US3] Add the new origin-label strings to `src/lib/admin/i18n/en.ts` and `src/lib/admin/i18n/vi.ts`, matching the existing translation-key conventions in those files.

**Checkpoint**: All three user stories are independently functional.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 [P] Run `npm run typecheck` and `npm run lint`; fix any issues surfaced by the new/changed files.
- [ ] T017 Run all `quickstart.md` scenarios (1–5) against local dev first, then re-run Scenario 1 and Scenario 3 against the 5 live Neon-production slugs updated in T009.
- [ ] T018 [P] Add a short note to `docs/claiks-amazon-media-handoff.md` recording that Claiks now uses the generated diagram (not a real photo) pending manufacturer/PA-API image rights, consistent with this feature's FR-006 replace-later path.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS US2 and US3 only (US1 does not need `isDiagramUrl`).
- **User Story 1 (Phase 3)**: Can start immediately after Setup, in parallel with Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Reads `image_url` values that Phase 3 (T009) will start setting, but T010–T012 can be built/tested against fixture data without waiting for T009.
- **User Story 3 (Phase 5)**: Depends on Phase 2. Independent of Phase 3/4 implementation, though most valuable once T009 has run.
- **Polish (Phase 6)**: Depends on all three user stories being complete.

### Parallel Opportunities

- T002 and T003 can run together (Phase 2).
- T004 and T005 can run together (US1 tests, different files).
- Once Phase 2 completes, Phase 4 and Phase 5 implementation can proceed in parallel with each other and with the remainder of Phase 3.
- T015 (i18n strings) can run in parallel with T014 (component wiring) since they touch different files, though T014 will reference the keys T015 adds.

---

## Parallel Example: Phase 2 + early User Story 1

```text
# In parallel once Phase 1 (T001) is done:
Task: "Implement isDiagramUrl in src/lib/products/productDiagram.ts" (T002)
Task: "Unit tests for isDiagramUrl in tests/productDiagram.test.ts" (T003)
Task: "Unit tests for getDiagramEligibility in tests/productDiagram.test.ts" (T004)
Task: "Contract tests for the Route Handler in tests/productDiagramRoute.test.ts" (T005)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (T001).
2. Complete Phase 3 (User Story 1: T004–T009) — this alone delivers the core value (5 products stop sharing a stock photo).
3. **STOP and VALIDATE**: run quickstart.md Scenarios 1 and 2 against local dev.
4. This is deployable/demonstrable on its own even before Phase 4/5 land.

### Incremental Delivery

1. Setup + Foundational → Phase 3 (US1) → validate → this is already a real improvement to catalog readiness.
2. Add Phase 4 (US2) → validate compliance/labeling → safe to keep US1 live throughout.
3. Add Phase 5 (US3) → validate Admin visibility.
4. Phase 6 polish, then re-verify against Neon production.

## Notes

- [P] tasks touch different files and have no unmet dependency.
- Every implementation task under a user story lists which test task(s) it depends on, per this repo's TDD convention — write the test, confirm it fails, then implement.
- T009 is the one task that is a data change rather than a code change; it must target Neon production specifically (per this session's confirmed localhost/production divergence), never localhost, and must go through the existing edit Server Action (Constitution Principle IV) rather than a raw script-driven `UPDATE`.
