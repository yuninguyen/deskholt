# Preserve description line breaks on the product detail page

> **For agentic workers:** No TDD sub-skill strictly required for a single CSS class change, but still use superpowers:using-git-worktrees to isolate the work, and still add a test per Task 1 below.

**Goal:** Fix a real display bug found by the user's first real manual product entry (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` — same dogfooding session as the Amazon image host and ProductCard zero-offer fixes). The Create Product form's Description `<textarea>` preserves whatever newlines the admin types or pastes (e.g. Amazon's bulleted "About this item" list, each bullet on its own line), but the public product detail page renders it as:

```tsx
<p className="text-sm leading-relaxed text-ink-soft">{product.description}</p>
```

— a plain `<p>` with the browser's default `white-space: normal`, which collapses all newlines into single spaces. The result: multiple distinct bullet points run together into one dense paragraph, exactly as seen in the user's screenshot (FlexiSpot EN1 product).

## Required fix

In `src/app/(public)/products/[slug]/page.tsx` (line 179 as currently read), add the Tailwind `whitespace-pre-line` utility to that `<p>` element's className, alongside the existing classes — this preserves stored newlines as visible line breaks while still allowing normal text wrapping within each line (unlike `whitespace-pre`, which would also preserve runs of spaces and disable wrapping — not wanted here).

## Global Constraints

- Only that one `<p>` element's className in `src/app/(public)/products/[slug]/page.tsx` changes. Do not touch the Create Product form, the description `<textarea>`, `productCreationCommand.ts`, or any other page that might render `product.description` (check `ProductSchema.tsx`/`productMetadata.ts`'s usages found via grep — those feed `<meta>` tags and JSON-LD, not visible HTML, so they are unaffected by this CSS-only change and must not be touched).
- No database migration, no change to how descriptions are stored — this is a pure rendering fix for text that's already correctly saved.
- Existing products whose descriptions have no newlines must render identically to before (this change is a no-op for them).

---

### Task 1: Apply the fix (test first)

**Files:** `src/app/(public)/products/[slug]/page.tsx`, and a test for it — check whether this page already has any rendering test coverage (search for an existing test file covering `products/[slug]/page.tsx`); if one exists, add a case there following its existing pattern; if none exists, decide whether a full page-render test is proportionate for a one-class CSS fix, or whether manual verification alone (Task 2) is sufficient — don't invent a new heavyweight test harness just for this line, but don't skip verification either.

- [ ] **Step 1:** If adding a test, write it to fail first: a Product whose `description` contains embedded newlines (e.g. `"Line one.\nLine two."`) renders with the `whitespace-pre-line` class present on the paragraph containing the description text.
- [ ] **Step 2:** Add `whitespace-pre-line` to the existing className string on that `<p>` (line 179).
- [ ] **Step 3:** Run the test (if added) and the full suite: PASS, no regressions.

### Task 2: Verification and evidence

- [ ] **Step 1:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 2:** Manually verify in dev against a disposable database: create or reuse a Product whose `description` contains multiple lines (e.g. update the real FlexiSpot-style test description with embedded `\n` characters between the bullet sentences) and confirm the product detail page now shows each line on its own line instead of one run-on paragraph. Also confirm a Product with a single-line description still renders identically to before.
- [ ] **Step 3:** Record evidence in `artifacts/preserve-description-line-breaks/evidence.md`: before/after rendered markup or a description of the visual difference, test output, and confirmation the single-line regression case is unaffected.
- [ ] **Step 4:** Push the branch, open a PR against `main`. Do not merge locally.

**After this lands:** multi-line descriptions (e.g. copied from Amazon's bulleted feature list) display readably on the product detail page instead of collapsing into one dense paragraph.
