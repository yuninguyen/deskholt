import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadSpecificationData, type SpecRow } from '../src/lib/products/specificationRows';
import { createSaveSpecificationsAction } from '../src/lib/products/specificationSaveAction';
import { validateProductAttributeInput } from '../src/lib/products/productAttributeValidator';

const explicitUrl = process.env.SPEC_001_ACCEPTANCE_DATABASE_URL?.trim();
const output = process.env.SPEC_001_ACCEPTANCE_OUTPUT?.trim();

if (!explicitUrl || process.env.SPEC_001_ACCEPTANCE_ALLOW !== 'true') {
  throw new Error('Explicit disposable acceptance URL and SPEC_001_ACCEPTANCE_ALLOW=true are required');
}

const target = new URL(explicitUrl);
const port = Number(target.port);
if (!['127.0.0.1', 'localhost'].includes(target.hostname) || !Number.isInteger(port) || port < 56000) {
  throw new Error('Spec 001 acceptance refuses non-loopback or low-port PostgreSQL targets');
}

const prisma = new PrismaClient({ datasources: { db: { url: explicitUrl } } });
const redirects: string[] = [];
const action = createSaveSpecificationsAction({
  loadSpecificationData: (productId) => loadSpecificationData(prisma, productId),
  validateProductAttributeInput: (input) => validateProductAttributeInput(prisma, input),
  transaction: (callback) => prisma.$transaction(callback),
  now: () => new Date('2026-08-27T12:00:00.000Z'),
  redirect: (path) => {
    redirects.push(path);
    throw new Error(`NEXT_REDIRECT:${path}`);
  },
});

function hash(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

async function protectedSnapshot() {
  const [products, links, clicks, conversions] = await Promise.all([
    prisma.product.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, slug: true, name: true, category: true, status: true, is_indexed: true },
    }),
    prisma.affiliateLink.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, product_id: true, network: true, tracking_url: true },
    }),
    prisma.click.findMany({ orderBy: { id: 'asc' }, select: { id: true, click_id: true, product_id: true } }),
    prisma.conversion.findMany({ orderBy: { id: 'asc' }, select: { id: true, click_id: true } }),
  ]);
  const records = { products, links, clicks, conversions };
  return {
    counts: {
      products: products.length,
      affiliateLinks: links.length,
      clicks: clicks.length,
      conversions: conversions.length,
    },
    hash: hash(records),
  };
}

function valueFor(row: SpecRow): string {
  if (row.dataType === 'DECIMAL') return '42.5';
  if (row.dataType === 'INTEGER') return '2';
  if (row.dataType === 'BOOLEAN') return 'true';
  if (row.dataType === 'ENUM') {
    const value = row.allowedValues?.[0];
    if (!value) throw new Error(`ENUM row ${row.key} has no allowed value`);
    return value;
  }
  return `Acceptance ${row.key}`;
}

function existingValue(row: SpecRow): string {
  if (!row.existing) return '';
  if (row.existing.valueNumber !== null) return String(row.existing.valueNumber);
  if (row.existing.valueBoolean !== null) return String(row.existing.valueBoolean);
  return row.existing.valueString ?? '';
}

function setRow(form: FormData, row: SpecRow, value: string) {
  form.set(`value__${row.rowKey}`, value);
  form.set(`sourceUrl__${row.rowKey}`, value === '' ? '' : 'https://manufacturer.example/specs');
  form.set(`sourceType__${row.rowKey}`, value === '' ? '' : 'MANUFACTURER');
  form.set(`confidence__${row.rowKey}`, value === '' ? 'UNVERIFIED' : 'VERIFIED');
}

async function submit(form: FormData) {
  await action(form).then(
    () => {
      throw new Error('Specifications action returned without redirect');
    },
    (error: unknown) => {
      if (!(error instanceof Error) || !error.message.startsWith('NEXT_REDIRECT:')) throw error;
    }
  );
}

async function main() {
  const before = await protectedSnapshot();
  const [definitionCount, categoryAttributeCount, standingDesks, variantCount] = await Promise.all([
    prisma.attributeDefinition.count(),
    prisma.categoryAttribute.count(),
    prisma.product.findMany({
      where: { category: 'standing-desks' },
      orderBy: { slug: 'asc' },
      take: 3,
      select: { id: true, slug: true, name: true },
    }),
    prisma.productVariant.count({ where: { is_active: true } }),
  ]);
  if (definitionCount !== 35 || categoryAttributeCount !== 35 || standingDesks.length !== 3) {
    throw new Error('Seeded Attribute Engine acceptance prerequisites do not match');
  }

  const initialCompleteness = [];
  for (const product of standingDesks) {
    const data = await loadSpecificationData(prisma, product.id);
    if (!data) throw new Error(`Missing specification data for ${product.slug}`);
    initialCompleteness.push({ slug: product.slug, ...data.completeness });
  }

  const targetProduct = standingDesks[0];
  const initialTarget = await loadSpecificationData(prisma, targetProduct.id);
  if (!initialTarget) throw new Error('Missing target specification data');
  const requiredRows = initialTarget.rows.filter((row) => row.isRequired && row.scope !== 'DERIVED');
  if (requiredRows.length === 0) throw new Error('No required rows found for acceptance');

  const saveForm = new FormData();
  saveForm.set('productId', targetProduct.id);
  for (const row of requiredRows) setRow(saveForm, row, valueFor(row));
  await submit(saveForm);

  const afterSave = await loadSpecificationData(prisma, targetProduct.id);
  if (!afterSave) throw new Error('Missing target after save');
  if (afterSave.completeness.met !== afterSave.completeness.total) {
    throw new Error(`Completeness expected full, got ${afterSave.completeness.met}/${afterSave.completeness.total}`);
  }
  const savedRequired = afterSave.rows.filter(
    (row) => row.isRequired && row.scope !== 'DERIVED' && row.existing !== null
  );
  if (savedRequired.length !== requiredRows.length) throw new Error('Required row persistence mismatch');
  const verifiedRows = await prisma.productAttribute.count({
    where: { product_id: targetProduct.id, confidence: 'VERIFIED', verified_at: { not: null } },
  });
  if (verifiedRows !== requiredRows.length) throw new Error('VERIFIED timestamp persistence mismatch');

  const clearedRow = savedRequired[0];
  const clearForm = new FormData();
  clearForm.set('productId', targetProduct.id);
  for (const row of afterSave.rows) {
    if (!row.existing || row.scope === 'DERIVED') continue;
    setRow(clearForm, row, row.rowKey === clearedRow.rowKey ? '' : existingValue(row));
  }
  await submit(clearForm);

  const afterClear = await loadSpecificationData(prisma, targetProduct.id);
  if (!afterClear) throw new Error('Missing target after clear');
  if (afterClear.rows.find((row) => row.rowKey === clearedRow.rowKey)?.existing !== null) {
    throw new Error('Clear-to-delete acceptance failed');
  }
  if (afterClear.completeness.met !== afterClear.completeness.total - 1) {
    throw new Error('Completeness did not decrease after required-row deletion');
  }

  const after = await protectedSnapshot();
  if (before.hash !== after.hash || JSON.stringify(before.counts) !== JSON.stringify(after.counts)) {
    throw new Error('Protected legacy Product/AffiliateLink/Click/Conversion preservation mismatch');
  }

  const result = {
    target: { hostname: target.hostname, port, database: target.pathname.slice(1), disposable: true },
    seed: { definitionCount, categoryAttributeCount, activeVariantCount: variantCount },
    protectedBefore: before,
    protectedAfter: after,
    initialCompleteness,
    targetProduct: targetProduct.slug,
    fullCompletenessAfterSave: afterSave.completeness,
    completenessAfterClear: afterClear.completeness,
    requiredRowsWritten: requiredRows.length,
    verifiedRows,
    clearToDeleteRowKey: clearedRow.rowKey,
    redirects,
    acceptance: 'PASS',
  };

  if (output) {
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  }
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
