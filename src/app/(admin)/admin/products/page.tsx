import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({
    where: { category: 'standing-desks' },
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { product_attributes: true } },
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Standing Desks — Admin</h1>
        <p className="text-sm text-gray-400 mt-1">
          V1-alpha: chỉ Standing Desks. Nhập specifications cho từng sản phẩm bên dưới.
        </p>
      </div>

      <div className="rounded-xl border border-gray-800 divide-y divide-gray-800">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}/specifications`}
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-900 transition-colors"
          >
            <div>
              <div className="font-semibold text-white">{product.name}</div>
              <div className="text-xs text-gray-500">{product.slug}</div>
            </div>
            <span className="text-xs text-gray-400">
              {product._count.product_attributes} attribute{product._count.product_attributes === 1 ? '' : 's'} đã nhập
            </span>
          </Link>
        ))}
        {products.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-gray-500">
            Chưa có Standing Desk product nào.
          </div>
        )}
      </div>
    </div>
  );
}
