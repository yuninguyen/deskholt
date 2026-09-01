# Admin Visual Polish — Round 2 SDD ledger

## Task 1 — Font, admin badge treatment, Actions controls, specs widths, header controls

### Preflight
- User approved the proposed bounded implementation design in chat.
- Existing linked worktree: `feat/admin-redesign-shadcn-i18n`.
- `npm test` baseline launched as job `pwsh-95`.
- GitNexus impacts: `AdminProductsPage`, `ProductSpecificationsForm`, and `Badge` are LOW (0 callers/processes); `AdminLayout`, `LocaleToggle`, and `ThemeToggle` are absent from index.
- Badge audit: default `PublicBadge` is rendered by public product card/pages. The named `Badge` is currently imported only by Admin sources. Ruling: introduce an Admin-only semantic status Badge component and migrate only Admin uses, preserving the public default Badge and shared public type exports. This makes public visual isolation structural rather than dependent on import conventions. Cost if wrong: a missed Admin status use; targeted all-Admin import/source tests and review will detect it.
- Ruling: IBM Plex Sans is instantiated in the Admin layout and exposed only as `--font-admin-sans` on `#admin-theme-root`; CSS scopes the inherited body font and rescinds `.font-body` Inter declarations inside Admin, but leaves `.font-mono` unchanged. Cost if wrong: admin text could remain Inter; source-contract and runtime build tests guard it.
- Ruling: The plan says `existing icon + Dark/Light`, but current ThemeToggle has text only. Add existing project Lucide theme glyphs (not emoji) to meet the final visual spec while retaining the accessible label/text; cost if wrong is an import/render issue covered by typecheck and source test.

### RED evidence
- Added `tests/adminVisualPolishRound2.test.ts` before production edits.
- Command: `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts`
- Result: 4 failures / 0 passes. The Admin layout lacked `IBM_Plex_Sans`; the Admin-only badge source was absent; Actions still used the previous wrapped layout; dark primary/header/grid controls still used prior values. The first preliminary run also confirmed the new Admin badge file was absent; the test was then made resilient so it asserted the absence as ordinary failures rather than a file-read error.

### GREEN implementation
- Added Admin-only `AdminStatusBadge` with a literal first-child 6px dot, low-opacity tint and border treatments in light/dark variants; migrated all named Admin lifecycle/access/index/derived/confidence uses only.
- Scoped IBM Plex Sans 500/600/700 to `#admin-theme-root` as `--font-admin-sans`; preserved root/public font setup and IBM Plex Mono labels.
- Rebuilt Products Actions into a no-wrap first row with separate sibling forms and 34px controls, then the specifications link alone on row two; field names, hidden values, actions, disabled and ARIA contracts are unchanged. The direct table `overflow-x-auto` and `min-w-[900px]` remain.
- Updated dark primary/ring to `#7C93AC`, dark primary foreground to `#101418`, widened Source Type/Confidence spans while keeping the 12-column total, and added exact segmented locale plus Lucide-icon theme control geometry.

### Verification
- Focused Admin command: `node --experimental-test-module-mocks --import tsx --test tests/adminProductPublishing.test.ts tests/adminI18n.test.ts tests/adminShadcnFoundation.test.ts tests/adminProductCreationPage.test.ts tests/adminVisualPolishRound2.test.ts tests/adminVisualDirectionWarmInkSlate.test.ts` — 35 pass, 0 fail.
- `npm test` — 333 pass, 0 fail, 8 skipped (341 total).
- `npm run typecheck` — pass. A first run exposed stale generated `.next` page types; clearing only generated `.next` and rerunning produced a clean pass.
- `npm run lint` — pass.
- `git diff --check` — pass.
- Impeccable detector command run over changed Admin targets. It returned one advisory only: pre-existing public `.bg-paper-grid` two-axis gradient in changed shared `src/app/globals.css` (line 79), which is out of scope and intentionally untouched; no Admin target finding.

### Review correction — brand semantic hue
- Review identified a semantic regression: `accessVariant.eligible` maps to `brand`, whose pre-change palette was green. The initial Admin-only implementation incorrectly assigned this status the slate primary hue.
- RED: updated `tests/adminVisualPolishRound2.test.ts` first to require `brand` light `rgba(34,197,94,0.08/.18)`, `#15803D`, `#22C55E`, and dark `rgba(74,222,128,0.10/.18)`, `#86EFAC`, `#4ADE80`. Command: `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts`; result: 1 expected failure / 3 pass, showing the current slate `#445263/#7C93AC` implementation.
- GREEN: changed only `AdminStatusBadge` `brand` container and dot classes to that green semantic palette; retained geometry, mappings, all other variants, contracts, and public isolation. Updated the existing semantic palette assertions to match.
- Verification: `node --experimental-test-module-mocks --import tsx --test tests/adminVisualPolishRound2.test.ts tests/adminVisualDirectionWarmInkSlate.test.ts tests/adminProductPublishing.test.ts` — 21 pass, 0 fail. `npm run typecheck`, `npm run lint`, and `git diff --check` — pass.
