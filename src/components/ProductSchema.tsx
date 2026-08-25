import { Product, WithContext } from 'schema-dts';
import type { ProductStructuredOffer } from '@/lib/products/productStructuredData';

export interface ProductSchemaProps {
  name: string;
  image: string;
  description: string;
  brand?: string;
  sku?: string;
  offer?: ProductStructuredOffer;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export function buildProductJsonLd(product: ProductSchemaProps): WithContext<Product> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    ...(product.brand
      ? {
          brand: {
            '@type': 'Brand' as const,
            name: product.brand,
          },
        }
      : {}),
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.offer
      ? {
          offers: {
            '@type': 'Offer' as const,
            price: product.offer.price,
            priceCurrency: product.offer.priceCurrency,
            availability: product.offer.availability,
          },
        }
      : {}),
    ...(product.aggregateRating
      ? {
          aggregateRating: {
            '@type': 'AggregateRating' as const,
            ratingValue: product.aggregateRating.ratingValue,
            reviewCount: product.aggregateRating.reviewCount,
          },
        }
      : {}),
  };
}

export function serializeProductJsonLd(jsonLd: WithContext<Product>): string {
  return JSON.stringify(jsonLd).replace(/</g, '\\u003c');
}

export default function ProductSchema({ product }: { product: ProductSchemaProps }) {
  const jsonLd = buildProductJsonLd(product);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeProductJsonLd(jsonLd),
      }}
    />
  );
}
