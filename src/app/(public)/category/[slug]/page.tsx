import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Leaf } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import type { BadgeProps } from '@/components/ui/Badge';

export const revalidate = 86400; // ISR: 24h

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ eco?: string }>;
}) {
  const { slug } = await params;
  const { eco } = await searchParams;
  const isEcoFilter = eco === 'true';

  const categoryTitles: Record<string, string> = {
    'standing-desks': 'Standing Desks & Adjustable Workstations',
    'ergonomic-chairs': 'Ergonomic Office & Task Chairs',
    'lighting': 'Desk Lamps & Screen Light Bars',
    'cable-management': 'Cable Management & Desktop Power',
  };

  const categoryName = categoryTitles[slug] || slug.replace('-', ' ');

  const products = await prisma.product.findMany({
    where: {
      category: slug,
      is_indexed: true,
      ...(isEcoFilter ? { is_sustainable: true } : {}),
    },
    include: {
      affiliate_links: {
        where: { is_in_stock: true },
        orderBy: { price: 'asc' },
      },
    },
  });

  if (products.length === 0 && !isEcoFilter) {
    // Return empty list view gracefully if category has no products yet
  }

  return (
    <div className="space-y-8">
      {/* Category Header */}
      <div className="flex flex-col items-start justify-between gap-6 rounded-lg border border-line-strong bg-card p-8 md:flex-row md:items-center">
        <div>
          <div className="mb-1 font-mono text-xs font-semibold uppercase tracking-wider text-walnut">
            Category Hub
          </div>
          <h1 className="font-display text-3xl font-bold capitalize text-ink">{categoryName}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Showing {products.length} verified products with multi-store price comparisons.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-1.5 rounded-lg border border-line-strong bg-paper-alt p-1.5">
          <Link
            href={`/category/${slug}`}
            className={`rounded-sm px-4 py-2 font-display text-xs font-semibold transition-colors ${
              !isEcoFilter ? 'bg-blueprint text-white' : 'text-ink-soft hover:text-ink'
            }`}
          >
            All Products
          </Link>
          <Link
            href={`/category/${slug}?eco=true`}
            className={`flex items-center gap-1.5 rounded-sm px-4 py-2 font-display text-xs font-semibold transition-colors ${
              isEcoFilter ? 'bg-blueprint text-white' : 'text-ink-soft hover:text-sage'
            }`}
          >
            <Leaf className="h-3.5 w-3.5" /> Eco-Friendly Only
          </Link>
        </div>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="rounded-lg border border-line-strong bg-card p-12 text-center text-ink-soft">
          No products found matching your active filters in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const lowestLink = product.affiliate_links[0];
            const lowestPrice = lowestLink?.price;
            const linkCount = product.affiliate_links.length;
            const badges: BadgeProps[] = product.is_sustainable
              ? [{ variant: 'eco', label: 'Eco-Friendly' }]
              : [];

            return (
              <ProductCard
                key={product.id}
                name={product.name}
                slug={product.slug}
                category={product.category}
                imageUrl={product.image_url}
                lowestPrice={lowestPrice}
                linkCount={linkCount}
                badges={badges}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
