---
description: "Task list for feature implementation"
---

# Tasks: Public Site Rebrand — "Technical Drawing Desk" Design System

**Input**: Design documents from `/specs/002-public-site-rebrand/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested in spec.md — no dedicated automated test tasks are generated; existing `npm run lint`/`typecheck`/`test`/`build` gate the change, and quickstart.md provides manual validation scenarios per story.

**Organization**: Tasks are grouped by user story (spec.md) to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US4)

## Path Conventions

Single Next.js App Router project. Paths are relative to repo root (`c:\laragon\www\deskholt`).

---

## Phase 1: Setup

- [X] T001 Create empty directories `src/components/ui/` and `src/lib/consent/` (no files yet — placeholders for upcoming component/lib tasks)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token infrastructure + route-group restructuring that every user story depends on. **Order matters**: admin isolation (T004) must land *before* the root layout is shrunk (T009), so `/admin/*` is never even momentarily broken.

**🚨 CRITICAL**: No user-story work can begin until this phase is complete and T010's verification passes.

- [X] T002 Add design-system color tokens (paper/paper-alt, card, ink/ink-soft/ink-faint, line/line-strong, walnut/walnut-soft, blueprint/blueprint-deep/blueprint-soft, sage/sage-soft, amber/amber-soft, brick/brick-soft), `fontFamily.display/body/mono`, and `borderRadius.sm/md/lg` to `tailwind.config.ts` per data-model.md's token table — keep existing `brand`/`dark` scales in place for now (removed in T031 once nothing references them)
- [X] T003 [P] Add `next/font/google` loaders for Space Grotesk, Inter, IBM Plex Mono (`display: 'swap'`) exposing `--font-display`/`--font-body`/`--font-mono` CSS variables — add the loader calls in `src/app/layout.tsx` (variables only, JSX changes come in T009)
- [X] T004 Create `src/app/(admin)/layout.tsx` that reproduces today's *inherited* chrome exactly as currently rendered (the disclosure banner, nav, and footer JSX/classes currently in `src/app/layout.tsx`, using the OLD `dark-*`/`brand-*` tokens) so `/admin/*` keeps its present look once the root layout is shrunk
- [X] T005 Move `src/app/page.tsx` to `src/app/(public)/page.tsx` (file move only, no content changes)
- [X] T006 Move `src/app/category/[slug]/page.tsx` to `src/app/(public)/category/[slug]/page.tsx` (file move only)
- [X] T007 Move `src/app/products/[slug]/page.tsx` to `src/app/(public)/products/[slug]/page.tsx` (file move only)
- [X] T008 Move `src/app/affiliate-disclosure/page.tsx` to `src/app/(public)/affiliate-disclosure/page.tsx` (file move only)
- [X] T009 Create `src/app/(public)/layout.tsx` as a pass-through (`{children}` only, no chrome yet) so the moved pages keep rendering
- [X] T010 Shrink `src/app/layout.tsx` to a bare `<html>/<body>` shell: keep the font-variable class names from T003, remove the nav/footer/disclosure-banner JSX entirely (that content now lives only in `(admin)/layout.tsx` from T004)
- [X] T011 Verify: run `npm run dev`, load `/` (renders via passthrough `(public)/layout.tsx`, still old inline styles) and `/admin/login` + `/admin/products` (renders via new `(admin)/layout.tsx`) — confirm both still work end-to-end and admin looks unchanged before proceeding

**Checkpoint**: Route groups exist, admin is isolated and unaffected, tokens/fonts are available. User story work can now begin.

---

## Phase 3: User Story 1 - Visitor reads the site as a trustworthy price-comparison desk (Priority: P1) 🎯 MVP

**Goal**: Root layout nav/footer + home page + category page render with the new design system, real logo, paper/ink palette.

**Independent Test**: Load `/` and `/category/standing-desks`; confirm paper-grid background, ink text, Space Grotesk headings, real logo in header, ink footer — per quickstart.md Scenario 1.

- [X] T012 [P] [US1] Copy `logo_deskholt_transparent-background.webp` into `public/logo.webp` (or `src/app/(public)/` static asset location consistent with Next.js `Image`/`<img>` conventions used elsewhere in the repo)
- [X] T013 [P] [US1] Update `src/app/globals.css`: replace `.glass-card`/`.glass-nav` with the design system's paper-grid `body` background, base ink text color, and any small non-Tailwind-expressible helper classes (e.g. `.dim-line`) per research.md's token-replacement decision
- [X] T014 [US1] Create `src/components/ui/Badge.tsx` per data-model.md's Badge contract (variant + label, dot + text, never color alone)
- [X] T015 [US1] Create `src/components/ui/ProductCard.tsx` per data-model.md's ProductCard contract (image, category, name, badges, mono price, primary button, optional dimension-line overlay)
- [X] T016 [US1] Build the real nav (real logo via T012, category links, walnut/blueprint accents) and ink-footer content into `src/app/(public)/layout.tsx`, replacing the T009 passthrough; keep the affiliate-disclosure banner text/link unchanged, only restyle it
- [X] T017 [US1] Restyle `src/app/(public)/page.tsx` (home): hero, category quick-nav, and featured-products grid using `<ProductCard>`/`<Badge>` and new tokens, preserving the existing `prisma.product.findMany` query and all copy
- [X] T018 [US1] Restyle `src/app/(public)/category/[slug]/page.tsx`: header, eco filter toggle, and product grid using `<ProductCard>`/`<Badge>` and new tokens, preserving existing filter/query logic
- [X] T019 [US1] Manual verification: run quickstart.md Scenario 1 (home + category visual check) and confirm no `brand-`/`dark-(900|800|700|600)` classes remain in `src/app/(public)/page.tsx`, `src/app/(public)/category/[slug]/page.tsx`, or `src/app/(public)/layout.tsx`

**Checkpoint**: Home + category pages and the site-wide nav/footer/logo are fully on the new design system and independently demoable.

---

## Phase 4: User Story 2 - Visitor recognizes the primary "buy" action (Priority: P1)

**Goal**: Product page + price comparison table restyled with blueprint primary actions, sage best-price highlight, dot+text badges.

**Independent Test**: Load a product page; confirm the lowest-price row is sage-highlighted, Go/Buy buttons are blueprint, and every badge shows a dot plus text — per quickstart.md Scenario 1 (product page) and the SC-005/SC-006 accessibility checks.

- [X] T020 [US2] Create `src/components/ui/PriceTable.tsx` per data-model.md's PriceTable contract (mono prices, sage best-row highlight, blueprint Go button, muted style when out of stock)
- [X] T021 [US2] Restyle `src/app/(public)/products/[slug]/page.tsx`: breadcrumbs, image/gallery area, badges (`<Badge>`), specs grid, pros/cons sections, and swap the inline price-comparison markup for `<PriceTable>`, preserving the existing `prisma.product.findUnique` query and `ProductSchema` usage
- [X] T022 [US2] Manual verification: run quickstart.md Scenario 1 (product page) — confirm price table above the fold, sage best row, blueprint Go buttons, and no `brand-`/`dark-*` classes remain in this file

**Checkpoint**: Product page and price table are fully on the new design system, independently demoable alongside US1.

---

## Phase 5: User Story 3 - Cookie consent under the new visual style (Priority: P2)

**Goal**: New cookie consent banner + Customize modal, styled per the design system, satisfying GPC auto-decline and persistence (see research.md — this is new functionality, not a restyle of an existing component).

**Independent Test**: Fresh session shows the ink/paper banner; Customize exposes 4 toggles with Necessary locked; a GPC signal auto-declines without ever showing the banner — per quickstart.md Scenario 3.

- [X] T023 [P] [US3] Create `src/lib/consent/cookieConsent.ts`: typed consent record, `localStorage` read/write helpers, GPC detection (`navigator.globalPrivacyControl`)
- [X] T024 [US3] Create `src/components/ui/CookieBanner.tsx`: ink banner with Customize/Accept All buttons, modal with 4 toggle rows (Necessary locked on), wired to `cookieConsent.ts` from T023
- [X] T025 [US3] Render `<CookieBanner>` once inside `src/app/(public)/layout.tsx` (above the footer, per data-model.md) — do this after T016 lands to avoid a merge conflict on that shared file
- [X] T026 [US3] Manual verification: run quickstart.md Scenario 3 (fresh session banner, Customize toggles + persistence, GPC auto-decline)

**Checkpoint**: Cookie consent is fully functional and styled, independently demoable.

---

## Phase 6: User Story 4 - Admin remains completely unaffected (Priority: P1)

**Goal**: Confirm `/admin/*` is pixel-identical to its pre-rebrand appearance now that all public-facing tokens have changed.

**Independent Test**: Load `/admin/login` and `/admin/products` before/after comparison — no visual difference; per quickstart.md Scenario 2.

> Structural isolation was already built in Phase 2 (T004, T010). This phase is verification-only, run *after* Phases 3–5 so all public-facing token changes exist to check against.

- [X] T027 [US4] Manual verification: load `/admin/login` and `/admin/products`, compare against pre-rebrand screenshots/description — confirm identical dark chrome, no paper background, no new nav/footer
- [X] T028 [US4] Run `grep -rE "paper|ink-soft|blueprint|walnut|sage-soft" src/app/(admin) src/lib/admin` — expect zero matches, confirming no new token leaked into admin-only files

**Checkpoint**: All four user stories independently verified; admin regression risk closed out.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Repo-wide cleanup and final gates that span multiple stories.

- [X] T029 [P] Add a `prefers-reduced-motion: reduce` rule in `src/app/globals.css` that collapses all restyled transitions (buttons, toggles, nav links) to instant state changes, per FR-016
- [X] T030 [P] Accessibility pass: confirm every restyled interactive element (nav links, buttons, cookie toggles, Go buttons) shows a visible 2px blueprint focus outline — per quickstart.md Scenario 4
- [X] T031 Remove the now-unused `brand`/`dark` color scale and `.glass-card`/`.glass-nav` remnants from `tailwind.config.ts`/`src/app/globals.css` once T002–T028 confirm nothing under `src/app/(public)` or `src/components/ui` references them (do NOT remove tokens still used by `src/app/(admin)/layout.tsx` from T004)
- [X] T032 Run `npm run lint && npm run typecheck && npm test && npm run build` and fix any resulting errors
- [X] T033 Run the remaining quickstart.md scenarios (Scenario 5 — existing functionality) end-to-end and record results

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1. **BLOCKS all user stories.** Internal order is sequential: T004 (admin isolation) must complete before T010 (root layout shrink); T005–T008 (page moves) must complete before T009 (public passthrough layout).
- **User Stories (Phases 3–6)**: All depend on Phase 2 completion (T011 checkpoint). US1 (Phase 3), US2 (Phase 4), and US3 (Phase 5) can proceed in parallel once Phase 2 is done — they touch disjoint files (home/category+layout vs. product page vs. cookie banner+lib). US4 (Phase 6) is verification-only and should run last since it needs the finished output of US1–US3 to check against.
- **Polish (Phase 7)**: Depends on Phases 3–6 all being complete.

### Parallel Opportunities

- T003 can run alongside T002.
- T005, T006, T007, T008 (file moves) can all run in parallel — different files.
- Once Phase 2's checkpoint (T011) passes: US1 (T012–T019), US2 (T020–T022), and US3 (T023–T026) can be implemented in parallel by different people/sessions, since they touch disjoint files (`(public)/page.tsx` + `(public)/category` + `(public)/layout.tsx` + `components/ui/{Badge,ProductCard}.tsx` for US1; `(public)/products/[slug]/page.tsx` + `components/ui/PriceTable.tsx` for US2; `lib/consent/*` + `components/ui/CookieBanner.tsx` for US3) — the one shared file, `(public)/layout.tsx`, is written by US1 (T016) and then only *read from* (import added) by US3 (T025), so US3 should land T025 after T016 lands to avoid a merge conflict on that file.
- T029 and T030 (Polish) can run in parallel — different concerns, though both may touch `globals.css`; verify no conflicting edits.

---

## Parallel Example: Phase 2 kickoff

```bash
# After T001, these can run together:
Task: "Add design-system tokens to tailwind.config.ts (T002)"
Task: "Add next/font/google loaders to src/app/layout.tsx (T003)"

# These four file moves can run together:
Task: "Move src/app/page.tsx to src/app/(public)/page.tsx (T005)"
Task: "Move src/app/category/[slug]/page.tsx to src/app/(public)/category/[slug]/page.tsx (T006)"
Task: "Move src/app/products/[slug]/page.tsx to src/app/(public)/products/[slug]/page.tsx (T007)"
Task: "Move src/app/affiliate-disclosure/page.tsx to src/app/(public)/affiliate-disclosure/page.tsx (T008)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup) + Phase 2 (Foundational) — this alone is verifiable via T011 and already de-risks the admin-isolation concern.
2. Complete Phase 3 (US1: nav/footer/logo/home/category).
3. **STOP and VALIDATE**: run quickstart.md Scenario 1 for home + category.
4. This is a demoable MVP: the site's primary visual identity is rebranded even before the product page or cookie banner are touched.

### Incremental Delivery

1. Phase 1 + 2 → foundation ready, admin verified safe.
2. Phase 3 (US1) → demo home/category.
3. Phase 4 (US2) → demo product page + price table.
4. Phase 5 (US3) → demo cookie consent.
5. Phase 6 (US4) → close out admin-regression verification.
6. Phase 7 → polish, cleanup, full `npm run check` gate.

### Solo/Sequential Strategy (most likely for this repo)

Given this is typically a single-session implementation, follow the phases in order (1 → 2 → 3 → 4 → 5 → 6 → 7); the "parallel opportunities" above matter most if work is ever split across multiple sessions/agents.

---

## Notes

- No automated tests were requested for this feature; each story's "Checkpoint" is a manual quickstart.md scenario instead of a test suite.
- Commit after each phase checkpoint, not after every individual task, to keep the admin-isolation safety property (T004 before T010) intact in a single reviewable unit.
- Avoid touching `src/app/go/[slug]` or any Prisma schema/query shape — explicitly out of scope per plan.md.
- Admin_Panel_for_Deskholt.md describes a separate, future, much larger admin-panel rebuild (NextAuth, shadcn/ui, Categories/Redirects/Activity Log modules) that is explicitly out of scope here — it is not yet implemented, and today's V1-alpha admin (2 pages, password-gated) is what T004/T027/T028 protect as-is.
