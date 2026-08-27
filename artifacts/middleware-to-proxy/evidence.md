# Middleware → Proxy Migration Evidence

Date: 2026-08-28
Branch: `middleware-to-proxy-migration`
Worktree: `C:\laragon\www\deskholt-middleware-to-proxy`

## Scope

- Renamed `src/middleware.ts` to `src/proxy.ts` with the official Next.js codemod.
- Renamed only the exported convention handler: `middleware` → `proxy`.
- Added `tests/adminMiddleware.test.ts` for the Admin fail-closed gate.
- No database schema, auth primitive, route matcher, deployment, or populated database changes.

## Impact analysis

Command:

```text
npx gitnexus impact middleware --repo deskholt --direction upstream --include-tests
```

Result: LOW risk, 0 direct callers, 0 affected indexed processes/modules. This is expected for a Next.js convention entrypoint invoked by the framework rather than imported by application code.

## Behavioral baseline and migration proof

Pre-migration focused baseline against `src/middleware.ts`: 4/4 PASS.

Assertions:

1. `/admin/login` bypasses authentication without redirect.
2. `/admin/products` without a cookie or with an invalid token redirects to `/admin/login?from=%2Fadmin%2Fproducts`.
3. `/admin/products` with a valid session token passes through.
4. Matcher remains exactly `['/admin/:path*']`, excluding public routes.

After the codemod, the stale test import failed with `MODULE_NOT_FOUND` for `src/middleware.ts`, proving the test still targeted the old convention. Updating only the import/handler name to `src/proxy.ts` / `proxy` restored GREEN: 4/4 PASS.

## Verification

- Full Node suite: 175/175 PASS.
- ESLint: PASS, zero warnings.
- TypeScript no-emit: PASS.
- Production build: PASS against an owned disposable loopback PostgreSQL 18 cluster with both migrations applied.
- Build output reports `ƒ Proxy (Middleware)` and contains no middleware-file deprecation warning.
- Manual built-app smoke at `http://127.0.0.1:3201`:
  - `/admin/products` → HTTP 307, `location: /admin/login?from=%2Fadmin%2Fproducts`.
  - `/admin/login` → HTTP 200, no redirect loop.
- Disposable server and PostgreSQL cluster were stopped and removed after verification.
- `git diff --check`: PASS.

## Semantic review

The following behavior remains unchanged:

- `ADMIN_SESSION_COOKIE` import and cookie lookup.
- `isValidSessionToken` fail-closed validation.
- Exact `/admin/login` bypass.
- Redirect target `/admin/login`.
- `from` query parameter populated from the original pathname.
- Matcher scope `/admin/:path*`.

Source search found no direct imports or calls to the old `middleware` export. The remaining word “middleware” in `src/lib/admin/auth.ts` is documentation describing the runtime and is not a code reference.

## GitNexus change-detection limitation

The installed GitNexus CLI exposes no `detect-changes` command. Impact analysis was completed before editing, and final scope was checked with `git status`, source search, `git diff --check`, and rename/diff review before the dedicated migration commit.
