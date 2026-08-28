# Group B-2: AffiliateNetwork/Merchant/MerchantProduct/Offer — DEFERRED

**Decision record, not an implementation plan.** No code changes follow from this document. It exists so this Group B item is not silently forgotten and is not re-litigated from scratch later.

## Question asked

The blueprint's P1 scope list (`docs/DeskHolt-Master-System-Blueprint-V3.1.1.md` §66) names `AffiliateNetwork`, `Merchant`, `MerchantProduct`, `current Offer` as P1 items. §24 explicitly distinguishes them as four separate concepts (`AffiliateNetwork` ≠ `Merchant` ≠ `MerchantProduct` ≠ `Offer`), and §25–27 describe freshness/ranking/network-priority rules that assume real merchant diversity exists.

This plan (Group B-2) was going to be the "architecture-decision-first" step for that work, in the same spirit as the P0-B click-persistence plan's Option A/B step, because it would touch public pricing display (`PriceTable.tsx`, `productPageData.ts`, `productStructuredData.ts`) and the P0-B click/redirect path (`src/app/go/[slug]/route.ts`, `src/lib/clickTracking.ts`).

## Finding (verified by reading the code, not assumed)

`prisma/seed.ts` — the only source of real Product data in this project (no Admin UI for creating products exists) — contains exactly **one** `AffiliateLink.network` value across all seeded products: `'amazon'`. There is no second merchant, no second network, and no real multi-merchant pricing scenario anywhere in the actual data.

## Decision

**Defer Group B-2 entirely.** Do not create `AffiliateNetwork`, `Merchant`, `MerchantProduct`, or `Offer` tables, and do not touch `AffiliateLink`, `/go/[slug]/route.ts`, `PriceTable.tsx`, or `productPageData.ts` for this purpose, until real data contains **two or more distinct merchants/networks**.

This follows the blueprint's own explicit rule, verbatim:

> §27: "Không build integration chỉ vì network tồn tại. Build khi có merchant/product thật cần nó."

It is the same reasoning already applied to Available Options / explicit default variant (§13: don't build a generic option engine before the pattern is validated across multiple real products) — here applied to merchant/offer normalization instead of variant options.

User confirmed this choice explicitly (2026-08-29) when presented with four options ranging from full defer to full build-with-cutover; "Defer toàn bộ" was selected as the recommended option.

## What would trigger revisiting this

Any of:
- A second real merchant/network is added to a Product's `AffiliateLink` set (e.g. a Walmart or direct-brand-program link alongside an Amazon one) for any real, non-placeholder product.
- The P2 ontology stage (10 real Standing Desks, blueprint §66) requires "Merchant listing" / "Current offer" as part of a product's end-to-end completeness — at which point this becomes a P2 blocker, not an optional P1 item, and needs its own architecture-decision-first plan before implementation (same caution as this document, re-evaluated against whatever real merchant data exists at that time).

## Explicitly not deferred by this decision

Everything else in Group B remains as previously scoped:
- Group B-1 (Brand/Category relations) — **done**, merged in PR #7.
- Explicit default variant, Available Options — deferred separately per §13, tracked in the Group B-1 plan's closing note, not this document.
- Admin Identity / Sources / Offers / queue UI — depends on Merchant/Offer modeling existing first, so it is transitively deferred by this same decision until the trigger above occurs.
