import { PrismaClient, type ProductStatus } from '@prisma/client';

const STOCK_IMAGE = 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80';
const PRODUCT_SLUG = 'ergear-egesd5b-standing-desk-black';

export async function createProductErgearEgesd5b(prisma: PrismaClient) {
  const category = await prisma.category.findUnique({ where: { slug: 'standing-desks' } });
  if (!category) throw new Error('Required Category "standing-desks" was not found; run the standing-desk attribute seed first.');

  const brand = await prisma.brand.upsert({
    where: { slug: 'ergear' },
    update: { name: 'ErGear' },
    create: { slug: 'ergear', name: 'ErGear' },
  });

  return prisma.product.upsert({
    where: { slug: PRODUCT_SLUG },
    update: {
      name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)',
      category: 'standing-desks', category_id: category.id, brand_id: brand.id,
      description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.',
      image_url: STOCK_IMAGE,
      // ASIN stored in the UPC/SKU display field; this is not a true UPC.
      upc_code: 'B0B41YH9B6', status: 'DRAFT' as ProductStatus, is_indexed: false, is_sustainable: false,
    },
    create: {
      name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)',
      slug: PRODUCT_SLUG, category: 'standing-desks', category_id: category.id, brand_id: brand.id,
      description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.',
      image_url: STOCK_IMAGE,
      // ASIN stored in the UPC/SKU display field; this is not a true UPC.
      upc_code: 'B0B41YH9B6', status: 'DRAFT' as ProductStatus, is_indexed: false, is_sustainable: false,
    },
  });
}

if (process.argv[1]?.endsWith('create-product-ergear-egesd5b.ts')) {
  const prisma = new PrismaClient();
  createProductErgearEgesd5b(prisma)
    .then((product) => console.log(`Product ready: ${product.slug} (${product.id})`))
    .catch((error) => { console.error('Create product failed:', error); process.exitCode = 1; })
    .finally(() => prisma.$disconnect());
}
