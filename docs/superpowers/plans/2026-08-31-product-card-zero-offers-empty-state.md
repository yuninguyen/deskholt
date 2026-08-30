# ProductCard: graceful empty state for zero AffiliateLinks

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:test-driven-development for each task; use superpowers:using-git-worktrees to isolate this work in its own branch/worktree before touching code.

**Goal:** Fix a real UX gap found by the user's first real usage of the new Admin Create Product UI (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md`) — a Product created with zero `AffiliateLink` rows (by design: the Create Product UI deliberately doesn't create AffiliateLinks, see the earlier "Admin Create Product UI" follow-up) renders on the homepage as:

```
Best price from
N/A

[ Compare 0 stores → ]
```

This looks like broken/missing data rather than a normal, expected state ("this product has no merchant listings yet"). Every prior product (all 7 P2 dry-run products, all 20 legacy seed products) always had at least one `AffiliateLink`, so this zero-offer rendering path was never actually exercised in production until now.

## Required fix

In `src/components/ui/ProductCard.tsx`, when `linkCount === 0`:
- Replace the "Best price from" / `N/A` price block with a clearly-labeled placeholder state (e.g. "Price coming soon" or similar wording — pick text consistent with this site's existing tone, check `src/lib/products/productStructuredData.ts`'s existing availability/freshness label conventions for a similarly-worded precedent rather than inventing new copy from scratch) instead of showing a bare "N/A" that reads as an error.
- Replace the CTA button text "Compare 0 stores →" with wording that doesn't reference a store count of zero (e.g. "View product →"), while keeping the same link target (`/products/${slug}`) and the same visual style/classes — this is a copy-only change to the button label when `linkCount === 0`, not a new component or a different link destination.
- When `linkCount > 0`, keep every existing behavior byte-for-byte identical (same price formatting, same "Compare {linkCount} stores →" text) — this fix only changes what renders in the zero-offer case.

## Global Constraints

- Only `src/components/ui/ProductCard.tsx` changes. Do not touch the homepage (`src/app/(public)/page.tsx`), the category page, `PriceTable.tsx`, or any data-fetching logic — this component already receives `lowestPrice`/`linkCount` as props; the fix is purely about what it renders with those prop values, not how they're computed.
- Do not add a new prop to gate this behavior — derive it from `linkCount === 0` (and/or `lowestPrice === undefined`, whichever the current code already uses as the "no price" signal — check both are consistent) since that's the same signal already available.
- No new dependencies.

---

### Task 1: Empty-state rendering (tests first)

**Files:** `src/components/ui/ProductCard.tsx`, `tests/productCard.test.ts` (new — follow the same `renderToStaticMarkup` pattern already used in `tests/productSpecificationsForm.test.ts`, don't introduce a different testing approach)

- [ ] **Step 1:** Write failing tests: with `linkCount: 0` (and `lowestPrice: undefined`), the rendered markup does NOT contain the literal string `N/A`, does NOT contain `Compare 0 stores`, and DOES contain whatever the chosen placeholder copy is; with `linkCount: 1` and a real `lowestPrice`, the rendered markup is unchanged from current behavior (still shows the formatted price and `Compare 1 stores →` — or whatever exact plural/singular wording already exists, don't introduce singular/plural grammar correctness as new scope unless it's a one-line change you're already touching for the zero case).
- [ ] **Step 2:** Implement the change to pass.
- [ ] **Step 3:** Run the test file and the full suite: PASS, no regressions.

### Task 2: Verification and evidence

- [ ] **Step 1:** Confirm `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` are all green.
- [ ] **Step 2:** Manually verify in dev against a disposable database: seed or create one Product with zero AffiliateLinks (status Active + indexed so it appears on the homepage/category listing) and confirm the card shows the new placeholder copy instead of "N/A"/"Compare 0 stores", while an existing product with real AffiliateLinks still renders exactly as before.
- [ ] **Step 3:** Record evidence in `artifacts/product-card-zero-offers-empty-state/evidence.md`: test output, the exact before/after markup for the zero-offer case, and the manual verification transcript.
- [ ] **Step 4:** Push the branch, open a PR against `main`. Do not merge locally.

**After this lands:** a Product created via the Admin Create Product UI (which has no AffiliateLink yet) displays a clear "not priced yet" state instead of looking broken, until a real merchant listing is added for it.
