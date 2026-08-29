import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import net from 'node:net';
import { PrismaClient } from '@prisma/client';
import { createProductErgearEgesd5b } from '../scripts/create-product-ergear-egesd5b';

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

async function freePort(): Promise<number> {
  for (let port = 56000 + Math.floor(Math.random() * 1000); port < 57000; port += 1) {
    if (port >= 56050 && port <= 56249) continue;
    const available = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(false));
      server.listen(port, '127.0.0.1', () => server.close(() => resolve(true)));
    });
    if (available) return port;
  }
  throw new Error('Could not allocate a permitted PostgreSQL port');
}

function run(bin: string, command: string, args: string[], env?: NodeJS.ProcessEnv) {
  execFileSync(executable(bin, command), args, { cwd: process.cwd(), env, stdio: 'inherit' });
}

async function launchOwnedPostgres(bin: string) {
  const root = mkdtempSync(join(tmpdir(), 'ergear-postgres-'));
  const port = await freePort();
  const database = 'ergear_test';
  const url = `postgresql://postgres@127.0.0.1:${port}/${database}`;
  let started = false;
  try {
    run(bin, 'initdb', ['-D', root, '-A', 'trust', '-U', 'postgres']);
    run(bin, 'pg_ctl', ['-D', root, '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start']);
    started = true;
    run(bin, 'createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', database]);
    return {
      root,
      url,
      stop() {
        if (started) run(bin, 'pg_ctl', ['-D', root, '-w', 'stop']);
        rmSync(root, { recursive: true, force: true });
      },
    };
  } catch (error) {
    if (started) { try { run(bin, 'pg_ctl', ['-D', root, '-w', 'stop']); } catch {} }
    rmSync(root, { recursive: true, force: true });
    throw error;
  }
}

// RED proof: an external URL cannot be accepted as a test target.
test('rejects caller-provided database URLs before any connection', () => {
  assert.throws(() => ownedTargetConfig(undefined, 'postgresql://shared.example/db'), /forbidden/);
});

const integration = postgresBin ? test : test.skip;
integration('runs all ErGear behavior only inside one owned disposable cluster', async (t) => {
  const target = ownedTargetConfig(postgresBin, externalUrl);
  assert.ok(target);
  const cluster = await launchOwnedPostgres(target.bin);
  const env = { ...process.env, DATABASE_URL: cluster.url };
  try {
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['prisma', 'migrate', 'deploy'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' });
    execFileSync(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['tsx', 'prisma/seed-standing-desk-attributes.ts'], { cwd: process.cwd(), env, stdio: 'inherit', shell: process.platform === 'win32' });
    const prisma = new PrismaClient({ datasources: { db: { url: cluster.url } } });
    try {
      await t.test('creates exact identity and links', async () => {
        await createProductErgearEgesd5b(prisma);
        const brand = await prisma.brand.findUniqueOrThrow({ where: { slug: 'ergear' } });
        const product = await prisma.product.findUniqueOrThrow({ where: { slug: 'ergear-egesd5b-standing-desk-black' } });
        assert.deepEqual({ slug: brand.slug, name: brand.name }, { slug: 'ergear', name: 'ErGear' });
        assert.deepEqual({ name: product.name, slug: product.slug, category: product.category, status: product.status, is_indexed: product.is_indexed, is_sustainable: product.is_sustainable, upc_code: product.upc_code, brand_id: product.brand_id, category_id: product.category_id, description: product.description, image_url: product.image_url }, { name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)', slug: 'ergear-egesd5b-standing-desk-black', category: 'standing-desks', status: 'DRAFT', is_indexed: false, is_sustainable: false, upc_code: 'B0B41YH9B6', brand_id: brand.id, category_id: (await prisma.category.findUniqueOrThrow({ where: { slug: 'standing-desks' } })).id, description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.', image_url: 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80' });
      });
      await t.test('is idempotent on rerun', async () => {
        await createProductErgearEgesd5b(prisma);
        assert.equal(await prisma.brand.count({ where: { slug: 'ergear' } }), 1);
        assert.equal(await prisma.product.count({ where: { slug: 'ergear-egesd5b-standing-desk-black' } }), 1);
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
