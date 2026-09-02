import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEditProductAction,
  type ProductEditActionDependencies,
} from '../src/app/(admin)/admin/products/[id]/edit/actions.ts';

const productId = 'cm12345678901234567890';

function form(entries: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function validForm(overrides: Record<string, string> = {}) {
  return form({
    name: 'Updated Desk',
    slug: 'updated-desk',
    slugEditable: '1',
    brandName: 'Deskholt',
    description: 'An updated desk description.',
    imageUrl: 'https://images.example.test/desk.jpg',
    upcCode: '123456',
    isSustainable: 'on',
    ...overrides,
  });
}

function actionHarness(overrides: Partial<ProductEditActionDependencies> = {}) {
  const calls: string[] = [];
  const redirects: string[] = [];
  const dependencies: ProductEditActionDependencies = {
    requireAdmin: async () => { calls.push('auth'); },
    store: {
      findProductForEdit: async () => ({ id: productId, slug: 'old-desk', status: 'DRAFT' }),
      slugExists: async () => false,
      upsertBrand: async () => ({ id: 'brand-1' }),
      updateProduct: async () => { calls.push('update'); },
    },
    revalidatePath: (path) => { calls.push(`revalidate:${path}`); },
    redirect: (path) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
    ...overrides,
  };
  return { action: createEditProductAction(dependencies, productId), calls, redirects };
}

// Break caught: omitting the public or list cache invalidation leaves stale catalog data after a successful edit.
test('edit action authenticates, saves, revalidates public then products paths, and redirects to saved state', async () => {
  const harness = actionHarness();

  await assert.rejects(() => harness.action(validForm()), /NEXT_REDIRECT/);

  assert.deepEqual(harness.calls, ['auth', 'update', 'revalidate:/', 'revalidate:/admin/products']);
  assert.deepEqual(harness.redirects, [`/admin/products/${productId}/edit?saved=1`]);
});

// Break caught: parsing before authorization lets an unauthenticated forged request reveal validation behavior.
test('edit action authenticates before parsing or calling the store', async () => {
  const harness = actionHarness({
    requireAdmin: async () => { throw new Error('UNAUTHORIZED'); },
  });

  await assert.rejects(() => harness.action(form()), /UNAUTHORIZED/);

  assert.deepEqual(harness.calls, []);
  assert.deepEqual(harness.redirects, []);
});

// Break caught: a rejected edit must return to the same editor with its actionable reason and no cache invalidation.
test('edit action redirects rejected command results without invalidating', async () => {
  const harness = actionHarness({
    store: {
      findProductForEdit: async () => null,
      slugExists: async () => false,
      upsertBrand: async () => ({ id: 'brand-1' }),
      updateProduct: async () => undefined,
    },
  });

  await assert.rejects(() => harness.action(validForm()), /NEXT_REDIRECT/);

  assert.deepEqual(harness.calls, ['auth']);
  assert.deepEqual(harness.redirects, [`/admin/products/${productId}/edit?error=not-found`]);
});
