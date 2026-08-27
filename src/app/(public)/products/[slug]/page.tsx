import { createHash } from 'node:crypto';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import ProductSchema from '@/components/ProductSchema';
import { getCanonicalSiteUrl } from '@/lib/siteUrl';
import { buildProductMetadata } from '@/lib/products/productMetadata';
import { getProductPageData } from '@/lib/products/productPageData';
import {
  afterProductPageConsumer,
  beforeProductPageConsumer,
} from '@/lib/products/productPageCacheProbe';
import PriceTable from '@/components/ui/PriceTable';
import Badge from '@/components/ui/Badge';
import { CheckCircle2, ShoppingCart, ThumbsUp, XCircle } from 'lucide-react';
import { loadSpecificationData, filterPublicDisplayRows, type SpecRow } from '@/lib/products/specificationRows';
import { CATALOG_CURRENCY, toProductStructuredOffer } from '@/lib/products/productStructuredData';

function probeResultVersion(result: Awaited<ReturnType<typeof getProductPageData>>): string {
  const versionedResult = { ...result, evaluatedAt: undefined };
  return createHash('sha256').update(JSON.stringify(versionedResult)).digest('hex');
}

function formatSpecValue(row: SpecRow): string {
  const existing = row.existing;
  if (!existing) return '';
  if (row.dataType === 'BOOLEAN') return existing.valueBoolean ? 'Yes' : 'No';
  if (existing.valueNumber !== null) {
    return row.unit ? `${existing.valueNumber} ${row.unit}` : `${existing.valueNumber}`;
  }
  return existing.valueString ?? '';
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const probeSession = await beforeProductPageConsumer('metadata', slug);
  const result = await getProductPageData(slug);
  await afterProductPageConsumer(probeSession, {
    resultVersion: probeResultVersion(result),
    evaluatedAt: result.evaluatedAt,
  });
  if (result.kind !== 'public') notFound();

  return buildProductMetadata({
    product: result.product,
    decision: result.decision,
    siteUrl: getCanonicalSiteUrl(
      process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL
    ),
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const probeSession = await beforeProductPageConsumer('body', slug);
  const pageData = await getProductPageData(slug);
  await afterProductPageConsumer(probeSession, {
    resultVersion: probeResultVersion(pageData),
    evaluatedAt: pageData.evaluatedAt,
  });
  if (pageData.kind !== 'public') {
    return notFound();
  }
  const { product, offerPresentation } = pageData;

  // Parse specs and user sentiment safely
  let specsObj: Record<string, string> = {};
  if (product.specs) {
    try {
      specsObj = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs;
    } catch {
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
    } catch {
      sentimentObj = {};
    }
  }

  const specData = await loadSpecificationData(prisma, product.id);
  const defaultVariantId = specData?.variants.find((v) => v.isActive)?.id ?? null;
  const structuredRows = filterPublicDisplayRows(specData?.rows ?? [], defaultVariantId);

  const structuredOffer = toProductStructuredOffer(
    offerPresentation.canonicalOffer,
    CATALOG_CURRENCY
  );

  // Only surface aggregateRating once we have a real, derivable rating/review count from
  // user_sentiment — the current sentiment shape has no such fields, so this stays undefined
  // rather than fabricating one. Do not hardcode placeholder values here.
  const aggregateRating = undefined;

  const priceRows = offerPresentation.rows.map((row) => ({
    id: row.offer.id,
    network: row.offer.network.toUpperCase(),
    price: row.displayPrice,
    availability: row.availability,
    observedAt: row.observedAt,
    isBestCurrentOffer: row.isBestCurrentOffer,
    goHref: `/go/${product.slug}?network=${row.offer.network}`,
  }));

  return (
    <div className="space-y-12">
      {/* Schema Markup for Google & AI Search */}
      <ProductSchema
        product={{
          name: product.name,
          image: product.image_url,
          description: product.description || product.name,
          sku: product.upc_code || undefined,
          offer: structuredOffer,
          aggregateRating,
        }}
      />

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-ink-faint">
        <Link href="/" className="transition-colors hover:text-ink">
          Home
        </Link>
        <span>/</span>
        <Link href={`/category/${product.category}`} className="capitalize transition-colors hover:text-ink">
          {product.category.replace('-', ' ')}
        </Link>
        <span>/</span>
        <span className="max-w-xs truncate text-ink-soft">{product.name}</span>
      </nav>

      {/* Main Product Hero */}
      <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
        {/* Product Image */}
        <div className="rounded-lg border border-line-strong bg-card p-4 lg:col-span-5">
          <div className="relative h-96 w-full overflow-hidden rounded-md bg-paper-alt">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              priority
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="object-cover"
            />
          </div>
        </div>

        {/* Product Info & Multi-Store Table */}
        <div className="space-y-6 lg:col-span-7">
          <div>
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-walnut">
              Specifications &amp; Buying Analysis
            </span>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-ink">{product.name}</h1>
            {product.upc_code && (
              <span className="mt-1 block text-xs text-ink-faint">UPC/SKU Code: {product.upc_code}</span>
            )}
          </div>

          {product.is_sustainable && <Badge variant="eco" label="Sustainable Eco-Friendly Choice" />}

          <p className="text-sm leading-relaxed text-ink-soft">{product.description}</p>

          {/* Multi-Store Price Comparison Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-ink">
                <ShoppingCart className="h-4 w-4 text-blueprint" /> Multi-Store Price Comparison
              </h2>
              <span className="text-xs text-ink-faint">Retailer prices &amp; stock status</span>
            </div>

            <PriceTable rows={priceRows} />
          </div>
        </div>
      </div>

      {/* Product Technical Specifications */}
      {structuredRows.length > 0 ? (
        <section className="space-y-4 rounded-lg border border-line-strong bg-card p-8">
          <h2 className="font-display text-xl font-semibold text-ink">Technical Specifications</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {structuredRows.map((row) => (
              <div key={row.rowKey} className="rounded-md border border-line bg-paper-alt p-4">
                <span className="block text-xs capitalize text-ink-faint">
                  {row.label}
                  {row.variantLabel ? ` (${row.variantLabel})` : ''}
                </span>
                <span className="mt-1 block font-mono text-sm font-semibold text-ink">{formatSpecValue(row)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : (
        Object.keys(specsObj).length > 0 && (
          <section className="space-y-4 rounded-lg border border-line-strong bg-card p-8">
            <h2 className="font-display text-xl font-semibold text-ink">Technical Specifications</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              {Object.entries(specsObj).map(([key, val]) => (
                <div key={key} className="rounded-md border border-line bg-paper-alt p-4">
                  <span className="block text-xs capitalize text-ink-faint">{key.replaceAll('_', ' ')}</span>
                  <span className="mt-1 block font-mono text-sm font-semibold text-ink">{val}</span>
                </div>
              ))}
            </div>
          </section>
        )
      )}

      {/* User Sentiment Analysis (Aggregated from Reddit/Amazon reviews via LLM) */}
      {sentimentObj.summary && (
        <section className="space-y-4 rounded-lg border border-line-strong bg-card p-8">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 font-display text-xl font-semibold text-ink">
              <ThumbsUp className="h-5 w-5 text-blueprint" /> Aggregated Real-User Sentiment
            </h2>
            {sentimentObj.positive_pct && (
              <span className="rounded-full border border-sage/20 bg-sage-soft px-3 py-1 font-mono text-xs font-bold text-sage">
                {sentimentObj.positive_pct}% Positive User Consensus
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-6 pt-2 md:grid-cols-2">
            <div className="space-y-2 rounded-md border border-sage/20 bg-sage-soft/40 p-5">
              <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-sage">
                <CheckCircle2 className="h-4 w-4" /> What Buyers Love
              </span>
              <p className="text-sm text-ink-soft">{sentimentObj.summary}</p>
            </div>

            {sentimentObj.top_complaint && (
              <div className="space-y-2 rounded-md border border-amber/20 bg-amber-soft/40 p-5">
                <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber">
                  <XCircle className="h-4 w-4" /> Things to Keep in Mind
                </span>
                <p className="text-sm text-ink-soft">{sentimentObj.top_complaint}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
