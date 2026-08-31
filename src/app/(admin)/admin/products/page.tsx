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

      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-800">
        <table className="min-w-[900px] w-full border-collapse text-sm">
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
