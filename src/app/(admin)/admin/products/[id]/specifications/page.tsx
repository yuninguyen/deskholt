import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { takeSpecificationDraft } from '@/lib/products/specificationDraftStore';
import { loadSpecificationData } from '@/lib/products/specificationRows';
import ProductSpecificationsForm from '@/components/admin/products/ProductSpecificationsForm';
import { saveSpecificationsAction } from './actions';
import { getAdminTranslations } from '@/lib/admin/i18n/server';

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
    const translations = await getAdminTranslations();

    if (!data) {
      return (
        <div className="mx-auto max-w-3xl">
          <div className="border border-amber-500/30 bg-amber-500/10 px-6 py-8 text-sm text-amber-800 dark:text-amber-300">
            {translations.specifications.categoryUnavailable}
          </div>
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-admin-border pb-5">
          <div>
            <Link href="/admin/products" className="text-xs text-admin-muted-foreground hover:text-admin-foreground">
              ← {translations.specifications.back}
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-admin-foreground">{data.product.name}</h1>
            <p className="text-sm text-admin-muted-foreground">{data.categoryName}</p>
          </div>
          <div className="text-right">
            <div className="font-mono text-xs font-semibold uppercase tracking-wide text-admin-muted-foreground">
              {translations.specifications.completeness}
            </div>
            <div className="text-xl font-bold tabular-nums text-admin-foreground">
              {data.completeness.met}/{data.completeness.total}
            </div>
          </div>
        </div>

        {saved && (
          <div className="border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-800 dark:text-emerald-300">
            {translations.specifications.saved}
          </div>
        )}

        {error && (
          <div className="space-y-1 border border-admin-destructive/30 bg-admin-destructive/10 px-4 py-3 text-sm text-admin-destructive">
            <div className="font-semibold">
              {count} {translations.specifications.errors.rowsInvalid}
            </div>
            {detail && <div>{detail}</div>}
          </div>
        )}

        <ProductSpecificationsForm data={data} draft={draft} action={saveSpecificationsAction} />
      </div>
    );
  };
}

export default createProductSpecificationsPage({ takeDraft: takeSpecificationDraft });
