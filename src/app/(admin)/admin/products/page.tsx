import Link from 'next/link';
import { ProductStatus } from '@prisma/client';
import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
      _count: { select: { product_attributes: true, affiliate_links: true } },
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
          className="rounded-lg bg-admin-primary px-3 py-2 text-sm font-semibold text-admin-primary-foreground shadow-sm hover:bg-admin-primary/90"
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
                    <AdminStatusBadge variant={accessVariant[decision.reason]}>{accessLabels[decision.reason]}</AdminStatusBadge>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <AdminStatusBadge variant={lifecycleVariant[product.status]}>{lifecycleLabels[product.status]}</AdminStatusBadge>
                </TableCell>
                <TableCell className="px-4 py-4">
                  <AdminStatusBadge variant={product.is_indexed ? 'success' : 'outline'}>
                    {product.is_indexed ? translations.products.index.enabled : translations.products.index.disabled}
                  </AdminStatusBadge>
                </TableCell>
                <TableCell className="px-4 py-4 text-admin-foreground tabular-nums">
                  {product._count.product_attributes}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div>
                    <div className="flex flex-nowrap items-center gap-2">
                      <form action={productPublishingAction} className="contents">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="command" value="set-lifecycle" />
                        <label className="sr-only" htmlFor={`status-${product.id}`}>{translations.products.table.lifecycle}</label>
                        <Select name="status" defaultValue={product.status}>
                          <SelectTrigger
                            id={`status-${product.id}`}
                            autoFocus={isFeedbackTarget}
                            className="box-border h-[34px] rounded-[7px] px-3 py-0 text-[13px] font-semibold"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{lifecycleLabels[status]}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <button
                          type="submit"
                          className="box-border h-[34px] rounded-[7px] bg-admin-primary px-3 text-[13px] font-semibold dark:font-bold text-admin-primary-foreground shadow-sm hover:bg-admin-primary/90"
                        >
                          {translations.products.actions.save}
                        </button>
                      </form>
                      <form action={productPublishingAction} className="contents">
                        <input type="hidden" name="productId" value={product.id} />
                        <input type="hidden" name="command" value={product.is_indexed ? 'disable-index' : 'enable-index'} />
                        <button
                          type="submit"
                          disabled={isEnableDisabled}
                          aria-describedby={isEnableDisabled ? enableIndexHelpId : undefined}
                          className="inline-flex items-center justify-center whitespace-nowrap box-border h-[34px] rounded-[7px] border border-admin-input px-3 text-[13px] font-semibold text-admin-foreground enabled:hover:border-admin-primary disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {product.is_indexed ? translations.products.index.disable : translations.products.index.enable}
                        </button>
                      </form>
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="text-xs text-admin-primary hover:text-admin-primary/90"
                      >
                        {translations.products.actions.edit} →
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/specifications`}
                        className="text-xs text-admin-primary hover:text-admin-primary/90"
                      >
                        {translations.products.actions.editSpecifications} ({product._count.product_attributes}) →
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/offers`}
                        className="text-xs text-admin-primary hover:text-admin-primary/90"
                      >
                        {translations.products.actions.offers} ({product._count.affiliate_links}) →
                      </Link>
                    </div>

                    {isEnableDisabled && (
                      <span id={enableIndexHelpId} className="mt-2 block max-w-56 text-xs text-amber-700 dark:text-amber-300">
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
