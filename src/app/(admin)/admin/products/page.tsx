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
          <h1 className="text-2xl font-bold text-white">Standing Desks — Admin</h1>
          <p className="mt-1 text-sm text-gray-400">
            Manage product publication and search-index visibility.
          </p>
        </div>
        <Link href="/admin/products/new" className="rounded bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500">
          + New Product
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {query.saved && (
          <p className="rounded border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
            Saved successfully. The affected Product is highlighted below.
          </p>
        )}
        {errorMessage && (
          <p className="rounded border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
            Publishing action rejected. {errorMessage}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {products.map((product) => {
          const decision = evaluateProductAccess(product);
          const isActive = product.status === 'ACTIVE';
          const isFeedbackTarget = query.productId === product.id;
          const isEnableDisabled = !isActive && !product.is_indexed;
          const enableIndexHelpId = `enable-index-help-${product.id}`;
          return (
            <div
              key={product.id}
              id={`product-${product.id}`}
              tabIndex={isFeedbackTarget ? 0 : undefined}
              className={`rounded-xl border bg-gray-950/30 p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 ${
                isFeedbackTarget
                  ? 'border-amber-600/70 ring-2 ring-amber-500/40'
                  : 'border-gray-800'
              }`}
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="font-semibold text-white">{product.name}</div>
                  <div className="text-xs text-gray-500">{product.slug}</div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="rounded border border-gray-700 px-2 py-1 text-gray-300">
                      Lifecycle saved: {LIFECYCLE_LABELS[product.status]}
                    </span>
                    <span className="rounded border border-gray-700 px-2 py-1 text-gray-300">
                      Index saved: {product.is_indexed ? 'enabled' : 'disabled'}
                    </span>
                    <span className="rounded border border-brand-500/30 px-2 py-1 text-brand-300">
                      Effective access: {EFFECTIVE_ACCESS_LABELS[decision.reason]}
                    </span>
                    <span className="rounded border border-gray-700 px-2 py-1 text-gray-400">
                      {product._count.product_attributes} attribute{product._count.product_attributes === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 lg:min-w-[32rem]">
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="command" value="set-lifecycle" />
                      <label className="sr-only" htmlFor={`status-${product.id}`}>Lifecycle</label>
                      <select
                        id={`status-${product.id}`}
                        name="status"
                        defaultValue={product.status}
                        autoFocus={isFeedbackTarget}
                        className="rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white"
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{LIFECYCLE_LABELS[status]}</option>)}
                      </select>
                      <button type="submit" className="rounded bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-500">Save lifecycle</button>
                    </form>

                    <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="command" value={product.is_indexed ? 'disable-index' : 'enable-index'} />
                      <button
                        type="submit"
                        disabled={isEnableDisabled}
                        aria-describedby={isEnableDisabled ? enableIndexHelpId : undefined}
                        className="rounded border border-gray-700 px-3 py-2 text-sm text-gray-200 enabled:hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {product.is_indexed ? 'Disable index' : 'Enable index'}
                      </button>
                      {isEnableDisabled && (
                        <span id={enableIndexHelpId} className="max-w-56 text-xs text-amber-300">
                          Set lifecycle to Active to enable indexing.
                        </span>
                      )}
                    </form>
                  </div>

                  <Link href={`/admin/products/${product.id}/specifications`} className="text-sm text-brand-400 hover:text-brand-300">
                    Edit specifications ({product._count.product_attributes}) →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
        {products.length === 0 && (
          <div className="rounded-xl border border-gray-800 px-5 py-8 text-center text-sm text-gray-500">
            Chưa có Standing Desk product nào.
          </div>
        )}
      </div>
    </div>
  );
}
