# Historical final re-review package

## Scope and TDD evidence

This re-review covers the full historical Round 2 checklist independently after two narrowly scoped repairs:

1. The lifecycle `SelectTrigger` in `src/app/(admin)/admin/products/page.tsx` now adds `py-0`, overriding the shared Select trigger's inherited `py-1`. Its full class contract is `box-border h-[34px] rounded-[7px] px-3 py-0 text-[13px] font-semibold`, which produces 0px vertical and 12px horizontal padding while retaining height, radius, typography, and horizontal padding.
2. `SpecificationSourceTypeSelect` now exports `mapSourceTypeSelection`. The function maps the private `__clear-source-type__` sentinel to `''` and returns a valid source-type value unchanged; `onValueChange` calls it. The leaf remains an unnamed `Select` and exactly one real named hidden input.

### TDD record

- **RED:** `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts tests/productSpecificationsForm.test.ts` → **9 pass / 3 expected fail**. Failures were precisely absent lifecycle `py-0`, absent exported mapping function/handler use, and absent mapping function export.
- **GREEN:** the same command → **12 pass / 0 fail**.
- The new direct behavioral test invokes `mapSourceTypeSelection('__clear-source-type__')` and expects `''`, then invokes `mapSourceTypeSelection('MANUFACTURER')` and expects `'MANUFACTURER'`.

## Independent all-history eight-point checklist

| # | Requirement | Independent source and test evidence | Result |
| --- | --- | --- | --- |
| 1 | IBM Plex Sans remains Admin-only; public root/default `PublicBadge` remains unchanged. | `src/app/(admin)/layout.tsx` instantiates `IBM_Plex_Sans` only for `#admin-theme-root`; `globals.css` scopes `--font-admin-sans` there. `src/components/ui/Badge.tsx` retains the separate `PublicBadge` implementation and has no Admin font/status import. `adminVisualPolishRound2.test.ts` verifies this isolation. | Pass |
| 2 | Every Admin status badge has the 6px first-child dot+tint and original semantic hues, including eligible green. | `AdminStatusBadge.tsx` has a first child with `h-[6px] w-[6px]`, tint mappings, and green `brand`/eligible values `#15803D`/`#22C55E` light and `#86EFAC`/`#4ADE80` dark. Products/specification sources consume this Admin-only component. | Pass |
| 3 | Actions remain exactly two rows; lifecycle, Save, and Index retain 34px/r7/12px/13px contracts and form/i18n/ARIA fields/actions. | Products source retains a non-wrapping first controls row and separate specifications-link row. Lifecycle now exactly has `h-[34px] rounded-[7px] px-3 py-0 text-[13px] font-semibold`; Save and Index retain their approved geometry. `adminProductPublishing`, `adminVisualPolishRound2`, and `adminVisualDirectionWarmInkSlate` verify submission, full translated labels, disabled/ARIA state, and layout contracts. | Pass |
| 4 | Save retains exact dark-primary tokens and dark 700 weight. | `globals.css` retains `#7C93AC` / `#101418` dark-primary tokens. Products Save class retains `font-semibold dark:font-bold`. Covered by `adminVisualPolishRound2.test.ts`. | Pass |
| 5 | Source Type/Confidence widths and portal direction are correct; Source Type clears to real empty FormData without sentinel leakage. | `ProductSpecificationsForm.tsx` retains two `sm:col-span-2` controls. `SpecificationConfidenceSelect.tsx` uses `SelectContent side="top"`. `SpecificationSourceTypeSelect.tsx` keeps an unnamed Select, exactly one `<input type="hidden" name={name} value={selectedValue} />`, and the tested pure mapping to real `''`; `productSpecificationsAction.test.ts` verifies empty source type persists as null where valid. | Pass |
| 6 | Header locale/theme values and accessibility remain intact. | `LocaleToggle.tsx` retains `role="group"`, translated `aria-label`, and `aria-pressed`. `ThemeToggle.tsx` retains translated `aria-label`, translated state labels, and Sun/Moon icons. `adminI18n.test.ts` and `adminVisualPolishRound2.test.ts` pass. | Pass |
| 7 | Admin badge default border selector has zero specificity and tint classes can win without `!important`. | `globals.css` uses `:where(#admin-theme-root *)` for default border/outline values; no strong `#admin-theme-root *` selector or added `!important` applies to this rule. `adminVisualPolishRound2.test.ts` passes this source contract. | Pass |
| 8 | Public routes/tables/hydration/i18n/session/action contracts remain untouched. | Scoped diff is limited to lifecycle padding, Source Type mapping, focused tests, and this record; user-owned `next-env.d.ts` and `PRODUCT.md` are excluded. The relevant historical suite includes publishing actions, i18n/hydration, table layout, create page, specifications page/form/actions and all visual contracts. | Pass |

## Fresh verification

- **Relevant historical suite:** `node --experimental-test-module-mocks --import tsx --test tests/adminProductPublishing.test.ts tests/adminI18n.test.ts tests/adminShadcnFoundation.test.ts tests/adminProductCreationPage.test.ts tests/adminVisualPolishRound2.test.ts tests/adminVisualDirectionWarmInkSlate.test.ts tests/productSpecificationsForm.test.ts tests/productSpecificationsPage.test.ts tests/productSpecificationsAction.test.ts` → **78 pass / 0 fail**.
- **Lint:** `npm run lint` → pass (no warnings).
- **Typecheck:** `npm run typecheck` was attempted and is blocked only by the known stale user-HMR generated `.next/dev/types/app/(admin)/admin/products/[id]/specifications/page.ts` error for the pre-existing `createProductSpecificationsPage` test factory export. `.next` was not cleared and the user-owned HMR process on port 3200 was not stopped or restarted; no workaround was attempted.
- **Diff whitespace:** `git diff --check` → pass. Git reported only normal LF→CRLF working-tree warnings.
- **Impeccable detector:** `node C:\laragon\www\deskholt\.agents\skills\impeccable\scripts\detect.mjs --json 'src/app/(admin)/admin/products/page.tsx' 'src/components/admin/products/SpecificationSourceTypeSelect.tsx'` → `[]`.
- **GitNexus impact:** `AdminProductsPage` → LOW, 0 direct callers, 0 affected processes, 0 modules. `SpecificationSourceTypeSelect` is absent from the current index, matching the pre-edit finding.
- **GitNexus detector:** attempted immediately before commit with `npx gitnexus detect-changes --repo deskholt`; installed CLI result: `error: unknown command 'detect-changes'`. No workaround was used.
