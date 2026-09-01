# Index no-wrap repair — historical Round 2 audit review package

## Scope and TDD evidence

- **Approved source change:** only the index-toggle submit button in `src/app/(admin)/admin/products/page.tsx` gains `inline-flex items-center justify-center whitespace-nowrap` before its existing geometry and state classes.
- **Regression contract:** `tests/adminVisualPolishRound2.test.ts` requires that exact class prefix and the intact translated full-label expression: `product.is_indexed ? translations.products.index.disable : translations.products.index.enable`.
- **RED:** `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts` produced **3 pass / 1 expected fail**. The failing assertion found the missing index-button class prefix.
- **GREEN:** the same focused command produced **4 pass / 0 fail** after the source-only class addition.

## Whole-history audit checklist

| # | Requirement | Evidence / finding | Status |
| --- | --- | --- | --- |
| 1 | IBM Plex Sans is Admin-only; public root/default `PublicBadge` stays unchanged. | `src/app/(admin)/layout.tsx` owns the IBM Plex variable and `src/app/globals.css` scopes it to `#admin-theme-root`; public `src/components/ui/Badge.tsx` is unchanged. Search finds its imports only under public routes. | Pass |
| 2 | Every Admin status badge has 6px first-child dot+tint and original semantic hues, including eligible green. | `AdminStatusBadge` has `h-[6px] w-[6px]` first child and explicit tinted mappings. The `brand`/eligible mapping retains green `#15803D` / `#22C55E` light and `#86EFAC` / `#4ADE80` dark. Products/specification sources use this Admin-only component. | Pass |
| 3 | Actions are exactly two rows; lifecycle, Save, and Index share 34px/radius/padding/text geometry; index is inline-flex/center/no-wrap and retains full labels/forms/ARIA/fields/actions. | Products source keeps a single `flex flex-nowrap` first row and specifications link sibling second row. The index button now has the required display/centering/no-wrap classes plus unchanged 34px, 7px, 12px, and 13px geometry. Required contract asserts translation expression, hidden fields, disabled, and ARIA description. | Pass |
| 4 | Save uses exact dark primary tokens and dark 700 weight. | `globals.css` retains `#7C93AC` and `#101418` dark tokens. The Save class retains `font-semibold dark:font-bold`. | Pass |
| 5 | Source Type/Confidence widths and portal direction are correct; Source Type clears to real empty FormData without sentinel leak; Confidence opens above badge. | `ProductSpecificationsForm` retains two `sm:col-span-2` controls. Source Type leaf uses unnamed Select + one hidden input mapping its private sentinel to `''`; Confidence uses `SelectContent side="top"`. Existing contracts cover these behaviors. | Pass |
| 6 | Header segmented group/theme values and accessibility remain intact. | Locale has `role="group"`, translated `aria-label`, and `aria-pressed`; theme control retains translated `aria-label`, visible translated state labels, and Lucide icons. | Pass |
| 7 | Admin badge default border is zero-specificity and tint classes can win, with no `!important`. | `globals.css` uses `:where(#admin-theme-root *)`; no stronger wildcard selector or `!important` was introduced for this rule. | Pass |
| 8 | Public routes/tables/hydration/i18n/session/action contracts remain untouched. | Scoped diff changes only the Products button class plus its source contract. Existing relevant suites cover table scroll, translations, hydration initialization, locale persistence, and publishing/spec action behavior. | Pass pending command verification |

## Required verification record

- **Focused RED:** `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts` — 3 pass / 1 expected fail, caused solely by the absent required index-button display/no-wrap classes.
- **Focused GREEN:** same command — 4 pass / 0 fail.
- **Relevant suite:** `node --experimental-test-module-mocks --import tsx --test tests/adminProductPublishing.test.ts tests/adminI18n.test.ts tests/adminShadcnFoundation.test.ts tests/adminProductCreationPage.test.ts tests/adminVisualPolishRound2.test.ts tests/adminVisualDirectionWarmInkSlate.test.ts tests/productSpecificationsForm.test.ts tests/productSpecificationsPage.test.ts tests/productSpecificationsAction.test.ts` — 77 pass / 0 fail.
- **Lint:** `npm run lint` — pass (0 warnings permitted).
- **Typecheck:** `npm run typecheck` — blocked by pre-existing/stale user-HMR generated `.next/dev/types/app/(admin)/admin/products/[id]/specifications/page.ts` error for the `createProductSpecificationsPage` test factory export. `.next` was not cleared and port 3200 was not stopped/restarted, as required.
- **Diff check:** `git diff --check` — pass.
- **Impeccable detector:** `node C:\laragon\www\deskholt\.agents\skills\impeccable\scripts\detect.mjs --json src/app/(admin)/admin/products/page.tsx` — `[]` (no findings).
- **GitNexus `detect-changes`:** attempted immediately before commit with `npx gitnexus detect-changes --repo deskholt`; installed CLI reports `error: unknown command 'detect-changes'`. No workaround was used.
