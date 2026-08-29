import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Prisma, PrismaClient, ProductStatus } from '@prisma/client';
import { upgradeProductShwOd92ak } from '../scripts/upgrade-product-shw-od92ak';
import { convertLengthToCanonicalInches, convertMassToCanonicalPounds } from '../src/lib/products/unitConversion';

const bin = process.env.ERGEAR_TEST_POSTGRES_BIN;
function exe(n: string) { return join(bin!, process.platform === 'win32' ? `${n}.exe` : n); }
function run(n: string, args: string[], env: NodeJS.ProcessEnv) { execFileSync(exe(n), args, { stdio: 'inherit', env }); }
async function owned() {
  assert.ok(bin); assert.equal(process.env.ERGEAR_TEST_DATABASE_URL, undefined);
  const root = mkdtempSync(join(tmpdir(), 'shw-postgres-')); let port = 56300;
  run('initdb', ['-D', root, '-A', 'trust', '-U', 'postgres'], process.env);
  while (true) { try { run('pg_ctl', ['-D', root, '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start'], process.env); break; } catch { port++; } }
  run('createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', 'shw_test'], process.env);
  const url = `postgresql://postgres@127.0.0.1:${port}/shw_test`;
  return { root, url, stop: () => { try { run('pg_ctl', ['-D', root, '-w', 'stop'], process.env); } catch {} rmSync(root, { recursive: true, force: true }); } };
}
const integration = bin ? test : test.skip;
const EXPECTED = ['min_height_in', 'max_height_in', 'max_load_lb', 'desktop_thickness_in', 'adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included', 'desktop_width_in', 'desktop_depth_in', 'desktop_material', 'desktop_finish', 'frame_color'];
const FORBIDDEN = ['motor_count', 'warranty_months', 'memory_presets', 'product_weight_lb', 'leg_count', 'leg_design', 'lifting_speed_in_s', 'noise_db', 'anti_collision', 'crossbar', 'casters_compatible', 'certification_greenguard', 'certification_bifma', 'assembly_time_minutes'];

integration('upgrades exact existing SHW fixture, selects SKU, is idempotent, and rolls back transactionally', async () => {
  const c = await owned(); const env = { ...process.env, DATABASE_URL: c.url };
  try {
    execFileSync(process.execPath, [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'], { env, stdio: 'inherit' });
    execFileSync(process.execPath, [require.resolve('tsx/cli'), 'prisma/seed-standing-desk-attributes.ts'], { env, stdio: 'inherit' });
    const p = new PrismaClient({ datasources: { db: { url: c.url } } });
    try {
      const cat = await p.category.findUniqueOrThrow({ where: { slug: 'standing-desks' } });
      const product = await p.product.create({ data: { name: 'SHW 48-Inch Standing Desk with Drawer (Black)', slug: 'shw-48in-standing-desk-drawer-black', category: 'standing-desks', description: 'legacy', image_url: 'https://example.test/shw.jpg', status: ProductStatus.ACTIVE, is_indexed: false } });
      const target = await p.productVariant.create({ data: { product_id: product.id, sku: 'shw-48in-standing-desk-drawer-black-default' } });
      await p.productVariant.create({ data: { product_id: product.id, sku: 'competing-variant' } });
      const originalLink = await p.affiliateLink.create({ data: { product_id: product.id, network: 'amazon', price: 299.99, raw_url: 'https://www.amazon.com/dp/B07MBR8N89', tracking_url: 'https://www.amazon.com/dp/B07MBR8N89?tag=original', is_in_stock: true, priority_order: 7 } });
      await upgradeProductShwOd92ak(p);
      const after = await p.product.findUniqueOrThrow({ where: { id: product.id } });
      assert.deepEqual({ id: after.id, slug: after.slug, name: after.name, description: after.description, image_url: after.image_url, status: after.status, is_indexed: after.is_indexed, upc_code: after.upc_code, category_id: after.category_id }, { id: product.id, slug: product.slug, name: product.name, description: product.description, image_url: product.image_url, status: 'ACTIVE', is_indexed: false, upc_code: '811244032715', category_id: cat.id });
      const v = await p.productVariant.findUniqueOrThrow({ where: { id: target.id } });
      assert.deepEqual({ sku: v.sku, size: v.size, color: v.color }, { sku: 'shw-48in-standing-desk-drawer-black-default', size: '48-Inch', color: 'Black' });
      const competing = await p.productVariant.findUniqueOrThrow({ where: { id: (await p.productVariant.findFirstOrThrow({ where: { sku: 'competing-variant' } })).id } }); assert.equal(competing.size, null);
      const rows = await p.productAttribute.findMany({ where: { product_id: product.id }, include: { attribute_definition: true } });
      assert.equal(rows.length, 13); const values = new Map(rows.map(r => [r.attribute_definition.key, r])); assert.deepEqual([...values.keys()].sort(), [...EXPECTED].sort());
      assert.equal(values.get('min_height_in')?.value_number?.toString(), '28'); assert.ok(Math.abs(Number(values.get('max_height_in')?.value_number) - convertLengthToCanonicalInches(114, 'cm')) < 1e-5); assert.ok(Math.abs(Number(values.get('max_load_lb')?.value_number) - convertMassToCanonicalPounds(50, 'kg')) < 1e-5); assert.equal(values.get('desktop_included')?.value_boolean, true); assert.equal(values.get('adjustment_type')?.value_string, 'ELECTRIC');
      for (const r of rows) { assert.equal(r.source_url, 'https://www.amazon.com/dp/B07MBR8N89'); assert.equal(r.source_type, 'RETAILER'); assert.equal(r.confidence, 'VERIFIED'); assert.ok(r.verified_at); }
      for (const key of FORBIDDEN) assert.equal(values.has(key), false, key);
      const link = await p.affiliateLink.findUniqueOrThrow({ where: { id: originalLink.id } }); assert.equal(link.price, 159.87); assert.equal(link.raw_url, originalLink.raw_url); assert.equal(link.tracking_url, originalLink.tracking_url);
      await upgradeProductShwOd92ak(p); assert.equal(await p.productVariant.count({ where: { product_id: product.id } }), 2); assert.equal(await p.productAttribute.count({ where: { product_id: product.id } }), 13); assert.equal(await p.affiliateLink.count({ where: { product_id: product.id } }), 1);
      await p.productAttribute.deleteMany({ where: { product_id: product.id } }); await p.product.update({ where: { id: product.id }, data: { brand_id: null, upc_code: null } }); await p.productVariant.update({ where: { id: target.id }, data: { size: null, color: null } }); await p.affiliateLink.update({ where: { id: originalLink.id }, data: { price: 299.99 } }); await p.brand.delete({ where: { slug: 'shw' } });
      const definition = await p.attributeDefinition.findUniqueOrThrow({ where: { key: 'adjustment_type' } }); const originalAllowed = definition.allowed_values;
      await p.attributeDefinition.update({ where: { id: definition.id }, data: { allowed_values: ['MANUAL_CRANK'] } });
      await assert.rejects(() => upgradeProductShwOd92ak(p), /adjustment_type.*allowed/i);
      assert.equal(await p.brand.count({ where: { slug: 'shw' } }), 0); const rolled = await p.product.findUniqueOrThrow({ where: { id: product.id } }); assert.equal(rolled.brand_id, null); assert.equal(rolled.upc_code, null); assert.equal(rolled.description, 'legacy');
      assert.deepEqual(await p.productVariant.findMany({ where: { product_id: product.id }, orderBy: { sku: 'asc' }, select: { sku: true, size: true, color: true } }), [{ sku: 'competing-variant', size: null, color: null }, { sku: 'shw-48in-standing-desk-drawer-black-default', size: null, color: null }]);
      assert.equal(await p.productAttribute.count({ where: { product_id: product.id } }), 0); const stale = await p.affiliateLink.findUniqueOrThrow({ where: { id: originalLink.id } }); assert.equal(stale.price, 299.99); assert.equal(stale.tracking_url, originalLink.tracking_url);
      await p.attributeDefinition.update({ where: { id: definition.id }, data: { allowed_values: originalAllowed === null ? Prisma.JsonNull : originalAllowed } });
    } finally { await p.$disconnect(); }
  } finally { c.stop(); }
});
test('owned harness rejects ambient database URL', () => { if (bin) assert.equal(process.env.ERGEAR_TEST_DATABASE_URL, undefined); });
