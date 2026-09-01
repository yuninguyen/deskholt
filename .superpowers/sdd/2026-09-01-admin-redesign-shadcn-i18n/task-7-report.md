# Task 7 Report — Repair Cookie-Seeded Admin Locale Hydration

## Scope
- Changed only the approved Admin layout, header/toggles, client i18n hook, and focused i18n test.
- Left routes, actions, public/root layouts, dependencies, and existing theme selection behavior unchanged.

## Delivered
- `AdminLayout` is async, resolves `getAdminLocale()`, and renders its validated server locale in `#admin-theme-root[data-locale]`.
- The prepaint script validates the root locale as its fallback and changes it only for a valid persisted `en` or `vi` value; it preserves `suppressHydrationWarning` and theme persistence.
- `useAdminTranslations(initialLocale = 'en')` uses the passed locale for its server snapshot, while browser resolution remains root-first after hydration.
- `AdminHeader`, `LocaleToggle`, and `ThemeToggle` receive the initial locale, so the Vietnamese title, locale aria label, theme aria label, and theme action server-render in Vietnamese for a Vietnamese cookie.

## TDD Evidence
- RED: `node --experimental-test-module-mocks --import tsx --test tests/adminI18n.test.ts` produced 4 passing and 3 failing tests before the production change. The behavioral render failed because the actual root was `data-locale="en"` and controls rendered English; prepaint fallback also returned `en` instead of cookie-seeded `vi`.
- GREEN: the same focused command passed all 7 tests after implementation, including actual layout/component SSR with mocked `getAdminLocale(): 'vi'`, plus absent, unavailable, invalid, and valid persisted-locale prepaint cases.

## Verification
- `npm run typecheck` — passed.
- `npm run lint` — passed with `--max-warnings=0`.
- `git diff --check` — passed.
- GitNexus impact attempts used `--repo deskholt`, but the current index did not contain `AdminLayout`, `getAdminLocale`, or `useAdminTranslations`; it reported no indexed direct caller/process results for the changed symbols.
- Required GitNexus CLI attempt: `npx gitnexus detect-changes --repo deskholt` exited 1 with `error: unknown command 'detect-changes'`, the known unsupported CLI command.

## Follow-up: LocaleToggle hydration-safe selected state
- Root cause: `LocaleToggle` independently read `document` to derive `aria-pressed`, while its translated label used the hook's server snapshot. A valid persisted override can update the root before hydration, making the two sources disagree during hydration.
- Added `useAdminLocale(initialLocale = 'en')` as the shared `useSyncExternalStore` wrapper. `useAdminTranslations` now consumes it, and `LocaleToggle` consumes it for selected state rather than directly resolving the root from `document`.
- Added an actual `LocaleToggle(initialLocale='vi')` SSR render assertion for Vietnamese label plus `EN=false` / `VI=true`, and a source contract that prohibits the legacy direct `resolveAdminLocale` selection path. The root-first client resolver test additionally proves a prepaint root `en` overrides stored `vi` after hydration.
- Second-cycle RED: focused i18n run had 7 passing and 1 failing source-contract assertion (`const locale = useAdminLocale(initialLocale);` absent). The no-document SSR assertion passed on the legacy fallback branch; the source contract is the regression guard for eliminating the separate hydration source.
- Second-cycle GREEN: focused i18n run passed 8/8; `npm run typecheck`, `npm run lint`, and `git diff --check` passed.
- Repeated required GitNexus CLI attempt: `npx gitnexus detect-changes --repo deskholt` exited 1 with `error: unknown command 'detect-changes'`.
