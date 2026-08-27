import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCanonicalSiteUrl } from '@/lib/siteUrl';
import { INDEXABLE_PRODUCT_WHERE } from '@/lib/products/productAccessPolicy';
import { mapProductSitemapRows } from '@/lib/products/productSitemap';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const siteUrl = getCanonicalSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ?? process.env.NEXT_PUBLIC_APP_URL
  );
  const products = await prisma.product.findMany({
    where: INDEXABLE_PRODUCT_WHERE,
    select: { slug: true, updated_at: true },
    orderBy: { slug: 'asc' },
  });
  return mapProductSitemapRows(products, siteUrl);
}
