import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import {
  createPrismaProductCreationStore,
  executeCreateProduct,
  parseCreateProductInput,
  type CreateProductData,
} from '../src/lib/products/productCreationCommand.ts';
import type { ProductCreationActionDependencies } from '../src/app/(admin)/admin/products/actions.ts';
import {
  createPrismaPublishingStore,
  executePublishingCommand,
  parsePublishingCommand,
} from '../src/lib/products/productPublishingCommands.ts';

type CreateProductAction = (formData: FormData) => Promise<void>;

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports?: Record<string, unknown>; defaultExport?: unknown }
  ): { restore(): void };
};

const mocks = [
  moduleMock.module('next/headers', { namedExports: { cookies: async () => ({ get: () => undefined }) } }),
  moduleMock.module('next/navigation', { namedExports: { redirect: () => { throw new Error('NEXT_REDIRECT:default'); } } }),
  moduleMock.module('next/cache', { namedExports: { revalidatePath: () => undefined } }),
  moduleMock.module('@/lib/prisma', { namedExports: { prisma: {} } }),
  moduleMock.module('@/lib/admin/auth', { namedExports: { ADMIN_SESSION_COOKIE: 'admin-session', isValidSessionToken: async () => false } }),
  moduleMock.module('@/lib/products/productCreationCommand', {
    namedExports: { createPrismaProductCreationStore, executeCreateProduct, parseCreateProductInput },
  }),
  moduleMock.module('@/lib/products/productPublishingCommands', {
    namedExports: { createPrismaPublishingStore, executePublishingCommand, parsePublishingCommand },
  }),
];

let createCreateProductAction: ((dependencies: ProductCreationActionDependencies) => CreateProductAction) | undefined;

test.before(async () => {
  const actions = await import('../src/app/(admin)/admin/products/actions.ts');
  createCreateProductAction = (actions as unknown as {
    createCreateProductAction?: typeof createCreateProductAction;
  }).createCreateProductAction;
});

test.after(() => {
  for (const moduleMock of mocks) moduleMock.restore();
});

function actionFactory() {
  if (!createCreateProductAction) throw new Error('createCreateProductAction must be exported');
  return createCreateProductAction;
}

function form(entries: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function validForm(overrides: Record<string, string> = {}) {
  return form({
    name: 'Test Desk',
    slug: 'test-desk',
    categorySlug: 'standing-desks',
    brandName: 'Test Brand',
    description: 'A test desk.',
    imageUrl: 'https://images.example.test/test-desk.jpg',
    upcCode: '123456789012',
    isSustainable: 'on',
    ...overrides,
  });
}

function harness({
  category = { id: 'category-1' },
  slugTaken = false,
}: {
  category?: { id: string } | null;
  slugTaken?: boolean;
} = {}) {
  const writes: CreateProductData[] = [];
  const invalidations: string[] = [];
  const redirects: string[] = [];
  const dependencies: ProductCreationActionDependencies = {
    requireAdmin: async () => undefined,
    creationStore: {
      slugExists: async () => slugTaken,
      findCategoryBySlug: async () => category,
      upsertBrand: async () => ({ id: 'brand-1' }),
      createProduct: async (data) => {
        writes.push(data);
        return { id: 'product-1' };
      },
    },
    revalidatePath: (path) => invalidations.push(path),
    redirect: (path) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  };

  return { action: actionFactory()(dependencies), writes, invalidations, redirects, dependencies };
}

async function captureRedirect(action: CreateProductAction, data: FormData) {
  await assert.rejects(() => action(data), /NEXT_REDIRECT:/);
}

// Break caught: an unauthenticated caller must never get as far as creating a Product.
test('createCreateProductAction rejects an unauthenticated request before mutation', async () => {
  const testHarness = harness();
  testHarness.dependencies.requireAdmin = async () => { throw new Error('UNAUTHENTICATED'); };
  const action = actionFactory()(testHarness.dependencies);

  await assert.rejects(() => action(validForm()), /UNAUTHENTICATED/);
  assert.deepEqual(testHarness.writes, []);
  assert.deepEqual(testHarness.invalidations, []);
  assert.deepEqual(testHarness.redirects, []);
});

// Break caught: a successful create must take the editor directly into the existing specifications workflow and refresh the list.
test('createCreateProductAction revalidates the product list and redirects to specifications after creation', async () => {
  const testHarness = harness();

  await captureRedirect(testHarness.action, validForm());

  assert.equal(testHarness.writes.length, 1);
  assert.deepEqual(testHarness.invalidations, ['/admin/products']);
  assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/specifications?created=1']);
});

// Break caught: invalid input, duplicate slugs, and missing Categories must return the editor to the new-product form with the stable reason.
test('createCreateProductAction redirects every rejected creation back to the new-product form', async () => {
  const invalid = harness();
  await captureRedirect(invalid.action, validForm({ slug: 'Invalid Slug' }));
  assert.deepEqual(invalid.redirects, ['/admin/products/new?error=invalid-input']);
  assert.deepEqual(invalid.invalidations, []);

  const missingCategory = harness({ category: null });
  await captureRedirect(missingCategory.action, validForm());
  assert.deepEqual(missingCategory.redirects, ['/admin/products/new?error=category-missing']);
  assert.deepEqual(missingCategory.invalidations, []);

  const duplicateSlug = harness({ slugTaken: true });
  await captureRedirect(duplicateSlug.action, validForm());
  assert.deepEqual(duplicateSlug.redirects, ['/admin/products/new?error=slug-taken']);
  assert.deepEqual(duplicateSlug.invalidations, []);
});
