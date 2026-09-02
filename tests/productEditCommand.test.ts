import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createPrismaProductEditStore,
  executeEditProduct,
  parseEditProductInput,
  type EditProductData,
  type EditProductInput,
  type ProductEditStore,
} from '../src/lib/products/productEditCommand.ts';

type ProductForEdit = { id: string; slug: string; status: 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'ARCHIVED' };

function form(entries: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function validForm(overrides: Record<string, string> = {}) {
  return form({
    name: '  ErGear Test Desk  ',
    slug: 'ergear-test-desk-v2',
    slugEditable: '1',
    brandName: '  ErGear  ',
    description: '  An updated test standing desk.  ',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: '  123456789012  ',
    isSustainable: 'on',
    ...overrides,
  });
}

function input(overrides: Partial<EditProductInput> = {}): EditProductInput {
  return {
    name: 'ErGear Test Desk',
    slug: undefined,
    brandName: 'ErGear',
    description: 'An updated test standing desk.',
    imageUrl: 'https://images.example.test/ergear-desk.jpg',
    upcCode: '123456789012',
    isSustainable: true,
    ...overrides,
  };
}

function recordingStore({
  product = { id: 'product-1', slug: 'ergear-test-desk', status: 'DRAFT' },
  slugTaken = false,
  brand = { id: 'brand-1' },
  updateError,
}: {
  product?: ProductForEdit | null;
  slugTaken?: boolean;
  brand?: { id: string };
  updateError?: unknown;
} = {}) {
  const calls: Array<{ operation: string; value?: unknown }> = [];
  const updates: Array<{ id: string; data: EditProductData }> = [];
  const store: ProductEditStore = {
    findProductForEdit: async (id) => {
      calls.push({ operation: 'findProductForEdit', value: id });
      return product;
    },
    slugExists: async (slug, excludeProductId) => {
      calls.push({ operation: 'slugExists', value: { slug, excludeProductId } });
      return slugTaken;
    },
    upsertBrand: async (name) => {
      calls.push({ operation: 'upsertBrand', value: name });
      return brand;
    },
    updateProduct: async (id, data) => {
      calls.push({ operation: 'updateProduct', value: { id, data } });
      if (updateError !== undefined) throw updateError;
      updates.push({ id, data });
    },
  };
  return { store, calls, updates };
}

// Break caught: sending a slug without the page's DRAFT-only marker must not let a stale or forged field change identity.
test('parseEditProductInput reads slug only when slugEditable is 1', () => {
  assert.deepEqual(parseEditProductInput(validForm({ slugEditable: '0' })), input());
  assert.deepEqual(parseEditProductInput(validForm()), input({ slug: 'ergear-test-desk-v2' }));
});

// Break caught: accepting empty core fields or a non-absolute image URL persists invalid Product data.
test('parseEditProductInput rejects blank name, blank description, and invalid image URL', () => {
  assert.throws(() => parseEditProductInput(validForm({ name: '  ' })), /name is required/i);
  assert.throws(() => parseEditProductInput(validForm({ description: '  ' })), /description is required/i);
  assert.throws(() => parseEditProductInput(validForm({ imageUrl: '/images/desk.jpg' })), /invalid image url/i);
});

// Break caught: a malformed DRAFT slug must not bypass the existing Product URL contract.
test('parseEditProductInput rejects a malformed editable slug', () => {
  assert.throws(() => parseEditProductInput(validForm({ slug: 'ErGear desk' })), /invalid slug/i);
});

// Break caught: core-field edits must not mutate category or slug when slug editing was not enabled.
test('executeEditProduct updates core fields without slug or category', async () => {
  const harness = recordingStore();

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input()), { ok: true });
  assert.deepEqual(harness.updates, [{
    id: 'product-1',
    data: {
      name: 'ErGear Test Desk',
      brand_id: 'brand-1',
      description: 'An updated test standing desk.',
      image_url: 'https://images.example.test/ergear-desk.jpg',
      upc_code: '123456789012',
      is_sustainable: true,
    },
  }]);
});

// Break caught: DRAFT Products must be able to change their canonical URL before publication.
test('executeEditProduct changes a DRAFT slug after excluding the current Product from collision detection', async () => {
  const harness = recordingStore();

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ slug: 'ergear-test-desk-v2' })), { ok: true });
  assert.deepEqual(harness.calls.find((call) => call.operation === 'slugExists'), {
    operation: 'slugExists',
    value: { slug: 'ergear-test-desk-v2', excludeProductId: 'product-1' },
  });
  assert.equal(harness.updates[0]?.data.slug, 'ergear-test-desk-v2');
});

// Break caught: a forged ACTIVE slug request must not issue any write, even if the page disabled the input.
test('executeEditProduct returns slug-locked with zero updates for a forged ACTIVE slug change', async () => {
  const harness = recordingStore({ product: { id: 'product-1', slug: 'ergear-test-desk', status: 'ACTIVE' } });

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ slug: 'ergear-test-desk-v2' })), {
    ok: false,
    reason: 'slug-locked',
  });
  assert.deepEqual(harness.updates, []);
  assert.doesNotMatch(JSON.stringify(harness.calls), /slugExists|upsertBrand|updateProduct/);
});

// Break caught: a slug belonging to another Product must be rejected before editing any field.
test('executeEditProduct returns slug-taken without updating when a new DRAFT slug is occupied', async () => {
  const harness = recordingStore({ slugTaken: true });

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ slug: 'occupied-desk' })), {
    ok: false,
    reason: 'slug-taken',
  });
  assert.deepEqual(harness.updates, []);
});

// Break caught: retaining the current slug must not query a collision that would find the Product itself.
test('executeEditProduct does not treat the current slug as a collision', async () => {
  const harness = recordingStore({ slugTaken: true });

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ slug: 'ergear-test-desk' })), { ok: true });
  assert.doesNotMatch(JSON.stringify(harness.calls), /slugExists/);
  assert.equal(harness.updates[0]?.data.slug, undefined);
});

// Break caught: editing a deleted Product must not create a Brand or issue an update.
test('executeEditProduct returns not-found before side effects for a missing Product', async () => {
  const harness = recordingStore({ product: null });

  assert.deepEqual(await executeEditProduct(harness.store, 'missing-product', input()), { ok: false, reason: 'not-found' });
  assert.deepEqual(harness.updates, []);
  assert.doesNotMatch(JSON.stringify(harness.calls), /slugExists|upsertBrand|updateProduct/);
});

// Break caught: empty optional Brand and UPC inputs must clear their relationships rather than persist blanks.
test('executeEditProduct skips Brand upsert and writes null optional fields when absent', async () => {
  const harness = recordingStore();

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ brandName: undefined, upcCode: undefined })), { ok: true });
  assert.doesNotMatch(JSON.stringify(harness.calls), /upsertBrand/);
  assert.equal(harness.updates[0]?.data.brand_id, null);
  assert.equal(harness.updates[0]?.data.upc_code, null);
});

// Break caught: a concurrent unique conflict during update needs the same actionable form error as a preflight collision.
test('executeEditProduct maps a P2002 update conflict to slug-taken', async () => {
  const harness = recordingStore({ updateError: { code: 'P2002' } });

  assert.deepEqual(await executeEditProduct(harness.store, 'product-1', input({ slug: 'ergear-test-desk-v2' })), {
    ok: false,
    reason: 'slug-taken',
  });
  assert.deepEqual(harness.updates, []);
});

// Break caught: Prisma collision lookup must exclude the edited Product and its update must leave category untouched.
test('Prisma edit store excludes the current Product from slug lookup and updates only editable fields', async () => {
  let countArgs: unknown;
  let updateArgs: unknown;
  const store = createPrismaProductEditStore({
    product: {
      count: async (args: unknown) => {
        countArgs = args;
        return 0;
      },
      update: async (args: unknown) => {
        updateArgs = args;
      },
    },
    brand: {},
  } as never);

  assert.equal(await store.slugExists('ergear-test-desk-v2', 'product-1'), false);
  await store.updateProduct('product-1', {
    name: 'ErGear Test Desk',
    slug: 'ergear-test-desk-v2',
    brand_id: 'brand-1',
    description: 'An updated test standing desk.',
    image_url: 'https://images.example.test/ergear-desk.jpg',
    upc_code: '123456789012',
    is_sustainable: true,
  });

  assert.deepEqual(countArgs, { where: { slug: 'ergear-test-desk-v2', id: { not: 'product-1' } } });
  assert.deepEqual(updateArgs, {
    where: { id: 'product-1' },
    data: {
      name: 'ErGear Test Desk',
      slug: 'ergear-test-desk-v2',
      brand_id: 'brand-1',
      description: 'An updated test standing desk.',
      image_url: 'https://images.example.test/ergear-desk.jpg',
      upc_code: '123456789012',
      is_sustainable: true,
    },
  });
});
