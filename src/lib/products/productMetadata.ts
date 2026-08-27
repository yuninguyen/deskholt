import type { Metadata } from 'next';
import { getProductCanonicalUrl } from '@/lib/siteUrl';
import type { ProductAccessDecision } from './productAccessPolicy';

export type ProductMetadataInput = {
  product: {
    name: string;
    slug: string;
    description: string | null;
  };
  decision: ProductAccessDecision;
  siteUrl: URL;
};

export function buildProductMetadata({
  product,
  decision,
  siteUrl,
}: ProductMetadataInput): Metadata {
  return {
    title: product.name,
    description: product.description?.trim() || product.name,
    robots: decision.robots ?? undefined,
    alternates: {
      canonical: getProductCanonicalUrl(product.slug, siteUrl).toString(),
    },
  };
}
