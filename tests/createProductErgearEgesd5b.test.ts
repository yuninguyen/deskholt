import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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
  let started = false;
  try {
    runner(bin, 'initdb', ['-D', root, '-A', 'trust', '-U', 'postgres']);
    for (const port of ports) {
      try {
        runner(bin, 'pg_ctl', ['-D', root, '-o', `-p ${port} -h 127.0.0.1`, '-w', 'start']);
        started = true;
        const url = `postgresql://postgres@127.0.0.1:${port}/${database}`;
        runner(bin, 'createdb', ['-h', '127.0.0.1', '-p', String(port), '-U', 'postgres', database]);
        return {
          root,
          url,
          stop() {
            if (started) runner(bin, 'pg_ctl', ['-D', root, '-w', 'stop']);
            rmSync(root, { recursive: true, force: true });
          },
        };
      } catch (error) {
        if (started) { try { runner(bin, 'pg_ctl', ['-D', root, '-w', 'stop']); } catch {} }
        started = false;
        if (port === ports[ports.length - 1]) throw error;
      }
    }
    throw new Error('Could not start owned PostgreSQL cluster');
  } catch (error) {
    if (started) { try { runner(bin, 'pg_ctl', ['-D', root, '-w', 'stop']); } catch {} }
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
