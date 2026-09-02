# Admin UI Hardening SDD ledger

- User approved client-only slug auto-fill, product edit command/server lifecycle gate, and authenticated export-only catalog JSON backup.
- Binding plan: `docs/superpowers/plans/2026-09-03-admin-ui-hardening.md`.
- Execution plan: `docs/superpowers/plans/2026-09-03-admin-ui-hardening-execution.md`.
- Task 1 pending: client slug autofill without any create server contract change.

## Task 1 evidence — Client slug autofill fields

- **Impact analysis:** `NewProductPage` test symbol: 0 upstream dependents, 0 affected processes, LOW. `createNewProductPage`: 1 direct file-level caller, 0 affected processes, LOW. `SlugAutoFillFields` and the existing FormData-contract test symbol were absent from the GitNexus index before creation/update.
- **RED:** `node --experimental-test-module-mocks --import tsx --test tests/slugAutoFillFields.test.ts` failed as expected because `SlugAutoFillFields` was absent.
- **GREEN:** focused slug and new-product page tests passed: 7 tests, 0 failures.
- **Form contract:** `name="name"`, `slug="slug"`, required state, slug pattern, labels, and help text remain in the client leaf; the page passes existing translated strings. Server create FormData/action contract is unchanged.
- **Verification:** `npm run lint`, `npm run typecheck`, `git diff --check`, and Impeccable detector passed. The detector returned `[]` for the two changed Admin UI files.
- **GitNexus detector:** attempted `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n`; the installed CLI reports `unknown command 'detect-changes'`.
- **Excluded unrelated worktree changes:** `.claude/skills/gitnexus/*`, root `AGENTS.md`, root `CLAUDE.md`, and `PRODUCT.md` were pre-existing and are not staged for this task.

## Task 1 review follow-up — Direct dirty-state behavior

- **Review finding:** source-regex assertions did not execute the slug dirty-state behavior.
- **Impact analysis:** `SlugAutoFillFields` and `slugify` are not present in the current GitNexus index; the existing component/page interfaces have no change.
- **RED:** direct transition tests failed because `transitionSlugAutoFill` was not exported (`TypeError: ... is not a function`).
- **GREEN:** direct pure-state sequences passed for untouched name updates, customized-slug freeze, and manually cleared-slug freeze; focused component/page suite: 9 tests, 0 failures.
- **Verification:** `npm run lint`, `npm run typecheck`, and `git diff --check` passed. Impeccable detector returned `[]` for `SlugAutoFillFields.tsx`. GitNexus detector was re-attempted and remains unsupported by the installed CLI (`unknown command 'detect-changes'`).

## Task 3 evidence — Edit action, page, translations, and Products link

- **Impact analysis:** `AdminProductsPage`, `en`, and `vi` each reported LOW risk: zero direct callers and zero affected processes. The Task 2 edit-command symbols are not indexed yet, so their callers could not be reported.
- **RED:** `node --experimental-test-module-mocks --import tsx --test tests/productEditActions.test.ts tests/adminProductEditPage.test.ts` failed as expected because the edit action/page, translation keys, and edit-link contract were absent.
- **GREEN:** focused edit/action/command/Products tests passed: 32 tests, 0 failures.
- **Action contract:** authentication precedes parsing/store access; success revalidates `/`, then `/admin/products`, then redirects to the saved editor. Rejections redirect to that editor with the command reason and do not invalidate.
- **Page contract:** Promise route props, `notFound()` lookup guard, Admin tokenized Card fields, DRAFT-only `slugEditable=1`, locked-slug help, no category input, Radix Checkbox, and translated EN/VI text are covered.
- **Verification:** `npm test` passed (393 passed, 8 skipped, 0 failed); `npm run typecheck`, `npm run lint`, and `git diff --check` passed. Impeccable detector returned `[]` for the edit and Products pages. `npx gitnexus detect-changes --repo admin-redesign-shadcn-i18n` was attempted and the installed CLI reports `unknown command 'detect-changes'`.
- **Excluded unrelated worktree changes:** `.claude/skills/gitnexus/*`, root `AGENTS.md`, root `CLAUDE.md`, and `PRODUCT.md` were pre-existing and are not staged for this task.
