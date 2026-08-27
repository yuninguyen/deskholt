import { getCanonicalSiteUrl, getProductCanonicalUrl } from '@/lib/siteUrl';

export type ProductSitemapRow = {
  slug: string;
  updated_at: Date;
};

export type ProductSitemapEntry = {
  url: string;
  lastModified: Date;
};

export function mapProductSitemapRows(
  rows: ProductSitemapRow[],
  siteUrl: URL
): ProductSitemapEntry[] {
  const canonicalSiteUrl = getCanonicalSiteUrl(siteUrl.toString());
  return rows.map((row) => ({
    url: getProductCanonicalUrl(row.slug, canonicalSiteUrl).toString(),
    lastModified: row.updated_at,
  }));
}
