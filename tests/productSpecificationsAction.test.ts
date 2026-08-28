import test from 'node:test';
import assert from 'node:assert/strict';
import type { Confidence, SourceType } from '@prisma/client';
import {
  createSaveSpecificationsAction,
  type SaveSpecificationsDependencies,
} from '../src/lib/products/specificationSaveAction';
import type { SpecificationData, SpecRow } from '../src/lib/products/specificationRows';

const productId = 'cm12345678901234567890';
const definitionId = 'cm22345678901234567890';
const fixedNow = new Date('2026-08-27T10:00:00.000Z');

function row(overrides: Partial<SpecRow> = {}): SpecRow {
  return {
    rowKey: `${definitionId}__p`,
    attributeDefinitionId: definitionId,
    variantId: null,
    variantLabel: null,
    scope: 'PRODUCT',
    dataType: 'DECIMAL',
    key: 'max_height_in',
    label: 'Maximum Height',
    unit: 'in',
    allowedValues: null,
    isRequired: true,
    existing: null,
    ...overrides,
  };
}

function specificationData(rows: SpecRow[]): SpecificationData {
  return {
    product: { id: productId, name: 'Test Desk', slug: 'test-desk', category: 'standing-desks' },
    categoryName: 'Standing Desks',
    variants: [],
    rows,
    completeness: { met: 0, total: 1 },
  };
}

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  data.set('productId', productId);
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

type Write = { operation: string; args: unknown };

function harness(rows: SpecRow[], validationErrors: string[] = []) {
  const writes: Write[] = [];
  const redirects: string[] = [];
  let transactions = 0;
  let validations = 0;
  let existingRecord: { id: string } | null = rows.some((value) => value.existing)
    ? { id: 'cm-existing-attribute' }
    : null;

  const tx = {
    productAttribute: {
      findFirst: async (args: unknown) => {
        writes.push({ operation: 'findFirst', args });
        return existingRecord;
      },
      delete: async (args: unknown) => {
        writes.push({ operation: 'delete', args });
        existingRecord = null;
        return args;
      },
      update: async (args: unknown) => {
        writes.push({ operation: 'update', args });
        return args;
      },
      create: async (args: unknown) => {
        writes.push({ operation: 'create', args });
        existingRecord = { id: 'cm-created-attribute' };
        return args;
      },
    },
  };

  const dependencies: SaveSpecificationsDependencies = {
    loadSpecificationData: async () => specificationData(rows),
    validateProductAttributeInput: async () => {
      validations += 1;
      return validationErrors.length > 0
        ? { valid: false, errors: validationErrors }
        : { valid: true, errors: [] };
    },
    transaction: async (callback) => {
      transactions += 1;
      return callback(tx as never);
    },
    now: () => fixedNow,
    redirect: (path) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  };

  return {
    action: createSaveSpecificationsAction(dependencies),
    writes,
    redirects,
    getTransactions: () => transactions,
    getValidations: () => validations,
  };
}

async function redirecting(action: (data: FormData) => Promise<void>, data: FormData) {
  await assert.rejects(() => action(data), /NEXT_REDIRECT:/);
}

test('source-without-value rejects before transaction with zero writes', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '',
      [`sourceUrl__${value.rowKey}`]: 'https://manufacturer.example/specs',
    })
  );

  assert.equal(testHarness.getTransactions(), 0);
  assert.equal(testHarness.getValidations(), 0);
  assert.deepEqual(testHarness.writes, []);
  assert.match(testHarness.redirects[0] ?? '', /error=1/);
});

test('blank new row is skipped and successful save redirects with zero writes', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(testHarness.action, form({ [`value__${value.rowKey}`]: '' }));

  assert.equal(testHarness.getTransactions(), 1);
  assert.equal(testHarness.getValidations(), 0);
  assert.deepEqual(testHarness.writes, []);
  assert.deepEqual(testHarness.redirects, [`/admin/products/${productId}/specifications?saved=1`]);
});

test('clearing an existing row deletes it inside the transaction', async () => {
  const value = row({
    existing: {
      valueString: null,
      valueNumber: 48.5,
      valueBoolean: null,
      sourceUrl: null,
      sourceType: null,
      confidence: 'VERIFIED',
    },
  });
  const testHarness = harness([value]);

  await redirecting(testHarness.action, form({ [`value__${value.rowKey}`]: '' }));

  assert.deepEqual(testHarness.writes.map((entry) => entry.operation), ['findFirst', 'delete']);
});

test('VERIFIED update sets one shared save timestamp', async () => {
  const value = row({
    existing: {
      valueString: null,
      valueNumber: 48.5,
      valueBoolean: null,
      sourceUrl: null,
      sourceType: null,
      confidence: 'LIKELY',
    },
  });
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '49.25',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'VERIFIED',
    })
  );

  const update = testHarness.writes.find((entry) => entry.operation === 'update');
  assert.ok(update);
  assert.deepEqual((update.args as { data: { verified_at: Date } }).data.verified_at, fixedNow);
  assert.equal(testHarness.getValidations(), 1);
});

test('LIKELY create clears verified timestamp and persists parsed source fields', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '48.5',
      [`sourceUrl__${value.rowKey}`]: 'https://manufacturer.example/specs',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'LIKELY',
    })
  );

  const create = testHarness.writes.find((entry) => entry.operation === 'create');
  assert.ok(create);
  const data = (create.args as {
    data: { verified_at: Date | null; source_url: string | null; source_type: SourceType | null; confidence: Confidence };
  }).data;
  assert.equal(data.verified_at, null);
  assert.equal(data.source_url, 'https://manufacturer.example/specs');
  assert.equal(data.source_type, 'MANUFACTURER');
  assert.equal(data.confidence, 'LIKELY');
});

test('one invalid non-blank row prevents every transaction write', async () => {
  const validRow = row();
  const invalidRow = row({
    rowKey: 'cm33333333333333333333__p',
    attributeDefinitionId: 'cm33333333333333333333',
    label: 'Minimum Height',
  });
  const testHarness = harness([validRow, invalidRow], ['scope mismatch']);

  await redirecting(
    testHarness.action,
    form({
      [`value__${validRow.rowKey}`]: '48.5',
      [`value__${invalidRow.rowKey}`]: '24.5',
    })
  );

  assert.equal(testHarness.getTransactions(), 0);
  assert.equal(testHarness.getValidations(), 2);
  assert.deepEqual(testHarness.writes, []);
  assert.match(testHarness.redirects[0] ?? '', /error=1/);
});
