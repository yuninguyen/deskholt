import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { createProducts3to7StandingDesks } from '../scripts/create-products-3to7-standing-desks';

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
    const products = await prisma.product.findMany({ where: { slug: { in: expected.map(([slug]) => slug) } }, include: { brand: true, category_ref: true }, orderBy: { slug: 'asc' } });
    assert.equal(products.length, 5); assert.equal(await prisma.brand.count({ where: { slug: { in: ['veken', 'claiks', 'fezibo', 'offigo'] } } }), 4);
    for (const [slug, name, upc, brand, sustainable] of expected) { const row = products.find((product) => product.slug === slug)!; assert.deepEqual({ name: row.name, upc: row.upc_code, brand: row.brand?.slug, category: row.category_ref?.slug, status: row.status, indexed: row.is_indexed, sustainable: row.is_sustainable }, { name, upc, brand, category: 'standing-desks', status: 'DRAFT', indexed: false, sustainable }); }
    await createProducts3to7StandingDesks(prisma); assert.equal(await prisma.product.count({ where: { slug: { in: expected.map(([slug]) => slug) } } }), 5); assert.equal(await prisma.brand.count({ where: { slug: { in: ['veken', 'claiks', 'fezibo', 'offigo'] } } }), 4);
  } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});
integration('fails before writes when standing-desks category is missing', async () => {
  const cluster = owned(); try { migrate(cluster.url, false); const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } }); try { await assert.rejects(() => createProducts3to7StandingDesks(prisma), /standing-desks/i); assert.equal(await prisma.product.count(), 0); assert.equal(await prisma.brand.count(), 0); } finally { await prisma.$disconnect(); } } finally { cluster.stop(); }
});
test('owned harness rejects ambient database URL', () => { if (bin) assert.equal(process.env.ERGEAR_TEST_DATABASE_URL, undefined); });
