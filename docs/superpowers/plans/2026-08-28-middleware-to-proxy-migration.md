# Middleware → Proxy Convention Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (recommended) or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the Next.js 16.3 deprecation warning ("The 'middleware' file convention is deprecated. Please use 'proxy' instead.") by migrating `src/middleware.ts` to the `proxy` convention, with zero change to Admin route-protection behavior.

**Why this is a separate task:** `src/middleware.ts` is the P0-A1 Admin authentication fail-closed gate (`isValidSessionToken` check on `/admin/:path*`). It was intentionally left out of Spec 001 (T017–T021 convergence) and P0-A3 scope because touching it requires its own impact analysis and regression proof, not a side effect of unrelated work.

**Architecture:** Pure rename/convention migration. No change to auth logic, cookie name, matcher scope, or redirect behavior. `export function middleware(...)` becomes `export function proxy(...)`; file renamed per Next.js codemod output.

**Tech Stack:** TypeScript, Next.js 16.3 App Router, Node test runner.

**Current file:** `src/middleware.ts`

```ts
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE, isValidSessionToken } from '@/lib/admin/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login') return NextResponse.next();
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await isValidSessionToken(token)) return NextResponse.next();
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('from', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
```

## Global Constraints

- Do not change `ADMIN_SESSION_COOKIE`, `isValidSessionToken`, the `/admin/login` bypass, the redirect-with-`from` behavior, or the `matcher` scope.
- Run `gitnexus_impact` (or equivalent upstream-caller check) on the `middleware` export before editing, per CLAUDE.md — this is an Admin fail-closed auth gate (P0-A1).
- Behavioral tests must exist and pass before and after the migration; do not rely on the codemod output alone.
- No production/populated database or deployment action is part of this task.

---

### Task 1: Add failing behavioral tests for the Admin route gate (if not already covered)

**Files:**
- Add or confirm: `tests/adminMiddleware.test.ts` (or extend existing admin-auth test file if one already covers this)

**Interfaces:**
- Exercise the exported handler directly (via `next/server` `NextRequest` construction) or via a built-app smoke request.

- [ ] **Step 1: Write/confirm failing-or-passing baseline tests**

  Assert: (a) request to `/admin/login` with no cookie passes through unredirected; (b) request to `/admin/products` with no/invalid session cookie redirects to `/admin/login?from=/admin/products`; (c) request to `/admin/products` with a valid session token passes through; (d) non-`/admin` paths are untouched by the matcher.

- [ ] **Step 2: Run tests against current `middleware.ts` to confirm GREEN baseline**

  Run: `npm test -- tests/adminMiddleware.test.ts`

  Expected: PASS against the pre-migration file. This is the regression baseline the migration must not break.

### Task 2: Run impact analysis before touching the auth gate

- [ ] **Step 1:** Run `gitnexus_impact({ target: "middleware", direction: "upstream" })` (or the closest indexed symbol) and record direct callers/affected flows. If GitNexus cannot resolve the symbol (known limitation noted in Spec 001 convergence evidence), record the attempted query and fall back to manual source inspection of `next.config.*` and any imports of `src/middleware.ts`.
- [ ] **Step 2:** Report risk level. Stop for confirmation only if HIGH/CRITICAL — this change is expected LOW risk (pure rename), but the check must still run and be recorded.

### Task 3: Migrate the convention

- [ ] **Step 1:** Run the official codemod: `npx @next/codemod@canary middleware-to-proxy .`
- [ ] **Step 2:** Manually diff the codemod output against the "Current file" block above. Confirm only the function name (`middleware` → `proxy`) and file location/name changed — cookie name, bypass path, redirect target, query param, and `matcher` config must be byte-identical in meaning.
- [ ] **Step 3:** Update any direct imports/references to the old `middleware` export name if the codemod does not catch them (search: `from '@/middleware'`, `from '\./middleware'`).

### Task 4: Verify GREEN and no regression

- [ ] **Step 1:** Run `npm test -- tests/adminMiddleware.test.ts` — same assertions as Task 1, now against `proxy.ts`. Expected: PASS, unchanged behavior.
- [ ] **Step 2:** Run full suite: `npm test`. Expected: 190/190 (or current total) PASS, no new failures.
- [ ] **Step 3:** Run `npm run lint` and `npx tsc --noEmit`. Expected: clean.
- [ ] **Step 4:** Run `npm run build`. Expected: PASS with **no** middleware/proxy deprecation warning in output.
- [ ] **Step 5:** Manual smoke (dev server): confirm `/admin/products` without a session cookie redirects to `/admin/login?from=/admin/products`, and `/admin/login` itself loads without redirect loop.

### Task 5: Record evidence and scope check

- [ ] **Step 1:** Run `gitnexus_detect_changes()` before commit (or record the same "no `detect-changes` command in installed version" limitation already noted in `artifacts/spec-001/convergence-progress.md` if still applicable).
- [ ] **Step 2:** Confirm `git diff` touches only the middleware/proxy file (rename) and its test file — no unrelated files.
- [ ] **Step 3:** Record a short evidence note (reuse the `artifacts/spec-001/convergence-progress.md` style: impact analysis result, RED/GREEN test evidence, lint/typecheck/build results, final diff scope) in `artifacts/middleware-to-proxy/evidence.md`.

**Do not** bundle this with Spec 001, P0-A3, or any other feature branch's commit — it is scoped, low-risk, but security-adjacent (Admin auth gate) technical debt and should land as its own commit.
