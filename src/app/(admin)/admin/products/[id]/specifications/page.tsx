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
        <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-6 py-8 text-sm text-amber-300">
          Category cho sản phẩm này chưa được khai báo trong Attribute Engine — chưa có attribute nào để nhập.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/products" className="text-xs text-gray-500 hover:text-gray-300">
            ← Products
          </Link>
          <h1 className="text-2xl font-bold text-white mt-1">{data.product.name}</h1>
          <p className="text-sm text-gray-400">{data.categoryName}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Completeness</div>
          <div className="text-xl font-bold text-white">
            {data.completeness.met}/{data.completeness.total}
          </div>
        </div>
      </div>

      {saved && (
        <div className="rounded-md border border-emerald-800 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">
          Đã lưu specifications thành công.
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300 space-y-1">
          <div className="font-semibold">
            {count} dòng có lỗi, chưa lưu được — vui lòng sửa và lưu lại.
          </div>
          {detail && <div className="text-red-400">{detail}</div>}
        </div>
      )}

      <ProductSpecificationsForm data={data} draft={draft} action={saveSpecificationsAction} />
    </div>
  );
  };
}

export default createProductSpecificationsPage({ takeDraft: takeSpecificationDraft });
