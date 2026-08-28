import test from 'node:test';
import assert from 'node:assert/strict';
import type { Confidence, SourceType } from '@prisma/client';
import {
  createSaveSpecificationsAction,
  type SaveSpecificationsDependencies,
} from '../src/lib/products/specificationSaveAction';
import { loadSpecificationData } from '../src/lib/products/specificationRows';
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

function harness(rows: SpecRow[], validationErrorsByRow: Record<string, string[]> = {}) {
  const writes: Write[] = [];
  const redirects: string[] = [];
  const validatedDefinitionIds: string[] = [];
  let transactions = 0;
  let validations = 0;
  let nowCalls = 0;
  const savedDrafts: Array<{ productId: string; rows: Record<string, unknown> }> = [];
  const clearedDraftProducts: string[] = [];
  const existingRecords = new Map(
    rows
      .filter((value) => value.existing)
      .map((value) => [value.attributeDefinitionId, { id: `existing-${value.attributeDefinitionId}` }])
  );

  const tx = {
    productAttribute: {
      findFirst: async (args: unknown) => {
        writes.push({ operation: 'findFirst', args });
        const definition = (args as { where: { attribute_definition_id: string } }).where
          .attribute_definition_id;
        return existingRecords.get(definition) ?? null;
      },
      delete: async (args: unknown) => {
        writes.push({ operation: 'delete', args });
        return args;
      },
      update: async (args: unknown) => {
        writes.push({ operation: 'update', args });
        return args;
      },
      create: async (args: unknown) => {
        writes.push({ operation: 'create', args });
        return args;
      },
    },
  };

  const dependencies: SaveSpecificationsDependencies = {
    loadSpecificationData: async () => specificationData(rows),
    validateProductAttributeInput: async (input) => {
      validations += 1;
      validatedDefinitionIds.push(input.attributeDefinitionId);
      const errors = validationErrorsByRow[input.attributeDefinitionId] ?? [];
      return errors.length > 0 ? { valid: false, errors } : { valid: true, errors: [] };
    },
    transaction: async (callback) => {
      transactions += 1;
      return callback(tx as never);
    },
    now: () => {
      nowCalls += 1;
      return fixedNow;
    },
    saveDraft: (draftProductId, draftRows) => {
      savedDrafts.push({ productId: draftProductId, rows: draftRows });
      return 'opaque_test_token';
    },
    clearProductDrafts: (draftProductId) => {
      clearedDraftProducts.push(draftProductId);
    },
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
    getNowCalls: () => nowCalls,
    savedDrafts,
    clearedDraftProducts,
    validatedDefinitionIds,
  };
}

async function redirecting(action: (data: FormData) => Promise<void>, data: FormData) {
  await assert.rejects(() => action(data), /NEXT_REDIRECT:/);
}

test('specification loader uses category relation and avoids slug lookup', async () => {
  let categoryLookups = 0;
  let productArgs: unknown;
  const definition = { id: definitionId, scope: 'PRODUCT', data_type: 'DECIMAL', key: 'height', label: 'Height', unit: null, allowed_values: null };
  const prisma = {
    product: { findUnique: async (args: unknown) => { productArgs = args; return { id: productId, name: 'Desk', slug: 'desk', category: 'legacy', category_id: 'cat-1', category_ref: { id: 'cat-1', name: 'Standing', category_attributes: [{ attribute_definition: definition, is_required: true, display_order: 1 }] } }; } },
    category: { findUnique: async () => { categoryLookups += 1; return null; } },
    productVariant: { findMany: async () => [] },
    productAttribute: { findMany: async () => [] },
  };
  const result = await loadSpecificationData(prisma as never, productId);
  assert.equal(result?.categoryName, 'Standing');
  assert.equal(categoryLookups, 0);
  assert.match(JSON.stringify(productArgs), /category_ref/);
});

test('specification loader falls back to one slug lookup for legacy products', async () => {
  let categoryLookups = 0;
  const definition = {
    id: definitionId,
    scope: 'PRODUCT',
    data_type: 'DECIMAL',
    key: 'height',
    label: 'Height',
    unit: null,
    allowed_values: null,
  };
  const prisma = {
    product: {
      findUnique: async () => ({
        id: productId,
        name: 'Desk',
        slug: 'desk',
        category: 'legacy',
        category_id: null,
        category_ref: null,
      }),
    },
    category: {
      findUnique: async (args: unknown) => {
        categoryLookups += 1;
        assert.deepEqual(args, {
          where: { slug: 'legacy' },
          include: {
            category_attributes: {
              include: { attribute_definition: true },
              orderBy: { display_order: 'asc' },
            },
          },
        });
        return {
          id: 'cat-1',
          name: 'Standing',
          category_attributes: [{ attribute_definition: definition, is_required: true, display_order: 1 }],
        };
      },
    },
    productVariant: { findMany: async () => [] },
    productAttribute: { findMany: async () => [] },
  };
  const result = await loadSpecificationData(prisma as never, productId);
  assert.equal(result?.categoryName, 'Standing');
  assert.equal(categoryLookups, 1);
});

test('specification loader returns null without slug lookup for missing non-null relation', async () => {
  let categoryLookups = 0;
  const prisma = {
    product: {
      findUnique: async () => ({
        id: productId,
        name: 'Desk',
        slug: 'desk',
        category: 'legacy',
        category_id: 'cat-1',
        category_ref: null,
      }),
    },
    category: { findUnique: async () => { categoryLookups += 1; return null; } },
    productVariant: { findMany: async () => [] },
    productAttribute: { findMany: async () => [] },
  };
  const result = await loadSpecificationData(prisma as never, productId);
  assert.equal(result, null);
  assert.equal(categoryLookups, 0);
});

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

test('VERIFIED update and create share one save timestamp', async () => {
  const updateRow = row({
    existing: {
      valueString: null,
      valueNumber: 48.5,
      valueBoolean: null,
      sourceUrl: null,
      sourceType: null,
      confidence: 'LIKELY',
    },
  });
  const createRow = row({
    rowKey: 'cm33333333333333333333__p',
    attributeDefinitionId: 'cm33333333333333333333',
    key: 'min_height_in',
    label: 'Minimum Height',
  });
  const testHarness = harness([updateRow, createRow]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${updateRow.rowKey}`]: '49.25',
      [`sourceUrl__${updateRow.rowKey}`]: 'https://manufacturer.example/update-specs',
      [`sourceType__${updateRow.rowKey}`]: 'MANUFACTURER',
      [`confidence__${updateRow.rowKey}`]: 'VERIFIED',
      [`value__${createRow.rowKey}`]: '24.5',
      [`sourceUrl__${createRow.rowKey}`]: 'https://manufacturer.example/create-specs',
      [`sourceType__${createRow.rowKey}`]: 'MANUFACTURER',
      [`confidence__${createRow.rowKey}`]: 'VERIFIED',
    })
  );

  const update = testHarness.writes.find((entry) => entry.operation === 'update');
  const create = testHarness.writes.find((entry) => entry.operation === 'create');
  assert.ok(update);
  assert.ok(create);
  assert.equal((update.args as { data: { verified_at: Date } }).data.verified_at, fixedNow);
  assert.equal((create.args as { data: { verified_at: Date } }).data.verified_at, fixedNow);
  assert.equal(testHarness.getNowCalls(), 1);
  assert.equal(testHarness.getValidations(), 2);
});

test('VERIFIED with an empty source URL rejects before transaction with zero writes', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '48.5',
      [`sourceUrl__${value.rowKey}`]: '',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'VERIFIED',
    })
  );

  assert.equal(testHarness.getTransactions(), 0);
  assert.deepEqual(testHarness.writes, []);
  assert.match(testHarness.redirects[0] ?? '', /error=1/);
});

test('VERIFIED with a non-URL source rejects before transaction with zero writes', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '48.5',
      [`sourceUrl__${value.rowKey}`]: 'not a url',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'VERIFIED',
    })
  );

  assert.equal(testHarness.getTransactions(), 0);
  assert.deepEqual(testHarness.writes, []);
  assert.match(testHarness.redirects[0] ?? '', /error=1/);
});

for (const { sourceType, diagnostic } of [
  { sourceType: '', diagnostic: 'empty source type' },
  { sourceType: 'NOT_A_SOURCE_TYPE', diagnostic: 'invalid source type' },
]) {
  test(`VERIFIED with ${diagnostic} rejects before transaction with zero writes`, async () => {
    const value = row();
    const testHarness = harness([value]);

    await redirecting(
      testHarness.action,
      form({
        [`value__${value.rowKey}`]: '48.5',
        [`sourceUrl__${value.rowKey}`]: 'https://manufacturer.example/specs',
        [`sourceType__${value.rowKey}`]: sourceType,
        [`confidence__${value.rowKey}`]: 'VERIFIED',
      })
    );

    assert.equal(testHarness.getTransactions(), 0);
    assert.deepEqual(testHarness.writes, []);
    assert.match(testHarness.redirects[0] ?? '', /error=1/);
  });
}

test('VERIFIED with a valid absolute URL and source type persists verified timestamp', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '48.5',
      [`sourceUrl__${value.rowKey}`]: 'https://manufacturer.example/specs',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'VERIFIED',
    })
  );

  const create = testHarness.writes.find((entry) => entry.operation === 'create');
  assert.ok(create);
  const data = (create.args as {
    data: { verified_at: Date; source_url: string; source_type: SourceType; confidence: Confidence };
  }).data;
  assert.equal(data.verified_at, fixedNow);
  assert.equal(data.source_url, 'https://manufacturer.example/specs');
  assert.equal(data.source_type, 'MANUFACTURER');
  assert.equal(data.confidence, 'VERIFIED');
});

test('LIKELY and UNVERIFIED accept empty source fields without VERIFIED source policy', async () => {
  for (const confidence of ['LIKELY', 'UNVERIFIED'] satisfies Confidence[]) {
    const value = row();
    const testHarness = harness([value]);

    await redirecting(
      testHarness.action,
      form({
        [`value__${value.rowKey}`]: '48.5',
        [`sourceUrl__${value.rowKey}`]: '',
        [`sourceType__${value.rowKey}`]: '',
        [`confidence__${value.rowKey}`]: confidence,
      })
    );

    const create = testHarness.writes.find((entry) => entry.operation === 'create');
    assert.ok(create, `confidence=${confidence}`);
    const data = (create.args as {
      data: { verified_at: Date | null; source_url: string | null; source_type: SourceType | null; confidence: Confidence };
    }).data;
    assert.equal(data.verified_at, null);
    assert.equal(data.source_url, null);
    assert.equal(data.source_type, null);
    assert.equal(data.confidence, confidence);
  }
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

test('an earlier valid row plus a later invalid row prevents every transaction write', async () => {
  const validRow = row();
  const invalidRow = row({
    rowKey: 'cm33333333333333333333__p',
    attributeDefinitionId: 'cm33333333333333333333',
    label: 'Minimum Height',
  });
  const validationErrorsByRow = {
    [validRow.attributeDefinitionId]: [],
    [invalidRow.attributeDefinitionId]: ['scope mismatch'],
  };
  const testHarness = harness([validRow, invalidRow], validationErrorsByRow);

  await redirecting(
    testHarness.action,
    form({
      [`value__${validRow.rowKey}`]: '48.5',
      [`value__${invalidRow.rowKey}`]: '24.5',
    })
  );

  assert.equal(testHarness.getValidations(), 2);
  assert.deepEqual(testHarness.validatedDefinitionIds, [
    validRow.attributeDefinitionId,
    invalidRow.attributeDefinitionId,
  ]);
  assert.equal(testHarness.getTransactions(), 0);
  assert.deepEqual(testHarness.writes, []);
  assert.match(testHarness.redirects[0] ?? '', /error=1/);
});

test('validation failure saves only row-keyed draft strings and appends its opaque token', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(
    testHarness.action,
    form({
      [`value__${value.rowKey}`]: '48.5',
      [`sourceUrl__${value.rowKey}`]: 'not a url',
      [`sourceType__${value.rowKey}`]: 'MANUFACTURER',
      [`confidence__${value.rowKey}`]: 'VERIFIED',
    })
  );

  assert.deepEqual(testHarness.savedDrafts, [
    {
      productId,
      rows: {
        [value.rowKey]: {
          value: '48.5',
          sourceUrl: 'not a url',
          sourceType: 'MANUFACTURER',
          confidence: 'VERIFIED',
        },
      },
    },
  ]);
  const redirectUrl = new URL(testHarness.redirects[0] ?? '', 'https://deskholt.test');
  assert.equal(redirectUrl.pathname, `/admin/products/${productId}/specifications`);
  assert.deepEqual([...redirectUrl.searchParams.entries()], [
    ['error', '1'],
    ['count', '1'],
    ['detail', 'Maximum Height: VERIFIED requires a valid source URL and source type.'],
    ['draft', 'opaque_test_token'],
  ]);
  assert.doesNotMatch(redirectUrl.search, /48\.5|not(?:%20|\+)a(?:%20|\+)url|manufacturer|value__|sourceUrl__|sourceType__|confidence__|rows|data|payload/i);
  assert.deepEqual(testHarness.clearedDraftProducts, []);
});

test('successful save creates no draft and clears every prior draft for the Product', async () => {
  const value = row();
  const testHarness = harness([value]);

  await redirecting(testHarness.action, form({ [`value__${value.rowKey}`]: '48.5' }));

  assert.deepEqual(testHarness.savedDrafts, []);
  assert.deepEqual(testHarness.clearedDraftProducts, [productId]);
  assert.deepEqual(testHarness.redirects, [`/admin/products/${productId}/specifications?saved=1`]);
});
