import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { ArrowRight, Leaf, ShieldCheck, Sparkles, Zap } from 'lucide-react';

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
      <section className="relative overflow-hidden rounded-3xl glass-card p-8 md:p-16 border border-white/10">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Multi-Store Real-Time Price Comparison
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-tight">
            Curated Home-Office & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-emerald-400 to-teal-300">
              Desk Setup Intelligence
            </span>
          </h1>
          <p className="text-lg text-gray-300 leading-relaxed">
            Stop overpaying for your desk setup. We aggregate multi-store prices (Amazon, Walmart, Target) with aggregated real-user sentiment analysis to help you build the perfect workspace.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/category/standing-desks"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold shadow-lg shadow-brand-500/25 transition-all hover:scale-105"
            >
              Explore Standing Desks <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/category/standing-desks?eco=true"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl glass-card hover:bg-white/10 text-gray-200 font-semibold border border-white/10 transition-all"
            >
              <Leaf className="w-4 h-4 text-brand-500" /> Eco-Friendly Setup
            </Link>
          </div>
        </div>
      </section>

      {/* Category Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Explore Categories</h2>
            <p className="text-sm text-gray-400">Discover top-rated gear tailored for ergonomic productivity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group p-6 rounded-2xl glass-card hover:border-brand-500/50 transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {cat.icon}
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-brand-500 transition-colors">
                {cat.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">{cat.count}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products Grid with Multi-Store Prices */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Featured Gear & Price Comparison</h2>
            <p className="text-sm text-gray-400">Real-time best pricing across Amazon, Walmart & Target</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => {
            const lowestPrice = product.affiliate_links[0]?.price;
            const linkCount = product.affiliate_links.length;

            return (
              <div
                key={product.id}
                className="group rounded-2xl glass-card overflow-hidden border border-white/10 flex flex-col hover:border-brand-500/40 transition-all hover:shadow-xl hover:shadow-brand-500/5"
              >
                <div className="relative h-56 w-full bg-dark-800 overflow-hidden">
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
                    <span className="text-xs uppercase tracking-wider text-brand-500 font-semibold">
                      {product.category.replace('-', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1 group-hover:text-brand-500 transition-colors line-clamp-2">
                      <Link href={`/products/${product.slug}`}>{product.name}</Link>
                    </h3>
                    <p className="text-xs text-gray-400 mt-2 line-clamp-2">{product.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-400 block">From Multi-Store</span>
                      <span className="text-xl font-extrabold text-white">
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
      </section>
    </div>
  );
}
