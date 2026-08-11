import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Filter, Leaf, Sparkles } from 'lucide-react';

export const revalidate = 86400; // ISR: 24h

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { eco?: string };
}) {
  const { slug } = params;
  const isEcoFilter = searchParams.eco === 'true';

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
      <div className="glass-card rounded-2xl p-8 border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-brand-500 font-semibold mb-1">
            Category Hub
          </div>
          <h1 className="text-3xl font-extrabold text-white capitalize">{categoryName}</h1>
          <p className="text-sm text-gray-400 mt-1">
            Showing {products.length} verified products with multi-store price comparisons.
          </p>
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center gap-3 bg-dark-800 p-1.5 rounded-xl border border-white/10">
          <Link
            href={`/category/${slug}`}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
              !isEcoFilter
                ? 'bg-brand-600 text-white shadow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All Products
          </Link>
          <Link
            href={`/category/${slug}?eco=true`}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
              isEcoFilter
                ? 'bg-brand-600 text-white shadow'
                : 'text-gray-400 hover:text-brand-500'
            }`}
          >
            <Leaf className="w-3.5 h-3.5" /> Eco-Friendly Only
          </Link>
        </div>
      </div>

      {/* Product List */}
      {products.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center text-gray-400">
          No products found matching your active filters in this category.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => {
            const lowestLink = product.affiliate_links[0];
            const lowestPrice = lowestLink?.price;
            const linkCount = product.affiliate_links.length;

            return (
              <div
                key={product.id}
                className="group rounded-2xl glass-card overflow-hidden border border-white/10 flex flex-col hover:border-brand-500/40 transition-all"
              >
                <div className="relative h-52 w-full bg-dark-800">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.is_sustainable && (
                    <div className="absolute top-3 left-3 bg-dark-900/90 backdrop-blur border border-brand-500/30 text-brand-500 text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium">
                      <Leaf className="w-3.5 h-3.5" /> Sustainable
                    </div>
                  )}
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h2 className="text-base font-bold text-white group-hover:text-brand-500 transition-colors line-clamp-2">
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </h2>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">Lowest Price</span>
                      <span className="text-lg font-extrabold text-white">
                        ${lowestPrice ? lowestPrice.toFixed(2) : 'N/A'}
                      </span>
                    </div>

                    <Link
                      href={`/products/${product.slug}`}
                      className="px-4 py-2 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-500 border border-brand-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      Compare {linkCount} Stores <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
