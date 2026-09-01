import Link from 'next/link';
import { ProductStatus } from '@prisma/client';
import { Badge } from '@/components/ui/Badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
import { prisma } from '@/lib/prisma';
import { evaluateProductAccess, type ProductAccessReason } from '@/lib/products/productAccessPolicy';
import { productPublishingAction } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_OPTIONS: ProductStatus[] = ['DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED'];

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string; productId?: string }>;
}) {
  const translations = await getAdminTranslations();
  const query = await searchParams;
  const lifecycleLabels: Record<ProductStatus, string> = translations.products.lifecycle;
  const accessLabels: Record<ProductAccessReason, string> = {
    eligible: translations.products.access.eligible,
    'explicit-noindex': translations.products.access.explicitNoindex,
    draft: translations.products.access.draft,
    blocked: translations.products.access.blocked,
    archived: translations.products.access.archived,
  };
  const publishingErrorMessages: Record<string, string> = {
    'invalid-input': translations.products.errors.invalidInput,
    missing: translations.products.errors.missing,
    'active-only': translations.products.errors.activeOnly,
    'concurrency-conflict': translations.products.errors.concurrencyConflict,
  };
  const errorMessage = query.error
    ? publishingErrorMessages[query.error] ?? translations.products.errors.fallback
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
          <h1 className="font-body text-2xl font-bold text-admin-foreground">{translations.products.title}</h1>
          <p className="mt-1 font-body text-sm text-admin-muted-foreground">
            {translations.products.description}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
        >
          {translations.products.newProduct}
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true">
        {query.saved && (
          <p className="rounded-md border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
            {translations.products.saved}
          </p>
        )}
        {errorMessage && (
          <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {translations.products.publishingRejected} {errorMessage}
          </p>
        )}
      </div>

      <Table
        containerClassName="overflow-x-auto rounded-xl border border-admin-border"
        className="min-w-[900px] border-collapse"
      >
        <TableHeader className="bg-admin-muted/50">
          <TableRow className="hover:bg-transparent">
            <TableHead className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">{translations.products.table.product}</TableHead>
            <TableHead className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">{translations.products.table.lifecycle}</TableHead>
            <TableHead className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">{translations.products.table.index}</TableHead>
            <TableHead className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">{translations.products.table.attributes}</TableHead>
            <TableHead className="px-4 py-3 font-mono text-xs font-semibold uppercase tracking-wide">{translations.products.table.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const decision = evaluateProductAccess(product);
            const isActive = product.status === 'ACTIVE';
            const isFeedbackTarget = query.productId === product.id;
            const isEnableDisabled = !isActive && !product.is_indexed;
            const enableIndexHelpId = `enable-index-help-${product.id}`;
            const lifecycleVariant = {
              DRAFT: 'warning',
              ACTIVE: 'success',
              BLOCKED: 'destructive',
              ARCHIVED: 'outline',
            } as const;
            const accessVariant = {
              eligible: 'brand',
              'explicit-noindex': 'neutral',
              draft: 'warning',
              blocked: 'destructive',
              archived: 'outline',
            } as const;
            return (
              <TableRow
                key={product.id}
                id={`product-${product.id}`}
                tabIndex={isFeedbackTarget ? 0 : undefined}
                className={`align-top focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 ${
                  isFeedbackTarget ? 'bg-amber-50 dark:bg-amber-950/20' : ''
                }`}
              >
                <TableCell className="px-4 py-4">
                  <div className="font-body font-semibold text-admin-foreground">{product.name}</div>
                  <div className="font-mono text-xs text-admin-muted-foreground">{product.slug}</div>
                  <div className="mt-2">
                    <Badge variant={accessVariant[decision.reason]}>{accessLabels[decision.reason]}</Badge>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge variant={lifecycleVariant[product.status]}>{lifecycleLabels[product.status]}</Badge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge variant={product.is_indexed ? 'success' : 'outline'}>
                    {product.is_indexed ? translations.products.index.enabled : translations.products.index.disabled}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-admin-foreground tabular-nums">
                  {product._count.product_attributes}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="space-y-2">
                    <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="command" value="set-lifecycle" />
                      <label className="sr-only" htmlFor={`status-${product.id}`}>{translations.products.table.lifecycle}</label>
                      <select
                        id={`status-${product.id}`}
                        name="status"
                        defaultValue={product.status}
                        autoFocus={isFeedbackTarget}
                        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{lifecycleLabels[status]}</option>)}
                      </select>
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-500"
                      >
                        {translations.products.actions.save}
                      </button>
                    </form>

                    <div className="flex flex-wrap items-center gap-2">
                      <form action={productPublishingAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="command" value={product.is_indexed ? 'disable-index' : 'enable-index'} />
                        <button
                          type="submit"
                          disabled={isEnableDisabled}
                          aria-describedby={isEnableDisabled ? enableIndexHelpId : undefined}
                          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 enabled:hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:enabled:hover:border-brand-500"
                        >
                          {product.is_indexed ? translations.products.index.disable : translations.products.index.enable}
                        </button>
                      </form>

                      <Link
                        href={`/admin/products/${product.id}/specifications`}
                        className="text-sm text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        {translations.products.actions.editSpecifications} ({product._count.product_attributes}) →
                      </Link>
                    </div>

                    {isEnableDisabled && (
                      <span id={enableIndexHelpId} className="max-w-56 text-xs text-amber-700 dark:text-amber-300">
                        {translations.products.index.enableHelp}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {products.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="px-5 py-8 text-center text-sm text-admin-muted-foreground">
                {translations.products.empty}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
