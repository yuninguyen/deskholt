import { PrismaClient, type ProductStatus } from '@prisma/client';

// Fail fast before any product transaction when standing-desks is unavailable, avoiding a partial permanent batch.
const STOCK_IMAGE = 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80';
const products = [
  { brandSlug: 'veken', brandName: 'Veken', name: 'Veken 47.2 Inch Large Electric Standing Desk, Gaming Table (Black)', slug: 'veken-47-2in-standing-desk-black', upcCode: '810191341857', description: 'Electric standing desk with a 47.24 x 23.64 inch engineered-wood top, steel frame, and 176 lb capacity.', isSustainable: false },
  { brandSlug: 'claiks', brandName: 'Claiks', name: 'Claiks Electric Height Adjustable Standing Desk, 48x24 Inch (Rustic Brown)', slug: 'claiks-standing-desk-rustic-brown', upcCode: null, description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top and steel frame.', isSustainable: false },
  { brandSlug: 'fezibo', brandName: 'FEZIBO', name: 'FEZIBO Standing Desk 48 x 24 Inch Electric Height Adjustable (Maple)', slug: 'fezibo-standing-desk-maple', upcCode: null, description: 'Electric height-adjustable standing desk with a 48 x 24 inch FSC-certified wood top and steel frame.', isSustainable: true },
  { brandSlug: 'veken', brandName: 'Veken', name: 'Veken 55 Inch Large Electric Standing Desk, Gaming Table (Black)', slug: 'veken-55in-standing-desk-black', upcCode: '850069632229', description: 'Electric standing desk with a 55.12 x 23.64 inch engineered-wood top and steel frame.', isSustainable: false },
  { brandSlug: 'offigo', brandName: 'OffiGo', name: 'OffiGo 63 Inch Reversible L Shaped Electric Standing Desk (Black)', slug: 'offigo-63in-lshape-standing-desk-black', upcCode: null, description: 'Reversible L-shaped electric standing desk with a steel frame, engineered-wood top, and backed by a lifetime frame warranty.', isSustainable: false },
] as const;

export async function createProducts3to7StandingDesks(prisma: PrismaClient) {
  const category = await prisma.category.findUnique({ where: { slug: 'standing-desks' } });
  if (!category) throw new Error('Required Category "standing-desks" was not found; run the standing-desk attribute seed first.');
  const created = [];
  for (const product of products) {
    const row = await prisma.$transaction(async (rawTx) => {
      const tx = rawTx as PrismaClient;
      const brand = await tx.brand.upsert({ where: { slug: product.brandSlug }, update: { name: product.brandName }, create: { slug: product.brandSlug, name: product.brandName } });
      return tx.product.upsert({
        where: { slug: product.slug },
        update: { name: product.name, category: 'standing-desks', category_id: category.id, brand_id: brand.id, description: product.description, image_url: STOCK_IMAGE, upc_code: product.upcCode, status: 'DRAFT' as ProductStatus, is_indexed: false, is_sustainable: product.isSustainable },
        create: { name: product.name, slug: product.slug, category: 'standing-desks', category_id: category.id, brand_id: brand.id, description: product.description, image_url: STOCK_IMAGE, upc_code: product.upcCode, status: 'DRAFT' as ProductStatus, is_indexed: false, is_sustainable: product.isSustainable },
      });
    });
    created.push(row);
  }
  return created;
}

if (process.argv[1]?.endsWith('create-products-3to7-standing-desks.ts')) {
  const prisma = new PrismaClient();
  createProducts3to7StandingDesks(prisma).then((rows) => console.log(`Products ready: ${rows.map((row) => row.slug).join(', ')}`)).catch((error) => { console.error('Create products failed:', error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
