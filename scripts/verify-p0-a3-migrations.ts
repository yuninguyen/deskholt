import { createHash } from 'node:crypto';
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import {
  collectReadOnlyInventory,
  type IdentityFingerprint,
} from './snapshot-p0-a3-database.ts';

const REPOSITORY_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PRISMA_ROOT = join(REPOSITORY_ROOT, 'prisma');
const MIGRATIONS_ROOT = join(PRISMA_ROOT, 'migrations');
const BASELINE_DIR = '20260827014500_baseline_existing_schema';
const FEATURE_DIR = '20260827020000_p0_a3_basic_index_gate';
const LOCK_FILE = 'migration_lock.toml';

export function isPathInside(candidate: string, parent: string): boolean {
  const childPath = resolve(candidate);
  const parentPath = resolve(parent);
  const childRelative = relative(parentPath, childPath);
  return (
    childRelative.length > 0 &&
    childRelative !== '..' &&
    !childRelative.startsWith(`..${sep}`) &&
    !childRelative.startsWith('..\\') &&
    !childRelative.startsWith('../') &&
    !/^[A-Za-z]:/.test(childRelative)
  );
}

export function validateOwnedTempRoot(root: string, parent: string): void {
  if (!isPathInside(root, parent)) {
    throw new Error(`temporary root must be inside owned parent: ${root}`);
  }
  const leaf = root.replace(/[\\/]+$/, '').split(/[\\/]/).at(-1) ?? '';
  if (!/^deskholt-p0-a3-[a-z0-9-]+$/i.test(leaf) || leaf.length < 20) {
    throw new Error('temporary root must have a unique owned name');
  }
  if (existsSync(root)) {
    throw new Error('temporary root must be newly allocated and empty');
  }
}

export function assertMigrationTreeShape(entries: string[]): void {
  const normalized = [...entries].sort();
  const expected = [BASELINE_DIR, LOCK_FILE].sort();
  if (normalized.length !== expected.length || normalized.some((entry, index) => entry !== expected[index])) {
    throw new Error(
      `baseline-only migration tree is incomplete or contains a P0-A3 feature migration: ${normalized.join(', ')}`
    );
  }
}

export function assertExplicitPopulatedPostcheckInputs(
  env: Record<string, string | undefined>,
  expectedFingerprint: string | undefined
): void {
  if (!env.P0_A3_POPULATED_DATABASE_URL?.trim()) {
    throw new Error('P0_A3_POPULATED_DATABASE_URL is required; ambient DATABASE_URL is not accepted');
  }
  if (!expectedFingerprint?.trim()) {
    throw new Error('expected fingerprint is required for populated postcheck');
  }
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`${name} is required`);
  return value;
}

function argValue(args: string[], name: string): string | undefined {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function runPrisma(args: string[], databaseUrl: string, cwd: string): number {
  const prismaCli = join(REPOSITORY_ROOT, 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(process.execPath, [prismaCli, ...args], {
    cwd,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
    shell: false,
  });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

async function sha256(path: string): Promise<string> {
  return createHash('sha256').update(await readFile(path)).digest('hex');
}

async function copyFileWithHash(source: string, destination: string): Promise<string> {
  await cp(source, destination);
  return sha256(destination);
}

async function cleanupTempRoot(root: string): Promise<void> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(root, { recursive: true, force: true });
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
    }
  }
  throw lastError;
}

async function migrationEntries(root: string): Promise<string[]> {
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() || entry.name === LOCK_FILE)
    .map((entry) => entry.name)
    .sort();
}

async function stageRoot(includeFeature: boolean): Promise<{
  root: string;
  schemaPath: string;
  migrationsPath: string;
  sourceHashes: Record<string, string>;
  copyHashes: Record<string, string>;
}> {
  const root = await mkdtemp(join(tmpdir(), 'deskholt-p0-a3-'));
  const prismaRoot = join(root, 'prisma');
  const migrationsPath = join(prismaRoot, 'migrations');
  await import('node:fs/promises').then(({ mkdir }) => mkdir(join(migrationsPath, BASELINE_DIR), { recursive: true }));
  const files: Array<[string, string]> = [
    [join(PRISMA_ROOT, 'schema.prisma'), join(prismaRoot, 'schema.prisma')],
    [join(MIGRATIONS_ROOT, LOCK_FILE), join(migrationsPath, LOCK_FILE)],
    [
      join(MIGRATIONS_ROOT, BASELINE_DIR, 'migration.sql'),
      join(migrationsPath, BASELINE_DIR, 'migration.sql'),
    ],
  ];
  if (includeFeature) {
    await import('node:fs/promises').then(({ mkdir }) => mkdir(join(migrationsPath, FEATURE_DIR), { recursive: true }));
    files.push([
      join(MIGRATIONS_ROOT, FEATURE_DIR, 'migration.sql'),
      join(migrationsPath, FEATURE_DIR, 'migration.sql'),
    ]);
  }
  const sourceHashes: Record<string, string> = {};
  const copyHashes: Record<string, string> = {};
  for (const [source, destination] of files) {
    const relativePath = relative(REPOSITORY_ROOT, source);
    sourceHashes[relativePath] = await sha256(source);
    copyHashes[relativePath] = await copyFileWithHash(source, destination);
  }
  return {
    root,
    schemaPath: join(prismaRoot, 'schema.prisma'),
    migrationsPath,
    sourceHashes,
    copyHashes,
  };
}

async function withPrisma<T>(databaseUrl: string, fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  try {
    return await fn(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

const LEGACY_ID = 'p0-a3-legacy-fixture';
const POST_FEATURE_ID = 'p0-a3-post-feature-fixture';
const LEGACY_UPDATED_AT = '2000-01-02T03:04:05.000Z';

async function insertLegacyFixture(databaseUrl: string): Promise<Record<string, unknown>> {
  return withPrisma(databaseUrl, async (prisma) => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "products" ("id", "name", "slug", "category", "description", "image_url", "specs", "upc_code", "user_sentiment", "is_indexed", "is_sustainable", "created_at", "updated_at") VALUES ('${LEGACY_ID}', 'Legacy P0-A3', 'legacy-p0-a3', 'fixture', 'legacy description', 'https://example.test/legacy.png', '{"legacy":true}', 'legacy-upc', '{"sentiment":"legacy"}', true, true, '2000-01-01T00:00:00.000Z', '${LEGACY_UPDATED_AT}')`
    );
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, name, slug, category, description, image_url, specs, upc_code, user_sentiment, is_indexed, is_sustainable, created_at, updated_at FROM "products" WHERE id = '${LEGACY_ID}'`
    );
    if (!rows[0]) throw new Error('legacy fixture was not inserted');
    return rows[0];
  });
}

async function verifyLegacyBackfill(
  databaseUrl: string,
  before: Record<string, unknown>
): Promise<Record<string, unknown>> {
  return withPrisma(databaseUrl, async (prisma) => {
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
      `SELECT id, name, slug, category, description, image_url, specs, upc_code, user_sentiment, status, is_indexed, is_sustainable, created_at, updated_at FROM "products" WHERE id = '${LEGACY_ID}'`
    );
    const row = rows[0];
    if (!row || row.status !== 'ACTIVE' || row.is_indexed !== false) {
      throw new Error(`legacy backfill did not produce ACTIVE + false: ${JSON.stringify(row)}`);
    }
    for (const key of ['name', 'slug', 'category', 'description', 'image_url', 'specs', 'upc_code', 'user_sentiment', 'is_sustainable', 'created_at', 'updated_at']) {
      if (String(row[key]) !== String(before[key])) {
        throw new Error(`legacy non-target field changed: ${key}`);
      }
    }
    return row;
  });
}

async function verifyDefaultsAndPartialIndexes(databaseUrl: string): Promise<void> {
  await withPrisma(databaseUrl, async (prisma) => {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "products" ("id", "name", "slug", "category", "image_url", "created_at", "updated_at") VALUES ('${POST_FEATURE_ID}', 'Post P0-A3', 'post-p0-a3', 'fixture', 'https://example.test/post.png', now(), now())`
    );
    const defaults = await prisma.$queryRawUnsafe<Array<{ status: string; is_indexed: boolean }>>(
      `SELECT status::text, is_indexed FROM "products" WHERE id = '${POST_FEATURE_ID}'`
    );
    if (defaults[0]?.status !== 'DRAFT' || defaults[0]?.is_indexed !== false) {
      throw new Error(`new Product defaults are unsafe: ${JSON.stringify(defaults[0])}`);
    }

    await prisma.$executeRawUnsafe(
      `INSERT INTO "attribute_definitions" ("id", "key", "label", "data_type", "created_at", "updated_at") VALUES ('p0-a3-def', 'p0_a3_fixture', 'P0-A3 Fixture', 'STRING', now(), now())`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "product_variants" ("id", "product_id", "sku", "created_at", "updated_at") VALUES ('p0-a3-variant', '${LEGACY_ID}', 'p0-a3-sku', now(), now())`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "product_attributes" ("id", "product_id", "attribute_definition_id", "value_string", "updated_at") VALUES ('p0-a3-pa-product-1', '${LEGACY_ID}', 'p0-a3-def', 'one', now())`
    );
    let productDuplicateRejected = false;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "product_attributes" ("id", "product_id", "attribute_definition_id", "value_string", "updated_at") VALUES ('p0-a3-pa-product-2', '${LEGACY_ID}', 'p0-a3-def', 'two', now())`
      );
    } catch {
      productDuplicateRejected = true;
    }
    await prisma.$executeRawUnsafe(
      `INSERT INTO "product_attributes" ("id", "product_id", "variant_id", "attribute_definition_id", "value_string", "updated_at") VALUES ('p0-a3-pa-variant-1', '${LEGACY_ID}', 'p0-a3-variant', 'p0-a3-def', 'one', now())`
    );
    let variantDuplicateRejected = false;
    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO "product_attributes" ("id", "product_id", "variant_id", "attribute_definition_id", "value_string", "updated_at") VALUES ('p0-a3-pa-variant-2', '${LEGACY_ID}', 'p0-a3-variant', 'p0-a3-def', 'two', now())`
      );
    } catch {
      variantDuplicateRejected = true;
    }
    const indexes = await prisma.$queryRawUnsafe<Array<{ indexname: string; indexdef: string }>>(
      `SELECT indexname, indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname IN ('product_attributes_product_attribute_unique', 'product_attributes_variant_attribute_unique') ORDER BY indexname`
    );
    if (!productDuplicateRejected || !variantDuplicateRejected || indexes.length !== 2) {
      throw new Error(`partial-index behavior failed: ${JSON.stringify({ productDuplicateRejected, variantDuplicateRejected, indexes })}`);
    }
  });
}

function fingerprintString(identity: IdentityFingerprint): string {
  return [identity.clusterSystemIdentifier ?? 'unavailable', identity.databaseOid, identity.databaseName, identity.schema, identity.searchPath].join('|');
}

async function runCleanChain(): Promise<Record<string, unknown>> {
  const databaseUrl = requiredEnv('P0_A3_CLEAN_DATABASE_URL');
  const staged = await stageRoot(false);
  try {
    assertMigrationTreeShape(await migrationEntries(staged.migrationsPath));
    if (JSON.stringify(staged.sourceHashes) !== JSON.stringify(staged.copyHashes)) {
      throw new Error('baseline source/copy hashes differ');
    }
    const baselineExit = runPrisma(['migrate', 'deploy', '--schema', staged.schemaPath], databaseUrl, staged.root);
    if (baselineExit !== 0) throw new Error(`baseline deploy failed with exit code ${baselineExit}`);
    const before = await insertLegacyFixture(databaseUrl);
    await cp(join(MIGRATIONS_ROOT, FEATURE_DIR), join(staged.migrationsPath, FEATURE_DIR), { recursive: true });
    const entriesAfterFeature = await migrationEntries(staged.migrationsPath);
    if (entriesAfterFeature.length !== 3 || !entriesAfterFeature.includes(FEATURE_DIR)) {
      throw new Error(`expected lock plus two migrations, got ${entriesAfterFeature.join(', ')}`);
    }
    const featureExit = runPrisma(['migrate', 'deploy', '--schema', staged.schemaPath], databaseUrl, staged.root);
    if (featureExit !== 0) throw new Error(`feature deploy failed with exit code ${featureExit}`);
    const after = await verifyLegacyBackfill(databaseUrl, before);
    await verifyDefaultsAndPartialIndexes(databaseUrl);
    return {
      mode: 'clean-chain',
      baselineExit,
      featureExit,
      migrationEntries: entriesAfterFeature,
      legacy: { before, after },
      sourceHashes: staged.sourceHashes,
      copyHashes: staged.copyHashes,
      cleaned: true,
    };
  } finally {
    await cleanupTempRoot(staged.root);
  }
}

async function runFailureFixture(): Promise<Record<string, unknown>> {
  const databaseUrl = requiredEnv('P0_A3_FAILURE_DATABASE_URL');
  const staged = await stageRoot(false);
  const failureName = '20260827021000_p0_a3_rollback_fixture';
  try {
    assertMigrationTreeShape(await migrationEntries(staged.migrationsPath));
    const baselineExit = runPrisma(['migrate', 'deploy', '--schema', staged.schemaPath], databaseUrl, staged.root);
    if (baselineExit !== 0) throw new Error(`failure fixture baseline deploy failed with exit code ${baselineExit}`);
    const before = await insertLegacyFixture(databaseUrl);
    const featureSql = await readFile(join(MIGRATIONS_ROOT, FEATURE_DIR, 'migration.sql'), 'utf8');
    const failureSql = featureSql.replace(
      'COMMIT;',
      () => "DO $$ BEGIN RAISE EXCEPTION 'P0_A3_ROLLBACK_FIXTURE'; END $$;\n\nCOMMIT;"
    );
    const failureDir = join(staged.migrationsPath, failureName);
    await import('node:fs/promises').then(({ mkdir }) => mkdir(failureDir, { recursive: true }));
    await writeFile(join(failureDir, 'migration.sql'), failureSql, 'utf8');
    const deployExit = runPrisma(['migrate', 'deploy', '--schema', staged.schemaPath], databaseUrl, staged.root);
    if (deployExit === 0) throw new Error('rollback fixture unexpectedly succeeded');
    const result = await withPrisma(databaseUrl, async (prisma) => {
      const history = await prisma.$queryRawUnsafe<Array<{ migration_name: string; logs: string | null }>>(
        `SELECT migration_name, logs FROM "_prisma_migrations" WHERE migration_name = '${failureName}'`
      );
      const statusColumn = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'status')`
      );
      const enumType = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
        `SELECT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'ProductStatus')`
      );
      const row = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(
        `SELECT id, name, slug, is_indexed, updated_at FROM "products" WHERE id = '${LEGACY_ID}'`
      );
      const markerInFailureRecord =
        history[0]?.migration_name.toUpperCase().includes('P0_A3_ROLLBACK_FIXTURE') ||
        history[0]?.logs?.includes('P0_A3_ROLLBACK_FIXTURE') === true;
      if (!markerInFailureRecord) throw new Error('failed migration marker missing from history record/log');
      if (statusColumn[0]?.exists || enumType[0]?.exists) throw new Error('failed migration left feature schema behind');
      if (!row[0] || row[0].is_indexed !== before.is_indexed || String(row[0].updated_at) !== String(before.updated_at)) {
        throw new Error('failed migration changed legacy data');
      }
      return { history: history[0], statusColumn: statusColumn[0], enumType: enumType[0], row: row[0] };
    });
    return { mode: 'failure-fixture', baselineExit, deployExit, failureName, result, cleaned: true };
  } finally {
    await cleanupTempRoot(staged.root);
  }
}

async function runPopulatedPostcheck(expectedFingerprint: string): Promise<Record<string, unknown>> {
  const databaseUrl = requiredEnv('P0_A3_POPULATED_DATABASE_URL');
  assertExplicitPopulatedPostcheckInputs(process.env, expectedFingerprint);
  const result = await collectReadOnlyInventory(databaseUrl);
  const actualFingerprint = fingerprintString(result.identity);
  if (actualFingerprint !== expectedFingerprint) {
    throw new Error(`populated fingerprint mismatch: expected ${expectedFingerprint}, got ${actualFingerprint}`);
  }
  const activeNotIndexed = await withPrisma(databaseUrl, async (prisma) =>
    prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*)::bigint AS count FROM "products" WHERE status::text = 'ACTIVE' AND is_indexed = false`
    )
  );
  return { mode: 'populated-postcheck', fingerprint: actualFingerprint, activeNotIndexed: Number(activeNotIndexed[0]?.count ?? 0), snapshotHash: result.snapshotHash, readOnly: true };
}

async function main() {
  const args = process.argv.slice(2);
  const mode = argValue(args, '--mode');
  if (!mode || args.includes('--help')) {
    console.log('Usage: npm run verify:p0-a3:migrations -- --mode <clean-chain|failure-fixture|populated-postcheck> [--expected-fingerprint <value>]');
    return;
  }
  let result: Record<string, unknown>;
  if (mode === 'clean-chain') result = await runCleanChain();
  else if (mode === 'failure-fixture') result = await runFailureFixture();
  else if (mode === 'populated-postcheck') result = await runPopulatedPostcheck(argValue(args, '--expected-fingerprint') ?? '');
  else throw new Error(`unsupported migration verifier mode: ${mode}`);
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1]?.endsWith('verify-p0-a3-migrations.ts')) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
