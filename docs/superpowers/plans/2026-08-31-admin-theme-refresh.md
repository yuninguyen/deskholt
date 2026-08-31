# Admin Theme Refresh (Dark/Light Toggle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dark/light theme toggle scoped to `/admin/*` routes, retrofit the 5 existing admin pages to it, and convert the product list from cards to a compact table — without touching the public site's theme.

**Architecture:** Tailwind's selector-based dark mode (`darkMode: ['selector', '[data-theme="dark"]']`) scopes `dark:` variants to a `data-theme` attribute set on a wrapper `<div>` inside a new `src/app/(admin)/layout.tsx` — never on the shared `<html>`/`<body>` in `src/app/layout.tsx`. A tiny inline script (its own `<script>` tag, first child of the wrapper) reads `localStorage` / `prefers-color-scheme` and sets `data-theme` before the rest of the wrapper paints, avoiding a flash of the wrong theme. A client-side `ThemeToggle` button flips the attribute and persists the choice.

**Tech Stack:** Next.js 16 App Router (Server Components), React 19, Tailwind CSS 3.4.10, TypeScript.

**Spec:** `docs/superpowers/specs/2026-08-31-admin-theme-refresh-design.md`

## Global Constraints

- Scope is `src/app/(admin)/**` and `src/components/admin/**` only. Never add `dark:` classes, touch `src/app/layout.tsx`, or touch any file under `src/app/(public)/**` or `src/app/page.tsx`-equivalents for the public site.
- No change to `brand` color values or fonts in `tailwind.config.ts` — only the `darkMode` key is added.
- No new business logic, no new server actions, no change to any `actions.ts` or `src/lib/**` file — every existing `<form action={...}>` keeps its exact `name`/`value` attributes and wiring; only surrounding markup/classes change.
- No automated tests are added for this plan (presentational-only change, per spec's Testing section) — every task's verification is `npm run typecheck`, `npm run lint`, and a manual browser check in both themes.

## Style Tokens Reference

Every task below uses these exact class pairs. Copy them verbatim — don't improvise variations.

| Purpose | Classes |
|---|---|
| Page background | `bg-gray-50 dark:bg-gray-950` |
| Page/body text | `text-gray-900 dark:text-gray-100` |
| Card/panel | `rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-2xl dark:shadow-black/40` |
| H1 | `text-2xl font-bold text-gray-900 dark:text-white` |
| Muted/subtitle text | `text-sm text-gray-500 dark:text-gray-400` |
| Field label | `mb-1 block text-sm font-medium text-gray-700 dark:text-white` |
| Text/url/password/number input, select, textarea | `w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white` |
| Primary button | `rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30` |
| Secondary/outline button | `rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-brand-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-brand-500` |
| Pill — neutral | `rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300` |
| Pill — success (active/indexed) | `rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300` |
| Pill — brand (effective access) | `rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300` |
| Error banner | `rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300` |
| Success banner | `rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300` |
| Warning banner | `rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300` |
| Link | `text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300` |
| Table container | `overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800` |
| Table head row | `bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400` |
| Table cell border | `border-b border-gray-200 last:border-b-0 dark:border-gray-800` |

---

### Task 1: Enable selector-based dark mode in Tailwind config

**Files:**
- Modify: `tailwind.config.ts:1-9`

**Interfaces:**
- Consumes: nothing.
- Produces: `dark:` variant compiles against `[data-theme="dark"]` ancestor instead of `<html class="dark">`. Every later task's `dark:`-prefixed classes rely on this.

- [ ] **Step 1: Add the `darkMode` key**

Edit `tailwind.config.ts` so the top of the file reads exactly:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
```

Leave everything from `theme: {` onward (colors, fontFamily, borderRadius, plugins) exactly as-is.

- [ ] **Step 2: Verify the config still type-checks**

Run: `npm run typecheck`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat(admin): enable selector-based dark mode for admin theme toggle"
```

---

### Task 2: Admin layout, ThemeToggle, and FOUC-avoidance script

**Files:**
- Create: `src/components/admin/ThemeToggle.tsx`
- Create: `src/app/(admin)/layout.tsx`

**Interfaces:**
- Consumes: nothing new (no props).
- Produces: every admin page (Tasks 3–6) now renders inside a wrapper `<div id="admin-theme-root" data-theme="...">` provided by this layout — pages no longer need their own `min-h-screen` / outer background wrapper, they render directly as `children`.

- [ ] **Step 1: Create `ThemeToggle.tsx`**

```tsx
'use client';

export default function ThemeToggle() {
  function handleClick() {
    const root = document.getElementById('admin-theme-root');
    if (!root) return;
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try {
      window.localStorage.setItem('admin-theme', next);
    } catch {
      // localStorage unavailable (private browsing) — toggle still works for this page view.
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Toggle light/dark theme"
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:border-brand-400 dark:border-gray-700 dark:text-gray-200 dark:hover:border-brand-500"
    >
      <span className="dark:hidden">🌙 Dark</span>
      <span className="hidden dark:inline">☀️ Light</span>
    </button>
  );
}
```

- [ ] **Step 2: Create `src/app/(admin)/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import ThemeToggle from '@/components/admin/ThemeToggle';

const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('admin-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    document.currentScript.parentElement.setAttribute('data-theme', theme);
  } catch (e) {}
})();
`;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div
      id="admin-theme-root"
      data-theme="dark"
      className="min-h-screen bg-gray-50 text-gray-900 dark:bg-gray-950 dark:text-gray-100"
    >
      {/* eslint-disable-next-line react/no-danger */}
      <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      <header className="border-b border-gray-200 bg-white px-6 py-3 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Deskholt Admin</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no errors. (If ESLint flags `dangerouslySetInnerHTML` even with the disable comment, remove the comment and instead confirm the rule isn't enabled by checking `.eslintrc*` for `react/no-danger` — only add the disable comment back if the rule actually fires.)

- [ ] **Step 4: Manual check**

Run `npm run dev`, visit `http://localhost:3000/admin/products` (log in first via `/admin/login` if redirected). Confirm:
- A header bar with "Deskholt Admin" and a toggle button appears above the page content.
- Clicking the toggle flips the page between light and dark backgrounds instantly, and the button label swaps between "🌙 Dark" and "☀️ Light".
- Reloading the page keeps the last-chosen theme (no flash of the other theme).

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ThemeToggle.tsx "src/app/(admin)/layout.tsx"
git commit -m "feat(admin): add admin layout with dark/light theme toggle"
```

---

### Task 3: Retrofit the login page

**Files:**
- Modify: `src/app/(admin)/admin/login/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `loginAction` from `./actions` (unchanged import, unchanged usage).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the file contents**

```tsx
import { loginAction } from './actions';

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  const { from, error } = await searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <form
        action={loginAction}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-2xl dark:shadow-black/40"
      >
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Deskholt Admin</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Nhập mật khẩu admin để tiếp tục.</p>
        </div>

        {from && <input type="hidden" name="from" value={from} />}

        {error && (
          <p className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Sai mật khẩu. Vui lòng thử lại.
          </p>
        )}

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">
            Mật khẩu
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoFocus
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30"
        >
          Đăng nhập
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual check**

Visit `/admin/login` in both themes (toggle in the header still works here since it's inside the shared layout). Confirm the form is readable and the error banner (append `?error=1` to the URL) renders correctly in both themes.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)/admin/login/page.tsx"
git commit -m "style(admin): retrofit login page to dark/light theme tokens"
```

---

### Task 4: Convert the product list to a themed table

**Files:**
- Modify: `src/app/(admin)/admin/products/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `productPublishingAction` from `./actions` (unchanged), `evaluateProductAccess`/`ProductAccessReason` from `@/lib/products/productAccessPolicy` (unchanged), `prisma` from `@/lib/prisma` (unchanged).
- Produces: nothing consumed by later tasks. (The "Offers (N)" link to the future `/admin/products/[id]/offers` page is intentionally NOT added here — that belongs to the separate AffiliateLink Offers plan.)

- [ ] **Step 1: Replace the file contents**

```tsx
import Link from 'next/link';
import { ProductStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { evaluateProductAccess, type ProductAccessReason } from '@/lib/products/productAccessPolicy';
import { productPublishingAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS: ProductStatus[] = ['DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED'];

const LIFECYCLE_LABELS: Record<ProductStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  BLOCKED: 'Blocked',
  ARCHIVED: 'Archived',
};

const EFFECTIVE_ACCESS_LABELS: Record<ProductAccessReason, string> = {
  eligible: 'Eligible for public listings and indexing',
  'explicit-noindex': 'Public, excluded from indexing',
  draft: 'Draft—not public',
  blocked: 'Blocked—not public',
  archived: 'Archived—not public',
};

const PUBLISHING_ERROR_MESSAGES: Record<string, string> = {
  'invalid-input': 'Invalid publishing request. Review the Product and command values, then try again.',
  missing: 'Product could not be found. Refresh the list before trying another publishing command.',
  'active-only': 'Set the lifecycle to Active before enabling indexing.',
  'concurrency-conflict': 'This Product changed while the command was running. Review its current state and retry.',
};

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; productId?: string }>;
}) {
  const query = await searchParams;
  const errorMessage = query.error
    ? PUBLISHING_ERROR_MESSAGES[query.error] ?? 'Publishing action could not be completed. Review the Product state and try again.'
    : undefined;
  const products = await prisma.product.findMany({
    where: { category: 'standing-desks' },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { product_attributes: true } },
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Standing Desks — Admin</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage product publication and search-index visibility.
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30"
        >
          + New Product
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {query.saved && (
          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            Saved successfully. The affected Product is highlighted below.
          </p>
        )}
        {errorMessage && (
          <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Publishing action rejected. {errorMessage}
          </p>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Lifecycle</th>
              <th className="px-4 py-3">Index</th>
              <th className="px-4 py-3">Attrs</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900/40">
            {products.map((product) => {
              const decision = evaluateProductAccess(product);
              const isActive = product.status === 'ACTIVE';
              const isFeedbackTarget = query.productId === product.id;
              const isEnableDisabled = !isActive && !product.is_indexed;
              const enableIndexHelpId = `enable-index-help-${product.id}`;
              return (
                <tr
                  key={product.id}
                  id={`product-${product.id}`}
                  tabIndex={isFeedbackTarget ? 0 : undefined}
                  className={`border-b border-gray-200 last:border-b-0 align-top focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 dark:border-gray-800 ${
                    isFeedbackTarget ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                  }`}
                >
                  <td className="px-4 py-4">
                    <div className="font-semibold text-gray-900 dark:text-white">{product.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-500">{product.slug}</div>
                    <div className="mt-2">
                      <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300">
                        {EFFECTIVE_ACCESS_LABELS[decision.reason]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {LIFECYCLE_LABELS[product.status]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      {product.is_indexed ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-700 dark:text-gray-300">
                    {product._count.product_attributes}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="command" value="set-lifecycle" />
                        <label className="sr-only" htmlFor={`status-${product.id}`}>Lifecycle</label>
                        <select
                          id={`status-${product.id}`}
                          name="status"
                          defaultValue={product.status}
                          autoFocus={isFeedbackTarget}
                          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                        >
                          {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{LIFECYCLE_LABELS[status]}</option>)}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30"
                        >
                          Save
                        </button>
                      </form>

                      <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="command" value={product.is_indexed ? 'disable-index' : 'enable-index'} />
                        <button
                          type="submit"
                          disabled={isEnableDisabled}
                          aria-describedby={isEnableDisabled ? enableIndexHelpId : undefined}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 enabled:hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:enabled:hover:border-brand-500"
                        >
                          {product.is_indexed ? 'Disable index' : 'Enable index'}
                        </button>
                        {isEnableDisabled && (
                          <span id={enableIndexHelpId} className="max-w-56 text-xs text-amber-700 dark:text-amber-300">
                            Set lifecycle to Active to enable indexing.
                          </span>
                        )}
                      </form>

                      <Link
                        href={`/admin/products/${product.id}/specifications`}
                        className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Edit specifications ({product._count.product_attributes}) →
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-500">
            Chưa có Standing Desk product nào.
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual check**

Visit `/admin/products` in both themes. Confirm:
- Products render as table rows (not cards), with all 4 columns plus Actions populated per row.
- The lifecycle select + Save button still changes status (test on one product), and the enable/disable index button still works, exactly as before.
- The amber highlight still appears on the row matching `?productId=` after a save redirect.
- The zero-products empty state still renders when there are no Standing Desk products (temporarily filter `where` in a scratch query if needed to confirm, then revert — do not leave test changes in the file).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)/admin/products/page.tsx"
git commit -m "style(admin): convert product list from cards to themed table"
```

---

### Task 5: Retrofit the Create Product page

**Files:**
- Modify: `src/app/(admin)/admin/products/new/page.tsx` (full rewrite)

**Interfaces:**
- Consumes: `createProductAction` from `../actions` (unchanged), `prisma` from `@/lib/prisma` (unchanged). Keeps the exported `createNewProductPage` factory and its `NewProductPageDependencies` type unchanged (used for testability) — only JSX/className content changes.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace the file contents**

```tsx
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { createProductAction } from '../actions';

export const dynamic = 'force-dynamic';

type Category = { slug: string; name: string };

type NewProductPageProps = {
  searchParams: Promise<{ error?: string }>;
};

type NewProductPageDependencies = {
  findCategories(): Promise<Category[]>;
  action(formData: FormData): void | Promise<void>;
};

const CREATION_ERROR_MESSAGES: Record<string, string> = {
  'invalid-input': 'Review the required Product fields and try again.',
  'category-missing': 'The selected Category no longer exists. Refresh and choose another Category.',
  'slug-taken': 'That Product slug is already in use. Choose a different slug.',
};

export function createNewProductPage({
  findCategories,
  action,
}: NewProductPageDependencies) {
  return async function NewProductPage({ searchParams }: NewProductPageProps) {
    const [query, categories] = await Promise.all([searchParams, findCategories()]);
    const errorMessage = query.error
      ? CREATION_ERROR_MESSAGES[query.error] ?? 'Product could not be created. Review the form and try again.'
      : undefined;

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">
            ← Products
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">Create Product</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Create the Product identity, then continue to specifications.
          </p>
        </div>

        {errorMessage && (
          <p aria-live="polite" className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            Product creation rejected. {errorMessage}
          </p>
        )}

        <form action={action} className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900/60 dark:shadow-2xl dark:shadow-black/40">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Name</label>
            <input id="name" name="name" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Slug</label>
            <input id="slug" name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">Lowercase letters, digits, and hyphens only.</p>
          </div>

          <div>
            <label htmlFor="categorySlug" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Category</label>
            <select id="categorySlug" name="categorySlug" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
              <option value="">Select a Category</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="brandName" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Brand name <span className="text-gray-500 dark:text-gray-500">(optional)</span></label>
            <input id="brandName" name="brandName" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Description</label>
            <textarea id="description" name="description" required rows={4} className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">Image URL</label>
            <input id="imageUrl" name="imageUrl" type="url" required className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <div>
            <label htmlFor="upcCode" className="mb-1 block text-sm font-medium text-gray-700 dark:text-white">UPC/SKU <span className="text-gray-500 dark:text-gray-500">(optional)</span></label>
            <input id="upcCode" name="upcCode" className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
            <input name="isSustainable" type="checkbox" value="on" className="rounded border-gray-300 bg-white text-brand-600 dark:border-gray-700 dark:bg-gray-800" />
            Sustainable product
          </label>

          <button type="submit" className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30">
            Create Product
          </button>
        </form>
      </div>
    );
  };
}

export default createNewProductPage({
  findCategories: () => prisma.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } }),
  action: createProductAction,
});
```

- [ ] **Step 2: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual check**

Visit `/admin/products/new` in both themes. Confirm every field is legible, the error banner renders correctly (submit with an empty required field to trigger `?error=invalid-input`), and submitting a valid product still redirects to its specifications page as before.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(admin)/admin/products/new/page.tsx"
git commit -m "style(admin): retrofit create-product page to dark/light theme tokens"
```

---

### Task 6: Retrofit the specifications page and form

**Files:**
- Modify: `src/app/(admin)/admin/products/[id]/specifications/page.tsx` (full rewrite)
- Modify: `src/components/admin/products/ProductSpecificationsForm.tsx` (full rewrite)

**Interfaces:**
- Consumes: `saveSpecificationsAction` from `./actions`, `takeSpecificationDraft`/`loadSpecificationData` from `@/lib/products/*` (unchanged imports/usage). `ProductSpecificationsForm` keeps its exact prop signature `{ data: SpecificationData; draft?: SpecificationDraftRows; action: (formData: FormData) => void | Promise<void> }`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Replace `src/app/(admin)/admin/products/[id]/specifications/page.tsx`**

```tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { takeSpecificationDraft } from '@/lib/products/specificationDraftStore';
import { loadSpecificationData } from '@/lib/products/specificationRows';
import ProductSpecificationsForm from '@/components/admin/products/ProductSpecificationsForm';
import { saveSpecificationsAction } from './actions';

export const dynamic = 'force-dynamic';

type ProductSpecificationsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string; count?: string; detail?: string; draft?: string }>;
};

export function createProductSpecificationsPage({ takeDraft }: { takeDraft: typeof takeSpecificationDraft }) {
  return async function ProductSpecificationsPage({ params, searchParams }: ProductSpecificationsPageProps) {
  const { id } = await params;
  const { saved, error, count, detail, draft: draftToken } = await searchParams;
  const draft = draftToken ? takeDraft(id, draftToken) ?? undefined : undefined;

  const productExists = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!productExists) {
    return notFound();
  }

  const data = await loadSpecificationData(prisma, id);

  if (!data) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-6 py-8 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          Category cho sản phẩm này chưa được khai báo trong Attribute Engine — chưa có attribute nào để nhập.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-500 dark:hover:text-gray-300">
            ← Products
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{data.product.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{data.categoryName}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 dark:text-gray-400">Completeness</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {data.completeness.met}/{data.completeness.total}
          </div>
        </div>
      </div>

      {saved && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
          Đã lưu specifications thành công.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300 space-y-1">
          <div className="font-semibold">
            {count} dòng có lỗi, chưa lưu được — vui lòng sửa và lưu lại.
          </div>
          {detail && <div className="text-red-600 dark:text-red-400">{detail}</div>}
        </div>
      )}

      <ProductSpecificationsForm data={data} draft={draft} action={saveSpecificationsAction} />
    </div>
  );
  };
}

export default createProductSpecificationsPage({ takeDraft: takeSpecificationDraft });
```

- [ ] **Step 2: Replace `src/components/admin/products/ProductSpecificationsForm.tsx`**

```tsx
import type { SpecificationDraftRows } from '@/lib/products/specificationDraftStore';
import type { SpecificationData, SpecRow } from '@/lib/products/specificationRows';

const SOURCE_TYPES = ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'] as const;
const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;

const FIELD_CLASS =
  'w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white';

function SpecRowFields({ row, draft }: { row: SpecRow; draft?: SpecificationDraftRows[string] }) {
  const existing = row.existing;
  const existingValue =
    row.dataType === 'BOOLEAN'
      ? existing?.valueBoolean === null || existing?.valueBoolean === undefined
        ? ''
        : String(existing.valueBoolean)
      : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER'
        ? existing?.valueNumber ?? ''
        : existing?.valueString ?? '';
  const value = draft?.value ?? existingValue;
  const allowedEnumValues = row.allowedValues ?? [];
  const staleEnumValue =
    row.dataType === 'ENUM' && value !== '' && !allowedEnumValues.includes(String(value))
      ? String(value)
      : null;
  const staleEnumHelpId = `${row.rowKey}-stale-enum`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-3 border-b border-gray-200 last:border-b-0 dark:border-gray-800">
      <div className="sm:col-span-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {row.label}
          {row.isRequired && row.scope !== 'DERIVED' && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
        </div>
        {row.unit && <div className="text-xs text-gray-500 dark:text-gray-500">{row.unit}</div>}
        {row.scope === 'DERIVED' && (
          <div className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400 mt-0.5">Derived / suy luận</div>
        )}
      </div>

      <div className="sm:col-span-2">
        {row.dataType === 'BOOLEAN' ? (
          <select
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className={FIELD_CLASS}
          >
            <option value="">—</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : row.dataType === 'ENUM' ? (
          <div className="space-y-1">
            <select
              name={`value__${row.rowKey}`}
              defaultValue={value}
              aria-invalid={staleEnumValue !== null}
              aria-describedby={staleEnumValue !== null ? staleEnumHelpId : undefined}
              className={FIELD_CLASS}
            >
              <option value="">—</option>
              {staleEnumValue !== null && (
                <option value={staleEnumValue}>{staleEnumValue} (stored value — no longer allowed)</option>
              )}
              {allowedEnumValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {staleEnumValue !== null && (
              <p id={staleEnumHelpId} role="alert" className="text-xs text-amber-700 dark:text-amber-300">
                Giá trị ENUM đã lưu không còn nằm trong danh sách cho phép. Chọn giá trị mới trước khi lưu.
              </p>
            )}
          </div>
        ) : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER' ? (
          <input
            type="number"
            step={row.dataType === 'INTEGER' ? '1' : 'any'}
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className={FIELD_CLASS}
          />
        ) : (
          <input
            type="text"
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className={FIELD_CLASS}
          />
        )}
        {(row.unit === 'in' || row.unit === 'lb') && (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER') && (
          <select
            name={`sourceUnit__${row.rowKey}`}
            defaultValue={row.unit === 'in'
              ? (draft?.sourceUnit === 'cm' ? 'cm' : 'in')
              : (draft?.sourceUnit === 'kg' ? 'kg' : 'lb')}
            className={`mt-2 ${FIELD_CLASS}`}
          >
            {row.unit === 'in' ? <><option value="in">in</option><option value="cm">cm</option></> : <><option value="lb">lb</option><option value="kg">kg</option></>}
          </select>
        )}
      </div>

      <div className="sm:col-span-4">
        <input
          type="text"
          name={`sourceUrl__${row.rowKey}`}
          placeholder="Source URL"
          defaultValue={draft?.sourceUrl ?? existing?.sourceUrl ?? ''}
          className={FIELD_CLASS}
        />
      </div>

      <div className="sm:col-span-2">
        <select
          name={`sourceType__${row.rowKey}`}
          defaultValue={draft?.sourceType ?? existing?.sourceType ?? ''}
          className={FIELD_CLASS}
        >
          <option value="">Source type</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-1">
        <select
          name={`confidence__${row.rowKey}`}
          defaultValue={draft?.confidence ?? existing?.confidence ?? 'UNVERIFIED'}
          className={FIELD_CLASS}
        >
          {CONFIDENCES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ProductSpecificationsForm({
  data,
  draft,
  action,
}: {
  data: SpecificationData;
  draft?: SpecificationDraftRows;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const productRows = data.rows.filter((r) => r.variantId === null);
  const activeVariants = data.variants.filter((v) => v.isActive);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="productId" value={data.product.id} />
      <section>
        <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">Product-level</h2>
        <div className="rounded-2xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900/60">
          {productRows.map((row) => (
            <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} />
          ))}
          {productRows.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-500">Không có attribute product-level nào.</div>
          )}
        </div>
      </section>

      {activeVariants.length === 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          {data.variants.length === 0
            ? 'Sản phẩm này chưa có Variant. Hãy tạo Variant trước để nhập specs cấp Variant.'
            : 'Sản phẩm này không có Variant đang hoạt động. Hãy tạo hoặc kích hoạt Variant trước để nhập specs cấp Variant.'}
        </div>
      )}

      {activeVariants.map((variant) => {
        const rows = data.rows.filter((r) => r.variantId === variant.id);
        if (rows.length === 0) return null;
        return (
          <section key={variant.id}>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-2">
              Variant: {variant.label}
            </h2>
            <div className="rounded-2xl border border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900/60">
              {rows.map((row) => (
                <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} />
              ))}
            </div>
          </section>
        );
      })}

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-500 dark:shadow-lg dark:shadow-black/30"
      >
        Lưu Specifications
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual check**

Visit `/admin/products/[id]/specifications` for an existing product in both themes. Confirm all field types (boolean select, enum select with stale-value warning if applicable, decimal/integer number input, text input, source URL, source type, confidence) are legible in both themes, and saving still works exactly as before (redirects with `?saved=1`).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(admin)/admin/products/[id]/specifications/page.tsx" src/components/admin/products/ProductSpecificationsForm.tsx
git commit -m "style(admin): retrofit specifications page and form to dark/light theme tokens"
```

---

### Task 7: Full regression pass and public-site spot check

**Files:** none (verification only).

**Interfaces:** none.

- [ ] **Step 1: Run the full check script**

Run: `npm run check`
Expected: lint, typecheck, tests, and build all pass with no errors (this project has no automated tests for this presentational change, so `npm test` should show the existing suite passing unchanged).

- [ ] **Step 2: Manual regression pass on every retrofitted admin page, both themes**

With `npm run dev` running, for each of `/admin/login`, `/admin/products`, `/admin/products/new`, `/admin/products/[id]/specifications`: toggle to light, then to dark, and confirm text stays legible (no white-on-white or gray-on-gray), focus outlines are visible, and every form still submits and redirects exactly as before this plan (compare against the behavior notes captured in Tasks 3–6's manual-check steps).

- [ ] **Step 3: Public-site spot check**

Visit `/`, a `/category/[slug]` page, and a `/products/[slug]` page. Confirm they render exactly as before this plan — no visual change, no `dark:` styling leaking in (there is nothing to toggle on these pages; this is purely confirming isolation from the admin theme change).

- [ ] **Step 4: Final commit (if any cleanup was needed)**

If Steps 1–3 required no code changes, there is nothing to commit here — Tasks 1–6 already committed the full change. If a regression was found and fixed, commit it:

```bash
git add -A
git commit -m "fix(admin): address regression found in theme-refresh regression pass"
```
