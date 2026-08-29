import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createProductErgearEgesd5b } from '../scripts/create-product-ergear-egesd5b';
import { convertLengthToCanonicalInches } from '../src/lib/products/unitConversion';

const postgresBin = process.env.ERGEAR_TEST_POSTGRES_BIN;
const externalUrl = process.env.ERGEAR_TEST_DATABASE_URL;

/** Test-only safety boundary: no caller URL can ever become the integration target. */
function ownedTargetConfig(bin: string | undefined, ignoredUrl: string | undefined) {
  assert.equal(ignoredUrl, undefined, 'ERGEAR_TEST_DATABASE_URL is forbidden');
  if (!bin) return undefined;
  return { bin };
}

function executable(bin: string, name: string) {
  return join(bin, process.platform === 'win32' ? `${name}.exe` : name);
}

function runLocalNodeCli(cli: string, args: string[], env: NodeJS.ProcessEnv) {
  execFileSync(process.execPath, [cli, ...args], { cwd: process.cwd(), env, stdio: 'inherit' });
}

type ProcessRunner = (bin: string, command: string, args: string[]) => void;

function run(bin: string, command: string, args: string[], env?: NodeJS.ProcessEnv) {
  execFileSync(executable(bin, command), args, { cwd: process.cwd(), env, stdio: 'inherit' });
}

async function launchOwnedPostgres(bin: string, runner: ProcessRunner = run, candidates?: number[]) {
  const root = mkdtempSync(join(tmpdir(), 'ergear-postgres-'));
  const ports = candidates ?? Array.from({ length: 1000 }, (_, index) => 56000 + index).filter((port) => port < 56050 || port > 56249).sort(() => Math.random() - 0.5);
  const database = 'ergear_test';
  let cleanupRequired = false;
  const stopBestEffort = () => {
    if (!cleanupRequired) return;
    try { runner(bin, 'pg_ctl', ['-D', root, '-w', 'stop']); } catch {}
    cleanupRequired = false;
  };
  try {
    runner(bin, 'initdb', ['-D', root, '-A', 'trust', '-U', 'postgres']);
    for (const port of ports) {
      try {
        cleanupRequired = true;
        runner(bin, 'pg_ctl', ['-D', root, '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start']);
        const url = `postgresql://postgres@127.0.0.1:${port}/${database}`;
        runner(bin, 'createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', database]);
        return {
          root,
          url,
          stop() {
            stopBestEffort();
            rmSync(root, { recursive: true, force: true });
          },
        };
      } catch (error) {
        stopBestEffort();
        if (port === ports[ports.length - 1]) throw error;
      }
    }
    throw new Error('Could not start owned PostgreSQL cluster');
  } catch (error) {
    stopBestEffort();
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

// RED proof: an external URL cannot be accepted as a test target.
test('rejects caller-provided database URLs before any connection', () => {
  assert.throws(() => ownedTargetConfig(undefined, 'postgresql://shared.example/db'), /forbidden/);
});

test('retries pg_ctl bind failure before returning a target or connecting', async () => {
  const calls: string[][] = [];
  let pgCtlStarts = 0;
  const runner: ProcessRunner = (_bin, command, args) => {
    calls.push([command, ...args]);
    if (command === 'pg_ctl' && args.at(-1) === 'start' && ++pgCtlStarts === 1) throw new Error('address already in use');
  };
  const cluster = await launchOwnedPostgres('fake-bin', runner, [56000, 56001]);
  try {
    assert.match(cluster.url, /:56001\//);
    assert.deepEqual(calls.filter(([command]) => command === 'createdb').map((call) => call[4]), ['56001']);
    assert.equal(calls.filter(([command, ...args]) => command === 'pg_ctl' && args.at(-1) === 'start').length, 2);
    assert.deepEqual(calls.map(([command, ...args]) => [command, args.at(-1)]), [
      ['initdb', 'postgres'],
      ['pg_ctl', 'start'],
      ['pg_ctl', 'stop'],
      ['pg_ctl', 'start'],
      ['createdb', 'ergear_test'],
    ]);
  } finally {
    cluster.stop();
  }
});

const integration = postgresBin ? test : test.skip;
integration('runs all ErGear behavior only inside one owned disposable cluster', async (t) => {
  const target = ownedTargetConfig(postgresBin, externalUrl);
  assert.ok(target);
  const cluster = await launchOwnedPostgres(target.bin);
  const env = { ...process.env, DATABASE_URL: cluster.url };
  try {
    runLocalNodeCli(require.resolve('prisma/build/index.js'), ['migrate', 'deploy'], env);
    runLocalNodeCli(require.resolve('tsx/cli'), ['prisma/seed-standing-desk-attributes.ts'], env);
    const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } });
    try {
      await t.test('creates exact identity and links', async () => {
        await createProductErgearEgesd5b(prisma);
        const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: 'ergear' } });
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        assert.deepEqual({ slug: brand.slug, name: brand.name }, { slug: 'ergear', name: 'ErGear' });
        assert.deepEqual({ name: product.name, slug: product.slug, category: product.category, status: product.status, is_indexed: product.is_indexed, is_sustainable: product.is_sustainable, upc_code: product.upc_code, brand_id: product.brand_id, category_id: product.category_id, description: product.description, image_url: product.image_url }, { name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)', slug: 'ergear-egesd5b-standing-desk-black', category: 'standing-desks', status: 'DRAFT', is_indexed: false, is_sustainable: false, upc_code: 'B0B41YH9B6', brand_id: brand.id, category_id: (await prisma.category.findUniqueOrThrow({ where: { slug: 'standing-desks' } })).id, description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.', image_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80' });
      });
      await t.test('persists exact variant and all sourced attributes', async () => {
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        const variant = await prisma.productVariant.findFirstOrThrow({ where: { product_id: product.id, sku: 'ergear-egesd5b-48x24-black' } });
        assert.deepEqual({ sku: variant.sku, size: variant.size, color: variant.color, is_active: variant.is_active }, { sku: 'ergear-egesd5b-48x24-black', size: '48x24', color: 'Black', is_active: true });
        const rows = await prisma.productAttribute.findMany({ where: { product_id: product.id }, include: { attribute_definition: true } });
        const values = new Map(rows.map((row) => [row.attribute_definition.key, row]));
        const number = (key: string) => values.get(key)?.value_number?.toString();
        assert.equal(number('min_height_in'), '28.35');
        assert.equal(Number(number('max_height_in')), Number(convertLengthToCanonicalInches(118, 'cm').toFixed(6)));
        assert.equal(number('max_load_lb'), '176'); assert.equal(number('product_weight_lb'), '43.8'); assert.equal(number('desktop_thickness_in'), '0.67');
        assert.equal(values.get('adjustment_type')?.value_string, 'ELECTRIC'); assert.equal(number('memory_presets'), '4'); assert.equal(values.get('frame_material')?.value_string, 'STEEL');
        assert.equal(values.get('desktop_shape')?.value_string, 'RECTANGULAR'); assert.equal(values.get('desktop_included')?.value_boolean, true);
        assert.equal(number('desktop_width_in'), '47.2'); assert.equal(number('desktop_depth_in'), '23.6'); assert.equal(values.get('desktop_material')?.value_string, 'ENGINEERED_WOOD');
        assert.equal(values.get('desktop_finish')?.value_string, 'Laminated'); assert.equal(values.get('frame_color')?.value_string, 'Black');
        for (const key of ['adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included', 'min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'desktop_thickness_in', 'memory_presets']) assert.equal(values.get(key)?.variant_id, null, key);
        for (const key of ['adjustment_type', 'frame_material', 'desktop_shape', 'desktop_included', 'min_height_in', 'max_height_in', 'max_load_lb', 'product_weight_lb', 'desktop_thickness_in', 'memory_presets', 'desktop_width_in', 'desktop_depth_in', 'desktop_material', 'desktop_finish', 'frame_color']) { assert.equal(values.get(key)?.source_url, 'https://www.amazon.com/dp/B0B41YH9B6', key); assert.equal(values.get(key)?.source_type, 'RETAILER', key); assert.equal(values.get(key)?.confidence, 'VERIFIED', key); assert.ok(values.get(key)?.verified_at, key); }
         for (const key of ['desktop_width_in', 'desktop_depth_in', 'desktop_material', 'desktop_finish', 'frame_color']) { assert.equal(values.get(key)?.variant_id, variant.id, key); }
        for (const key of ['motor_count', 'warranty_months', 'leg_count', 'leg_design', 'lifting_speed_in_s', 'noise_db', 'anti_collision', 'crossbar', 'casters_compatible', 'certification_greenguard', 'certification_bifma', 'assembly_time_minutes']) assert.equal(values.has(key), false, key);
         const links = await prisma.affiliateLink.findMany({ where: { product_id: product.id, network: 'amazon' } });
         assert.deepEqual(links.map(({ network, price, raw_url, tracking_url, is_in_stock, priority_order }) => ({ network, price, raw_url, tracking_url, is_in_stock, priority_order })), [{ network: 'amazon', price: 139.99, raw_url: 'https://www.amazon.com/dp/B0B41YH9B6', tracking_url: 'https://www.amazon.com/dp/B0B41YH9B6?tag=deskholt-pending', is_in_stock: true, priority_order: 1 }]);
      });
      await t.test('is idempotent on rerun without duplicate variants or attributes', async () => {
        await createProductErgearEgesd5b(prisma);
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 1); assert.equal(await prisma.product.count({ where: { slug: product.slug } }), 1);
        assert.equal(await prisma.productVariant.count({ where: { product_id: product.id } }), 1); assert.equal(await prisma.productAttribute.count({ where: { product_id: product.id } }), 15); assert.equal(await prisma.affiliateLink.count({ where: { product_id: product.id, network: 'amazon' } }), 1);
      });
      await t.test('rolls back all rows when an allowed value is invalid', async () => {
        await prisma.productAttribute.deleteMany({ where: { product: { slug: 'ergear-egesd5b-standing-desk-black' } } });
        await prisma.productVariant.deleteMany({ where: { product: { slug: 'ergear-egesd5b-standing-desk-black' } } });
        await prisma.product.deleteMany({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        await prisma.brand.deleteMany({ where: { slug: 'ergear' } });
        const definition = await prisma.attributeDefinition.findUniqueOrThrow({ where: { key: 'adjustment_type' } });
        const originalAllowedValues = definition.allowed_values;
        try {
          await prisma.attributeDefinition.update({ where: { id: definition.id }, data: { allowed_values: ['MANUAL_CRANK'] } });
          await assert.rejects(() => createProductErgearEgesd5b(prisma), /adjustment_type.*allowed/i);
          assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 0);
          assert.equal(await prisma.product.count({ where: { slug: 'ergear-egesd5b-standing-desk-black' } }), 0);
          assert.equal(await prisma.productVariant.count(), 0);
          assert.equal(await prisma.productAttribute.count(), 0);
        } finally {
          await prisma.attributeDefinition.update({ where: { id: definition.id }, data: { allowed_values: originalAllowedValues as any } });
        }
      });
      await t.test('fails when prerequisite category is absent without creating rows', async () => {
        await prisma.product.deleteMany({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        await prisma.brand.deleteMany({ where: { slug: 'ergear' } });
        await prisma.category.delete({ where: { slug: 'standing-desks' } });
        await assert.rejects(() => createProductErgearEgesd5b(prisma), /standing-desks.*not found/i);
        assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 0);
        assert.equal(await prisma.product.count({ where: { slug: 'ergear-egesd5b-standing-desk-black' } }), 0);
      });
    } finally { await prisma.$disconnect(); }
  } finally { cluster.stop(); }
});
