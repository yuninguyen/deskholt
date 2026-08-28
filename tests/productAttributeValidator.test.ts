import test from 'node:test';
import assert from 'node:assert/strict';
import type { PrismaClient, AttributeDataType, AttributeScope } from '@prisma/client';
import {
  validateProductAttributeInput,
  type ProductAttributeInput,
} from '../src/lib/products/productAttributeValidator';

type Fixture = {
  definition: null | {
    id: string;
    key: string;
    scope: AttributeScope;
    data_type: AttributeDataType;
    allowed_values: unknown;
  };
  product: null | { id: string; category: string; category_id: string | null; category_ref: { id: string; name: string } | null };
  category: null | { id: string; name: string };
  categoryAttribute: null | { id: string };
  variant: null | { id: string; product_id: string };
};

const productId = 'cm12345678901234567890';
const definitionId = 'cm22345678901234567890';
const variantId = 'cm32345678901234567890';

function makeFixture(overrides: Partial<Fixture> = {}): Fixture {
  return {
    definition: {
      id: definitionId,
      key: 'desktop_width_in',
      scope: 'PRODUCT',
      data_type: 'DECIMAL',
      allowed_values: null,
    },
    product: { id: productId, category: 'standing-desks', category_id: null, category_ref: null },
    category: { id: 'cm42345678901234567890', name: 'Standing Desks' },
    categoryAttribute: { id: 'cm52345678901234567890' },
    variant: { id: variantId, product_id: productId },
    ...overrides,
  };
}

function fakePrisma(fixture: Fixture): PrismaClient {
  return {
    attributeDefinition: {
      findUnique: async () => fixture.definition,
    },
    product: {
      findUnique: async () => fixture.product,
    },
    category: {
      findUnique: async () => fixture.category,
    },
    categoryAttribute: {
      findUnique: async () => fixture.categoryAttribute,
    },
    productVariant: {
      findUnique: async () => fixture.variant,
    },
  } as unknown as PrismaClient;
}

function input(overrides: Partial<ProductAttributeInput> = {}): ProductAttributeInput {
  return {
    productId,
    attributeDefinitionId: definitionId,
    valueNumber: 48.5,
    ...overrides,
  };
}

async function validate(fixture: Fixture, overrides: Partial<ProductAttributeInput> = {}) {
  return validateProductAttributeInput(fakePrisma(fixture), input(overrides));
}

test('validator uses the product category relation without a slug lookup', async () => {
  let categoryLookups = 0;
  let productArgs: unknown;
  const fixture = makeFixture({
    product: { id: productId, category: 'legacy-slug', category_id: 'cm42345678901234567890', category_ref: { id: 'cm42345678901234567890', name: 'Standing Desks' } },
  });
  const prisma = fakePrisma(fixture);
  (prisma.product.findUnique as unknown as (args: unknown) => Promise<unknown>) = async (args) => {
    productArgs = args;
    return fixture.product;
  };
  (prisma.category.findUnique as unknown as () => Promise<unknown>) = async () => {
    categoryLookups += 1;
    return fixture.category;
  };
  const result = await validateProductAttributeInput(prisma, input());
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(categoryLookups, 0);
  assert.match(JSON.stringify(productArgs), /category_id/);
  assert.match(JSON.stringify(productArgs), /category_ref/);
});

test('validator preserves relation integrity when a non-null category relation is missing', async () => {
  let categoryLookups = 0;
  const fixture = makeFixture({
    product: { id: productId, category: 'legacy-slug', category_id: 'cm42345678901234567890', category_ref: null },
  });
  const prisma = fakePrisma(fixture);
  (prisma.category.findUnique as unknown as () => Promise<unknown>) = async () => {
    categoryLookups += 1;
    return fixture.category;
  };
  const result = await validateProductAttributeInput(prisma, input());
  assert.deepEqual(result, {
    valid: false,
    errors: ['Category "legacy-slug" chưa được khai báo trong Attribute Engine.'],
  });
  assert.equal(categoryLookups, 0);
});

test('validator preserves legacy success semantics with exactly one slug lookup', async () => {
  let categoryLookups = 0;
  let categoryArgs: unknown;
  const fixture = makeFixture();
  const prisma = fakePrisma(fixture);
  (prisma.category.findUnique as unknown as (args: unknown) => Promise<unknown>) = async (args) => {
    categoryLookups += 1;
    categoryArgs = args;
    return fixture.category;
  };
  const result = await validateProductAttributeInput(prisma, input());
  assert.deepEqual(result, { valid: true, errors: [] });
  assert.equal(categoryLookups, 1);
  assert.deepEqual(categoryArgs, {
    where: { slug: 'standing-desks' },
    select: { id: true, name: true },
  });
});

test('validator preserves legacy error semantics with exactly one slug lookup', async () => {
  let categoryLookups = 0;
  const fixture = makeFixture({ category: null });
  const prisma = fakePrisma(fixture);
  (prisma.category.findUnique as unknown as () => Promise<unknown>) = async () => {
    categoryLookups += 1;
    return null;
  };
  const result = await validateProductAttributeInput(prisma, input());
  assert.deepEqual(result, {
    valid: false,
    errors: ['Category "standing-desks" chưa được khai báo trong Attribute Engine.'],
  });
  assert.equal(categoryLookups, 1);
});

test('validator rejects an unknown attribute definition', async () => {
  const result = await validate(makeFixture({ definition: null }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /attributeDefinitionId=.*không tồn tại/i);
});

test('validator rejects an attribute outside the Product category schema', async () => {
  const result = await validate(makeFixture({ categoryAttribute: null }));
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /không thuộc schema của category/i);
});

test('validator enforces PRODUCT and VARIANT scope combinations', async () => {
  const productResult = await validate(makeFixture(), { variantId });
  assert.equal(productResult.valid, false);
  assert.match(productResult.errors.join(' '), /scope=PRODUCT/i);

  const variantResult = await validate(
    makeFixture({
      definition: {
        id: definitionId,
        key: 'desktop_width_in',
        scope: 'VARIANT',
        data_type: 'DECIMAL',
        allowed_values: null,
      },
    }),
    { variantId: null }
  );
  assert.equal(variantResult.valid, false);
  assert.match(variantResult.errors.join(' '), /scope=VARIANT.*variantId/i);
});

test('validator allows DERIVED values at Product and owned Variant scope', async () => {
  const fixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'stability_rating',
      scope: 'DERIVED',
      data_type: 'ENUM',
      allowed_values: ['LOW', 'MEDIUM', 'HIGH'],
    },
  });

  assert.equal((await validate(fixture, { valueNumber: null, valueString: 'HIGH' })).valid, true);
  assert.equal(
    (await validate(fixture, { variantId, valueNumber: null, valueString: 'HIGH' })).valid,
    true
  );
});

test('validator rejects missing and cross-Product Variants', async () => {
  const variantFixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'desktop_width_in',
      scope: 'VARIANT',
      data_type: 'DECIMAL',
      allowed_values: null,
    },
    variant: null,
  });
  const missing = await validate(variantFixture, { variantId });
  assert.equal(missing.valid, false);
  assert.match(missing.errors.join(' '), /variantId=.*không tồn tại/i);

  const crossProduct = await validate(
    makeFixture({
      definition: variantFixture.definition,
      variant: { id: variantId, product_id: 'cm99999999999999999999' },
    }),
    { variantId }
  );
  assert.equal(crossProduct.valid, false);
  assert.match(crossProduct.errors.join(' '), /thuộc productId=.*không phải productId/i);
});

test('validator requires exactly one typed value column', async () => {
  const none = await validate(makeFixture(), { valueNumber: null });
  assert.equal(none.valid, false);
  assert.match(none.errors.join(' '), /Chưa có giá trị nào/i);

  const multiple = await validate(makeFixture(), { valueString: '48.5' });
  assert.equal(multiple.valid, false);
  assert.match(multiple.errors.join(' '), /đúng 1 trong 3 cột/i);
});

test('validator enforces DECIMAL and INTEGER numeric semantics', async () => {
  const nonFinite = await validate(makeFixture(), { valueNumber: Number.POSITIVE_INFINITY });
  assert.equal(nonFinite.valid, false);
  assert.match(nonFinite.errors.join(' '), /không phải số hữu hạn/i);

  const integerFixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'motor_count',
      scope: 'PRODUCT',
      data_type: 'INTEGER',
      allowed_values: null,
    },
  });
  const fractional = await validate(integerFixture, { valueNumber: 1.5 });
  assert.equal(fractional.valid, false);
  assert.match(fractional.errors.join(' '), /không phải số nguyên/i);
});

test('validator enforces BOOLEAN and STRING value columns', async () => {
  const booleanFixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'anti_collision',
      scope: 'PRODUCT',
      data_type: 'BOOLEAN',
      allowed_values: null,
    },
  });
  const wrongBooleanColumn = await validate(booleanFixture, {
    valueNumber: null,
    valueString: 'true',
  });
  assert.equal(wrongBooleanColumn.valid, false);
  assert.match(wrongBooleanColumn.errors.join(' '), /dataType=BOOLEAN.*valueBoolean trống/i);

  const stringFixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'desktop_finish',
      scope: 'PRODUCT',
      data_type: 'STRING',
      allowed_values: null,
    },
  });
  const blankString = await validate(stringFixture, { valueNumber: null, valueString: '   ' });
  assert.equal(blankString.valid, false);
  assert.match(blankString.errors.join(' '), /dataType=STRING.*valueString trống/i);
});

test('validator accepts only configured ENUM values', async () => {
  const fixture = makeFixture({
    definition: {
      id: definitionId,
      key: 'adjustment_type',
      scope: 'PRODUCT',
      data_type: 'ENUM',
      allowed_values: ['ELECTRIC', 'MANUAL_CRANK'],
    },
  });

  const valid = await validate(fixture, { valueNumber: null, valueString: 'ELECTRIC' });
  assert.equal(valid.valid, true);

  const invalid = await validate(fixture, { valueNumber: null, valueString: 'PNEUMATIC' });
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(' '), /không nằm trong allowedValues/i);
});
