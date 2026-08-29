import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
import { createProducts3to7StandingDesks } from '../scripts/create-products-3to7-standing-desks';
import { convertLengthToCanonicalInches } from '../src/lib/products/unitConversion';

const bin = process.env.ERGEAR_TEST_POSTGRES_BIN;
function exe(name: string) { return join(bin!, process.platform === 'win32' ? `${name}.exe` : name); }
function run(name: string, args: string[], env: NodeJS.ProcessEnv) { execFileSync(exe(name), args, { stdio: 'inherit', env }); }
function owned() {
  assert.ok(bin); assert.equal(process.env.ERGEAR_TEST_DATABASE_URL, undefined);
  const root = mkdtempSync(join(tmpdir(), 'products-3to7-postgres-')); let port = 56500;
  run('initdb', ['-D', root, '-A', 'trust', '-U', 'postgres'], process.env);
  while (true) { try { run('pg_ctl', ['-D', root, '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start'], process.env); break; } catch { port++; } }
  run('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', 'products_3to7'], process.env);
  const url = `postgresql://postgres@127.0.0.1:${port}/products_3to7`;
  return { url, stop: () => { try { run('pg_ctl', ['-D', root, '-w', 'stop'], process.env); } catch {} rmSync(root, { recursive: true, force: true }); } };
}
function migrate(url: string, seed: boolean) { const env = { ...process.env, DATABASE_URL: url }; execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { env, stdio: 'inherit' }); if (seed) execFileSync(process.execPath, [require.resolve('tsx/cli'), 'prisma/seed-standing-desk-attributes.ts'], { env, stdio: 'inherit' }); }
const integration = bin ? test : test.skip;
const expected = [
  ['veken-47-2in-standing-desk-black', 'Veken 47.2 Inch Large Electric Standing Desk, Gaming Table (Black)', '810191341857', 'veken', false],
  ['claiks-standing-desk-rustic-brown', 'Claiks Electric Height Adjustable Standing Desk, 48x24 Inch (Rustic Brown)', null, 'claiks', false],
  ['fezibo-standing-desk-maple', 'FEZIBO Standing Desk 48 x 24 Inch Electric Height Adjustable (Maple)', null, 'fezibo', true],
  ['veken-55in-standing-desk-black', 'Veken 55 Inch Large Electric Standing Desk, Gaming Table (Black)', '850069632229', 'veken', false],
  ['offigo-63in-lshape-standing-desk-black', 'OffiGo 63 Inch Reversible L Shaped Electric Standing Desk (Black)', null, 'offigo', false],
] as const;
integration('creates exact five draft standing desk identities and reuses Veken idempotently', async () => {
  const cluster = owned(); try { migrate(cluster.url, true); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try {
    await createProducts3to7StandingDesks(prisma);
    const specs = { 'veken-47-2in-standing-desk-black': ['veken-47-2in-standing-desk-black-default', '47.2x23.6', 'Cyber Black'], 'claiks-standing-desk-rustic-brown': ['claiks-standing-desk-rustic-brown-default', '48x24', 'Rustic Brown'], 'fezibo-standing-desk-maple': ['fezibo-standing-desk-maple-default', '48x24', null], 'veken-55in-standing-desk-black': ['veken-55in-standing-desk-black-default', '55x23.6', 'Cyber Black'], 'offigo-63in-lshape-standing-desk-black': ['offigo-63in-lshape-standing-desk-black-default', '63x47.2', 'Black'] } as const;
const products = await prisma.product.findMany({ where: { slug: { in: expected.map(([slug]) => slug) } }, include: { brand: true, category_ref: true }, orderBy: { slug: 'asc' } });
    assert.equal(products.length, 5); assert.equal(await prisma.product.count(), 5); assert.equal(await prisma.brand.count(), 4); assert.equal(await prisma.brand.count({ where: { slug: { in: ['veken', 'claiks', 'fezibo', 'offigo'] } } }), 4);
    for (const [slug, name, upc, brand, sustainable] of expected) { const row = products.find((product) => product.slug === slug)!; assert.deepEqual({ name: row.name, upc: row.upc_code, brand: row.brand?.slug, category: row.category_ref?.slug, status: row.status, indexed: row.is_indexed, sustainable: row.is_sustainable }, { name, upc, brand, category: 'standing-desks', status: 'DRAFT', indexed: false, sustainable }); }
    for (const [slug, spec] of Object.entries(specs)) { const product = products.find((row) => row.slug === slug)!; const variants = await prisma.productVariant.findMany({ where: { product_id: product.id } }); assert.equal(variants.length, 1); assert.deepEqual([variants[0].sku, variants[0].size, variants[0].color], spec); const attrs = await prisma.productAttribute.findMany({ where: { product_id: product.id }, include: { attribute_definition: true } }); assert.ok(attrs.length > 0); assert.ok(attrs.every((a) => a.source_type === 'RETAILER' && a.confidence === 'VERIFIED')); if (slug === 'claiks-standing-desk-rustic-brown') { const a = attrs.find((x) => x.attribute_definition.key === 'max_height_in')!; assert.equal(Number(a.value_number), Number(convertLengthToCanonicalInches(119, 'cm'))); } if (slug === 'offigo-63in-lshape-standing-desk-black') { const a = attrs.find((x) => x.attribute_definition.key === 'desktop_shape')!; assert.equal(a.value_string, 'L_SHAPED'); } }
     await createProducts3to7StandingDesks(prisma); assert.equal(await prisma.product.count({ where: { slug: { in: expected.map(([slug]) => slug) } } }), 5); assert.equal(await prisma.product.count(), 5); assert.equal(await prisma.brand.count(), 4); assert.equal(await prisma.brand.count({ where: { slug: { in: ['veken', 'claiks', 'fezibo', 'offigo'] } } }), 4);
  } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});
// Task2 integration acceptance: this intentionally exercises the real seed/migrate harness and
// keeps the product-scope omissions explicit so accidental attribute expansion is visible.
integration('Task2 persists exact scoped attributes, metadata, and no affiliate links', async () => {
  const cluster = owned(); try { migrate(cluster.url, true); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try {
    await createProducts3to7StandingDesks(prisma);
    const expectedScope = {
      'veken-47-2in-standing-desk-black': {
        product: ['min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included'],
        variant: ['desktop_width_in', 'desktop_depth_in', 'desktop_finish', 'frame_color'],
      },
      'claiks-standing-desk-rustic-brown': {
        product: ['min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'desktop_thickness_in', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included'],
        variant: ['desktop_width_in', 'desktop_depth_in', 'desktop_material', 'frame_color'],
      },
      'fezibo-standing-desk-maple': {
        product: ['min_height_in', 'max_height_in', 'max_load_lb', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included'],
        variant: ['desktop_width_in', 'desktop_depth_in', 'desktop_finish'],
      },
      'veken-55in-standing-desk-black': {
        product: ['min_height_in', 'max_height_in', 'product_weight_lb', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included'],
        variant: ['desktop_width_in', 'desktop_depth_in', 'desktop_material', 'desktop_finish', 'frame_color'],
      },
      'offigo-63in-lshape-standing-desk-black': {
        product: ['min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'desktop_thickness_in', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included'],
        variant: ['desktop_width_in', 'desktop_depth_in', 'desktop_material', 'desktop_finish', 'frame_color'],
      },
    } as const;
    const products = await prisma.product.findMany({ where: { slug: { in: Object.keys(expectedScope) } } });
    assert.equal(products.length, 5);
    for (const product of products) {
      const expected = expectedScope[product.slug as keyof typeof expectedScope];
      const attrs = await prisma.productAttribute.findMany({ where: { product_id: product.id }, include: { attribute_definition: true } });
      const productKeys = attrs.filter((a) => a.variant_id === null).map((a) => a.attribute_definition.key).sort();
      const variantKeys = attrs.filter((a) => a.variant_id !== null).map((a) => a.attribute_definition.key).sort();
      assert.deepEqual(productKeys, [...expected.product].sort(), `${product.slug} product scope`);
      assert.deepEqual(variantKeys, [...expected.variant].sort(), `${product.slug} variant scope`);
      assert.equal(new Set(attrs.map((a) => a.attribute_definition.key)).size, attrs.length);
      for (const attr of attrs) {
        assert.equal(attr.source_type, 'RETAILER');
        assert.equal(attr.confidence, 'VERIFIED');
        assert.equal(attr.attribute_definition.scope, attr.variant_id === null ? 'PRODUCT' : 'VARIANT');
        assert.ok(attr.attribute_definition.label.length > 0);
        assert.ok(attr.attribute_definition.data_type);
      }
      if (product.slug === 'claiks-standing-desk-rustic-brown') {
        const value = attrs.find((a) => a.attribute_definition.key === 'max_height_in')?.value_number;
        assert.ok(value !== null && value !== undefined);
        assert.ok(Math.abs(Number(value) - Number(convertLengthToCanonicalInches(119, 'cm'))) < 0.0001);
      }
      if (product.slug === 'offigo-63in-lshape-standing-desk-black') assert.equal(attrs.find((a) => a.attribute_definition.key === 'desktop_shape')?.value_string, 'L_SHAPED');
    }
    assert.equal(await prisma.affiliateLink.count(), 0);
  } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});

integration('rerun removes stale and wrong-scope attributes without touching another product', async () => {
  const cluster = owned(); try { migrate(cluster.url, true); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try {
    await createProducts3to7StandingDesks(prisma);
    const target = await prisma.product.findUniqueOrThrow({ where: { slug: 'veken-47-2in-standing-desk-black' } });
    const other = await prisma.product.create({ data: { name: 'Unrelated product', slug: 'unrelated-product', category: 'standing-desks', category_id: target.category_id!, image_url: 'https://example.com/unrelated.jpg', status: 'DRAFT' } });
    const forbidden = await prisma.attributeDefinition.findUniqueOrThrow({ where: { key: 'desktop_material' } });
    const allowed = await prisma.attributeDefinition.findUniqueOrThrow({ where: { key: 'desktop_finish' } });
    await prisma.productAttribute.createMany({ data: [
      { product_id: target.id, variant_id: null, attribute_definition_id: forbidden.id, value_string: 'ENGINEERED_WOOD' },
      { product_id: target.id, variant_id: null, attribute_definition_id: allowed.id, value_string: 'stale' },
    ] });
    await prisma.productAttribute.create({ data: { product_id: other.id, attribute_definition_id: forbidden.id, value_string: 'ENGINEERED_WOOD' } });
    await createProducts3to7StandingDesks(prisma);
    const targetKeys = (await prisma.productAttribute.findMany({ where: { product_id: target.id }, include: { attribute_definition: true } })).map((a) => a.attribute_definition.key);
    assert.equal(targetKeys.includes('desktop_material'), false);
    assert.equal(targetKeys.includes('desktop_finish'), false);
    assert.equal(await prisma.productAttribute.count({ where: { product_id: other.id } }), 1);
  } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});

integration('rolls back a product transaction when an allowed value definition rejects its seed value', async () => {
  const cluster = owned(); try { migrate(cluster.url, true); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try {
    const definition = await prisma.attributeDefinition.findUniqueOrThrow({ where: { key: 'adjustment_type' } });
    await prisma.attributeDefinition.update({ where: { id: definition.id }, data: { allowed_values: ['MANUAL'] } });
    await assert.rejects(() => createProducts3to7StandingDesks(prisma), /validation failed/i);
    assert.equal(await prisma.product.count(), 0);
    assert.equal(await prisma.productAttribute.count(), 0);
  } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});

integration('fails before writes when standing-desks category is missing', async () => {
  const cluster = owned(); try { migrate(cluster.url, false); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try { await assert.rejects(() => createProducts3to7StandingDesks(prisma), /standing-desks/i); assert.equal(await prisma.product.count(), 0); assert.equal(await prisma.brand.count(), 0); } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});
test('Task2 script has exact scope mapping, invokes validator, and omits AffiliateLink code', () => {
  const script = readFileSync(join(__dirname, '../scripts/create-products-3to7-standing-desks.ts'), 'utf8');
  assert.match(script, /PRODUCT_SCOPE_KEYS\s*=\s*new Set\(\[/);
  for (const key of ['min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'desktop_thickness_in', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included']) assert.match(script, new RegExp(`['"]${key}['"]`));
  assert.match(script, /variantId:\s*PRODUCT_SCOPE_KEYS\.has\(item\.key\)\s*\?\s*null\s*:\s*variantId/);
  assert.match(script, /validateProductAttributeInput\(tx,input\)/);
  assert.doesNotMatch(script, /AffiliateLink|affiliateLink|affiliate_links/);
});
test('owned harness rejects ambient database URL', () => { if (bin) assert.equal(process.env.ERGEAR_TEST_DATABASE_URL, undefined); });
