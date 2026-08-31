# Task 2 Report — Typed EN/VI i18n, Header, and Locale Layout

## Delivered

- Added typed Admin dictionaries for English and Vietnamese, including the full current and future Task 3–6 Admin copy audit.
- Added `Locale`, `Dictionary`, dictionary registry, safe English-fallback resolver, and SSR-safe client translation hook backed by localStorage plus the `admin-locale-change` event.
- Added a server-safe cookie resolver that awaits Next 16 `cookies()` before resolving `admin-locale`.
- Added `LocaleToggle` and reusable `AdminHeader`; updated `ThemeToggle` to use dictionary text without emoji icons.
- Updated only the Admin route-group layout to preserve `#admin-theme-root`, `data-theme="dark"`, and `suppressHydrationWarning`, while setting SSR `data-locale="en"` and restoring validated stored locale before paint.
- No public route/component, shared root layout, server action, or existing form name/action contract was changed.

## TDD evidence

- RED: `npm test -- tests/adminI18n.test.ts` failed as expected because `@/lib/admin/i18n` did not exist (`MODULE_NOT_FOUND`).
- GREEN: the same command passed after implementation: 326 tests total, 318 passed, 0 failed, 8 skipped.

## Verification

- `npm run typecheck` passed.
- `npm run lint` passed with zero warnings.
- `git diff --check` passed.
- Protected-path audit showed only `src/app/(admin)/layout.tsx` and `src/components/admin/ThemeToggle.tsx` among tracked modifications; no root layout, public path, or action diff was present.

## GitNexus

- Impact/context checks for `AdminLayout`, `ThemeToggle`, and `handleClick` reported the exact limitation: target symbol not found. The current index is otherwise up to date.
- The installed GitNexus CLI exposes no `detect-changes` command, so the required `gitnexus_detect_changes()` MCP operation was unavailable; scope was instead verified with Git status and protected-path diffs.

## Review fix round

- Split pure i18n types, dictionaries, and locale resolvers into `shared.ts`; the `client.ts` entrypoint is explicitly `'use client'` and exclusively owns `useSyncExternalStore`.
- `server.ts` now imports only shared code and adds `getAdminTranslations()` for Server Component consumers.
- Added behavior coverage for invalid, absent, and failed-localStorage values falling back to the validated Admin root locale, allowing client translations to update after the LocaleToggle event even when storage is unavailable.
- Applied `font-body` to the Admin root and header title, retaining `font-mono` only on the EN/VI locale control.
- Review RED: the focused suite failed as expected because `@/lib/admin/i18n/shared` did not exist. Review GREEN: `npm test -- tests/adminI18n.test.ts` passed with 319 passes, 0 failures, and 8 skips.
- Review verification: `npm run typecheck`, `npm run lint`, and `git diff --check` passed.

## Scope note

`PRODUCT.md` was already untracked in the worktree and is intentionally excluded from the Task 2 commit.
