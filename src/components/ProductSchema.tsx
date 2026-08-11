import { Product, WithContext } from 'schema-dts';

export interface ProductSchemaProps {
  name: string;
  image: string;
  description: string;
  brand?: string;
  sku?: string;
  price?: number;
  priceCurrency?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
}

export default function ProductSchema({ product }: { product: ProductSchemaProps }) {
  const jsonLd: WithContext<Product> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.image,
    description: product.description,
    brand: product.brand
      ? {
          '@type': 'Brand',
          name: product.brand,
        }
      : undefined,
    sku: product.sku,
    offers: product.price
      ? {
          '@type': 'Offer',
          price: product.price,
          priceCurrency: product.priceCurrency || 'USD',
          availability: 'https://schema.org/InStock',
        }
      : undefined,
    aggregateRating: product.aggregateRating
      ? {
          '@type': 'AggregateRating',
          ratingValue: product.aggregateRating.ratingValue,
          reviewCount: product.aggregateRating.reviewCount,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
      }}
    />
  );
}
