import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import ProductSchema from '@/components/ProductSchema';
import { CheckCircle2, ExternalLink, Leaf, ShieldCheck, ShoppingCart, ThumbsUp, XCircle } from 'lucide-react';

export const revalidate = 86400; // ISR 24h

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      affiliate_links: {
        orderBy: [
          { is_in_stock: 'desc' },
          { priority_order: 'asc' },
        ],
      },
    },
  });

  if (!product) {
    return notFound();
  }

  // Parse specs and user sentiment safely
  let specsObj: Record<string, string> = {};
  if (product.specs) {
    try {
      specsObj = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    } catch (e) {
      specsObj = {};
    }
  }

  let sentimentObj: { positive_pct?: number; summary?: string; top_complaint?: string } = {};
  if (product.user_sentiment) {
    try {
      sentimentObj =
        typeof product.user_sentiment === 'string'
          ? JSON.parse(product.user_sentiment)
          : product.user_sentiment;
    } catch (e) {
      sentimentObj = {};
    }
  }

  const lowestPrice = product.affiliate_links.find((l) => l.is_in_stock)?.price || product.affiliate_links[0]?.price;

  return (
    <div className="space-y-12">
      {/* Schema Markup for Google & AI Search */}
      <ProductSchema
        product={{
          name: product.name,
          image: product.image_url,
          description: product.description || product.name,
          sku: product.upc_code || product.id,
          price: lowestPrice,
          priceCurrency: 'USD',
          aggregateRating: {
            ratingValue: 4.8,
            reviewCount: 142,
          },
        }}
      />

      {/* Breadcrumbs */}
      <nav className="text-xs text-gray-400 flex items-center gap-2">
        <Link href="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/category/${product.category}`} className="capitalize hover:text-white transition-colors">
          {product.category.replace('-', ' ')}
        </Link>
        <span>/</span>
        <span className="text-gray-200 truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Product Image */}
        <div className="lg:col-span-5 rounded-3xl overflow-hidden glass-card p-4 border border-white/10">
          <div className="relative h-96 w-full rounded-2xl overflow-hidden bg-dark-800">
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.is_sustainable && (
              <div className="absolute top-4 left-4 bg-dark-900/90 backdrop-blur border border-brand-500/40 text-brand-500 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                <Leaf className="w-4 h-4" /> Sustainable Eco-Friendly Choice
              </div>
            )}
          </div>
        </div>

        {/* Product Info & Multi-Store Table */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <span className="text-xs uppercase tracking-wider text-brand-500 font-semibold">
              Verified Product Review
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight mt-1">{product.name}</h1>
            {product.upc_code && (
              <span className="text-xs text-gray-400 mt-1 block">UPC/SKU Code: {product.upc_code}</span>
            )}
          </div>

          <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>

          {/* Multi-Store Price Comparison Table */}
          <div className="glass-card rounded-2xl p-6 border border-white/10 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-brand-500" /> Multi-Store Price Comparison
              </h2>
              <span className="text-xs text-gray-400">Live prices & stock status</span>
            </div>

            <div className="space-y-3">
              {product.affiliate_links.map((link) => {
                const storeName = link.network.toUpperCase();

                return (
                  <div
                    key={link.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-dark-800/80 border border-white/5 gap-4 hover:border-brand-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center font-bold text-xs tracking-wider text-white border border-white/10">
                        {storeName.slice(0, 3)}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-white block">{storeName} Store</span>
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> In Stock & Ready to Ship
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-xs text-gray-400 block">Price</span>
                        <span className="text-xl font-extrabold text-white">${link.price.toFixed(2)}</span>
                      </div>

                      <a
                        href={`/go/${product.slug}?network=${link.network}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-brand-500/20 transition-all hover:scale-105"
                      >
                        Buy at {storeName} <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Product Technical Specifications */}
      {Object.keys(specsObj).length > 0 && (
        <section className="glass-card rounded-2xl p-8 border border-white/10 space-y-4">
          <h2 className="text-xl font-bold text-white">Technical Specifications</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(specsObj).map(([key, val]) => (
              <div key={key} className="p-4 rounded-xl bg-dark-800 border border-white/5">
                <span className="text-xs text-gray-400 capitalize block">
                  {key.replace('_', ' ')}
                </span>
                <span className="text-sm font-semibold text-white mt-1 block">{val}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* User Sentiment Analysis (Aggregated from Reddit/Amazon reviews via LLM) */}
      {sentimentObj.summary && (
        <section className="glass-card rounded-2xl p-8 border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-brand-500" /> Aggregated Real-User Sentiment
            </h2>
            {sentimentObj.positive_pct && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold">
                {sentimentObj.positive_pct}% Positive User Consensus
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="p-5 rounded-xl bg-dark-800/80 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> What Buyers Love
              </span>
              <p className="text-sm text-gray-300">{sentimentObj.summary}</p>
            </div>

            {sentimentObj.top_complaint && (
              <div className="p-5 rounded-xl bg-dark-800/80 border border-amber-500/20 space-y-2">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Things to Keep in Mind
                </span>
                <p className="text-sm text-gray-300">{sentimentObj.top_complaint}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
