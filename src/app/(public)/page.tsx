import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Leaf } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import type { BadgeProps } from '@/components/ui/Badge';

export const revalidate = 86400; // ISR: 24h

export default async function HomePage() {
  const products = await prisma.product.findMany({
    where: { is_indexed: true },
    include: {
      affiliate_links: {
        where: { is_in_stock: true },
        orderBy: { price: 'asc' },
      },
    },
    take: 6,
  });

  const categories = [
    { title: 'Standing Desks', slug: 'standing-desks', count: '240+ Models', icon: '🪑' },
    { title: 'Ergonomic Chairs', slug: 'ergonomic-chairs', count: '180+ Models', icon: '🛋️' },
    { title: 'Desk Lighting', slug: 'lighting', count: '90+ Models', icon: '💡' },
    { title: 'Cable Management', slug: 'cable-management', count: '120+ Accessories', icon: '🔌' },
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="rounded-lg border border-blueprint/30 bg-blueprint-soft p-8 md:p-16">
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-walnut/20 bg-walnut-soft px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-walnut">
            Multi-Store Real-Time Price Comparison
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-6xl">
            Curated Home-Office &amp; Desk Setup Intelligence
          </h1>
          <p className="text-lg leading-relaxed text-ink-soft">
            Stop overpaying for your desk setup. We aggregate multi-store prices (Amazon, Walmart, Target) with aggregated real-user sentiment analysis to help you build the perfect workspace.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/category/standing-desks"
              className="inline-flex items-center gap-2 rounded-sm bg-blueprint px-6 py-3.5 font-display font-semibold text-white transition-colors hover:bg-blueprint-deep"
            >
              Explore Standing Desks <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/category/standing-desks?eco=true"
              className="inline-flex items-center gap-2 rounded-sm border border-line-strong bg-card px-6 py-3.5 font-display font-semibold text-ink transition-colors hover:border-ink"
            >
              <Leaf className="h-4 w-4 text-sage" /> Eco-Friendly Setup
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Explore Categories</h2>
            <p className="text-sm text-ink-soft">Discover top-rated gear tailored for ergonomic productivity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="rounded-lg border border-line-strong bg-card p-6 transition-colors hover:border-walnut/50"
            >
              <div className="mb-4 text-4xl">{cat.icon}</div>
              <h3 className="font-display text-lg font-semibold text-ink">{cat.title}</h3>
              <p className="mt-1 text-xs text-ink-faint">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid with Multi-Store Prices */}
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Featured Gear &amp; Price Comparison</h2>
            <p className="text-sm text-ink-soft">Real-time best pricing across Amazon, Walmart &amp; Target</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const lowestPrice = product.affiliate_links[0]?.price;
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
      </section>
    </div>
  );
}
