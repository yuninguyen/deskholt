import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPrismaProductCreationStore,
  executeCreateProduct,
  parseCreateProductInput,
  type CreateProductData,
  type CreateProductInput,
  type ProductCreationStore,
} from '../src/lib/products/productCreationCommand.ts';

type CreatedProduct = CreateProductData;

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function parse(formData: FormData): CreateProductInput {
  return parseCreateProductInput(formData);
}

function validForm(overrides: Record<string, string> = {}) {
  return form({
    name: '  ErGear Test Desk  ',
    slug: 'ergear-test-desk',
    categorySlug: 'standing-desks',
    brandName: '  ErGear  ',
    description: '  A test standing desk.  ',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: '  123456789012  ',
    isSustainable: 'on',
    ...overrides,
  });
}

// Break caught: removing input trimming or changing the form-field contract loses the normalized Product identity.
test('parseCreateProductInput returns the normalized complete Product identity', () => {
  assert.deepEqual(parse(validForm()), {
    name: 'ErGear Test Desk',
    slug: 'ergear-test-desk',
    categorySlug: 'standing-desks',
    brandName: 'ErGear',
    description: 'A test standing desk.',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: '123456789012',
    isSustainable: true,
  });
});

// Break caught: accepting a missing identity field would let a database-invalid or incomplete Product be created.
test('parseCreateProductInput rejects every missing required identity field', () => {
  for (const field of ['name', 'slug', 'categorySlug', 'description', 'imageUrl']) {
    const data = validForm();
    data.delete(field);
    assert.throws(() => parse(data), new RegExp(`${field} is required`, 'i'));
  }
});

// Break caught: permissive slug parsing creates URLs that do not conform to the existing Product slug contract.
test('parseCreateProductInput rejects malformed slugs without auto-normalizing', () => {
  for (const slug of ['ErGear-desk', 'ergear desk', 'ergear_desk', 'ergear/desk']) {
    assert.throws(() => parse(validForm({ slug })), /invalid slug/i);
  }
});

// Break caught: accepting relative or unparseable image locations violates Product.image_url requirements.
test('parseCreateProductInput rejects non-absolute image URLs', () => {
  for (const imageUrl of ['not a url', '/images/desk.jpg', 'images/desk.jpg']) {
    assert.throws(() => parse(validForm({ imageUrl })), /invalid image url/i);
  }
});

// Break caught: persisting optional blanks as empty strings makes absent Brand and UPC data indistinguishable from supplied data.
test('parseCreateProductInput treats blank optional values as absent and an unchecked checkbox as false', () => {
  const data = validForm({ brandName: '   ', upcCode: '   ' });
  data.delete('isSustainable');

  assert.deepEqual(parse(data), {
    name: 'ErGear Test Desk',
    slug: 'ergear-test-desk',
    categorySlug: 'standing-desks',
    brandName: undefined,
    description: 'A test standing desk.',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: undefined,
    isSustainable: false,
  });
});

function input(overrides: Partial<CreateProductInput> = {}): CreateProductInput {
  return {
    name: 'ErGear Test Desk',
    slug: 'ergear-test-desk',
    categorySlug: 'standing-desks',
    brandName: 'ErGear',
    description: 'A test standing desk.',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: '123456789012',
    isSustainable: true,
    ...overrides,
  };
}

function recordingStore({
  category = { id: 'category-1' },
  slugTaken = false,
  brand = { id: 'brand-1' },
  createError,
}: {
  category?: { id: string } | null;
  slugTaken?: boolean;
  brand?: { id: string };
  createError?: unknown;
} = {}) {
  const calls: Array<{ operation: string; value?: unknown }> = [];
  const created: CreatedProduct[] = [];
  const store: ProductCreationStore = {
    slugExists: async (slug) => {
      calls.push({ operation: 'slugExists', value: slug });
      return slugTaken;
    },
    findCategoryBySlug: async (slug) => {
      calls.push({ operation: 'findCategoryBySlug', value: slug });
      return category;
    },
    upsertBrand: async (name) => {
      calls.push({ operation: 'upsertBrand', value: name });
      return brand;
    },
    createProduct: async (data) => {
      calls.push({ operation: 'createProduct', value: data });
      if (createError !== undefined) throw createError;
      created.push(data);
      return { id: 'product-1' };
    },
  };
  return { store, calls, created };
}

async function execute(store: ProductCreationStore, productInput: CreateProductInput) {
  return executeCreateProduct(store, productInput);
}

// Break caught: a successful identity creation that omits draft/index/category dual-write fields cannot continue safely into specifications.
test('executeCreateProduct creates a draft Product with both category references and returns its id', async () => {
  const harness = recordingStore();

  assert.deepEqual(await execute(harness.store, input()), { ok: true, productId: 'product-1' });
  assert.deepEqual(harness.created, [{
    name: 'ErGear Test Desk',
    slug: 'ergear-test-desk',
    category: 'standing-desks',
    category_id: 'category-1',
    brand_id: 'brand-1',
    description: 'A test standing desk.',
    image_url: 'https://images.example.test/ergear-desk.jpg',
    upc_code: '123456789012',
    status: 'DRAFT',
    is_indexed: false,
    is_sustainable: true,
  }]);
});

// Break caught: an absent Category must be rejected rather than silently created or writing an orphan Product.
test('executeCreateProduct rejects a missing category without creating a Product', async () => {
  const harness = recordingStore({ category: null });

  assert.deepEqual(await execute(harness.store, input()), { ok: false, reason: 'category-missing' });
  assert.deepEqual(harness.created, []);
  assert.doesNotMatch(JSON.stringify(harness.calls), /createProduct/);
});

// Break caught: accepting an existing slug would violate the unique Product URL contract.
test('executeCreateProduct rejects a taken slug without creating a Product', async () => {
  const harness = recordingStore({ slugTaken: true });

  assert.deepEqual(await execute(harness.store, input()), { ok: false, reason: 'slug-taken' });
  assert.deepEqual(harness.created, []);
  assert.doesNotMatch(JSON.stringify(harness.calls), /createProduct/);
});

// Break caught: an omitted Brand should not cause an upsert or an accidental placeholder Brand row.
test('executeCreateProduct skips Brand upsert when no Brand name was supplied', async () => {
  const harness = recordingStore();

  assert.deepEqual(await execute(harness.store, input({ brandName: undefined, upcCode: undefined })), {
    ok: true,
    productId: 'product-1',
  });
  assert.doesNotMatch(JSON.stringify(harness.calls), /upsertBrand/);
  assert.equal(harness.created[0]?.brand_id, null);
  assert.equal(harness.created[0]?.upc_code, null);
});

// Break caught: a concurrent Product create with the same unique slug must be reported as a retryable form error.
test('executeCreateProduct maps a Product unique-constraint conflict to slug-taken', async () => {
  const harness = recordingStore({ createError: { code: 'P2002' } });

  assert.deepEqual(await execute(harness.store, input()), { ok: false, reason: 'slug-taken' });
  assert.deepEqual(harness.created, []);
});

// Break caught: a differently formatted Brand name must not overwrite a pre-existing Brand that shares a lossy slug.
test('Prisma creation store returns an exact-name Brand without updating it', async () => {
  let findFirstArgs: unknown;
  let upserts = 0;
  const store = createPrismaProductCreationStore({
    product: {},
    category: {},
    brand: {
      findFirst: async (args: unknown) => {
        findFirstArgs = args;
        return { id: 'brand-existing' };
      },
      upsert: async () => {
        upserts += 1;
        return { id: 'brand-new' };
      },
    },
  } as never);

  assert.deepEqual(await store.upsertBrand('Acme!'), { id: 'brand-existing' });
  assert.deepEqual(findFirstArgs, { where: { name: 'Acme!' }, select: { id: true } });
  assert.equal(upserts, 0);
});

// Break caught: punctuation-only Brand names must still receive a non-empty, stable database identity.
test('Prisma creation store creates a non-empty lossless slug for punctuation-only Brand names', async () => {
  let upsertArgs: unknown;
  const store = createPrismaProductCreationStore({
    product: {},
    category: {},
    brand: {
      findFirst: async () => null,
      upsert: async (args: unknown) => {
        upsertArgs = args;
        return { id: 'brand-punctuation' };
      },
    },
  } as never);

  assert.deepEqual(await store.upsertBrand('!!!'), { id: 'brand-punctuation' });
  assert.deepEqual(upsertArgs, {
    where: { slug: 'brand-x-x-x' },
    update: {},
    create: { slug: 'brand-x-x-x', name: '!!!' },
    select: { id: true },
  });
});
