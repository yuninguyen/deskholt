# Task 6 Report — Translated QA Specification Inspection Form

## Scope
- Rebuilt only the Admin product specifications page and form, with their focused tests.
- Kept `createProductSpecificationsPage({ takeDraft })`, async route inputs, draft consumption, product lookup, data loading, and `saveSpecificationsAction` intact.
- Kept the form's external `data`, `draft`, and `action` prop contract intact; it now resolves Admin translations server-side.

## Delivered
- Replaced all page/form chrome with `translations.specifications` values.
- Applied Admin Input, Radix/shadcn Select with `name` and `defaultValue`, confidence Badge variants, neutral surfaces, tabular numbers, and `border-admin-border` hairlines.
- Preserved product ID, every row field name, draft/existing values, source-unit logic, stale ENUM alert/ARIA behavior, numeric steps, derived/required display, active-variant filtering, and form action.

## Verification
- RED: focused source contract tests failed before implementation because translation and UI primitive imports were absent.
- GREEN: focused specification tests passed after implementation.
- `npm run typecheck`, `npm run lint`, `git diff --check`, and the Impeccable detector completed successfully.

## Regression fix
- Root cause: Radix Select cannot expose a selectable empty option, so it serialized source type clear actions incorrectly; its server render also omits native option values for unit selectors.
- Reinstated native token-styled selects for clearable Boolean, ENUM, and source type fields, including `value=""` options and conditional stale-ENUM ARIA attributes.
- Added `SpecificationConfidenceSelect`, a compact client leaf that preserves Radix name/default submission and updates its semantic Badge through `onValueChange`.
- Expanded focused tests for clear values, stale ENUM ARIA, field defaults/names/action, unit source defaults/fallbacks, required/derived display, active variants, and confidence state.
