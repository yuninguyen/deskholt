import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { PrismaClient } from '@prisma/client';
import { createProductErgearEgesd5b } from '../scripts/create-product-ergear-egesd5b';

const url = process.env.ERGEAR_TEST_DATABASE_URL;
const acknowledged = process.env.ERGEAR_TEST_DATABASE_ACKNOWLEDGED === 'I_OWN_THIS_DISPOSABLE_DATABASE';
const enabled = Boolean(url && acknowledged && !process.env.DATABASE_URL);

function db() {
  if (!url) throw new Error('ERGEAR_TEST_DATABASE_URL is required');
  return new PrismaClient({ datasources: { db: { url } } });
}

async function prepare(prisma: PrismaClient) {
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit',
  });
  execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'prisma/seed-standing-desk-attributes.ts'], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url }, stdio: 'inherit',
  });
  await prisma.product.deleteMany({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
  await prisma.brand.deleteMany({ where: { slug: 'ergear' } });
}

const integration = enabled ? test : test.skip;

integration('creates the exact ErGear Brand/Product identity and links', async () => {
  const prisma = db();
  try {
    await prepare(prisma);
    await createProductErgearEgesd5b(prisma);
    const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: 'ergear' } });
    const product = await prisma.product.findUniqueOrThrow({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
    assert.deepEqual({ slug: brand.slug, name: brand.name }, { slug: 'ergear', name: 'ErGear' });
    assert.deepEqual({ name: product.name, slug: product.slug, category: product.category, status: product.status, is_indexed: product.is_indexed, is_sustainable: product.is_sustainable, upc_code: product.upc_code, brand_id: product.brand_id, category_id: product.category_id, description: product.description, image_url: product.image_url }, {
      name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)', slug: 'ergear-egesd5b-standing-desk-black', category: 'standing-desks', status: 'DRAFT', is_indexed: false, is_sustainable: false, upc_code: 'B0B41YH9B6', brand_id: brand.id, category_id: (await prisma.category.findUniqueOrThrow({ where: { slug: 'standing-desks' } })).id, description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.', image_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80',
    });
  } finally { await prisma.$disconnect(); }
});

integration('throws clearly and creates nothing when standing-desks is absent', async () => {
  const prisma = db();
  try {
    await prisma.product.deleteMany({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
    await prisma.brand.deleteMany({ where: { slug: 'ergear' } });
    await prisma.category.deleteMany({ where: { slug: 'standing-desks' } });
    await assert.rejects(() => createProductErgearEgesd5b(prisma), /standing-desks.*not found/i);
    assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 0);
    assert.equal(await prisma.product.count({ where: { slug: 'ergear-egesd5b-standing-desk-black' } }), 0);
  } finally { await prisma.$disconnect(); }
});

integration('is idempotent on rerun', async () => {
  const prisma = db();
  try {
    await prepare(prisma);
    await createProductErgearEgesd5b(prisma);
    await createProductErgearEgesd5b(prisma);
    assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 1);
    assert.equal(await prisma.product.count({ where: { slug: 'ergear-egesd5b-standing-desk-black' } }), 1);
  } finally { await prisma.$disconnect(); }
});
