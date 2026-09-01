import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import type { AffiliateLinkStore } from '../src/lib/products/affiliateLinkCommand.ts';

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
  moduleMock.module('@/lib/admin/auth', {
    namedExports: { ADMIN_SESSION_COOKIE: 'admin-session', isValidSessionToken: async () => false },
  }),
];

type AffiliateLinkAction = (formData: FormData) => Promise<void>;
type AffiliateLinkActionDependencies = {
  requireAdmin(): Promise<void>;
  store: AffiliateLinkStore;
  revalidatePath(path: string): void;
  redirect(path: string): never;
};
type ActionFactory = (dependencies: AffiliateLinkActionDependencies) => AffiliateLinkAction;

let createFactory: ActionFactory | undefined;
let updateFactory: ActionFactory | undefined;

test.before(async () => {
  const actions = await import('../src/app/(admin)/admin/products/[id]/offers/actions.ts');
  createFactory = (actions as unknown as { createCreateAffiliateLinkAction?: ActionFactory }).createCreateAffiliateLinkAction;
  updateFactory = (actions as unknown as { createUpdateAffiliateLinkAction?: ActionFactory }).createUpdateAffiliateLinkAction;
});

test.after(() => {
  for (const moduleMock of mocks) moduleMock.restore();
});

function form(entries: Record<string, string> = {}): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(entries)) data.set(key, value);
  return data;
}

function validForm(overrides: Record<string, string> = {}): FormData {
  return form({
    productId: 'product-1',
    linkId: 'link-1',
    network: 'amazon',
    price: '199.99',
    raw_url: 'https://shop.test/product',
    is_in_stock: 'on',
    priority_order: '2',
    ...overrides,
  });
}

function factory(kind: 'create' | 'update'): ActionFactory {
  const value = kind === 'create' ? createFactory : updateFactory;
  if (!value) throw new Error(`create${kind === 'create' ? 'Create' : 'Update'}AffiliateLinkAction must be exported`);
  return value;
}

function harness({
  existing = true,
  createError,
}: {
  existing?: boolean;
  createError?: Error & { code?: string };
} = {}) {
  const invalidations: string[] = [];
  const redirects: string[] = [];
  let createCalls = 0;
  let findCalls = 0;
  let updateCalls = 0;
  const dependencies: AffiliateLinkActionDependencies = {
    requireAdmin: async () => undefined,
    store: {
      createAffiliateLink: async () => {
        createCalls += 1;
        if (createError) throw createError;
        return { id: 'link-2' };
      },
      findAffiliateLinkForProduct: async () => {
        findCalls += 1;
        return existing ? { id: 'link-1' } : null;
      },
      updateAffiliateLink: async () => {
        updateCalls += 1;
        return { id: 'link-1' };
      },
    },
    revalidatePath: (path) => invalidations.push(path),
    redirect: (path) => {
      redirects.push(path);
      throw new Error(`NEXT_REDIRECT:${path}`);
    },
  };

  return {
    dependencies,
    invalidations,
    redirects,
    calls: () => ({ createCalls, findCalls, updateCalls }),
  };
}

async function captureRedirect(action: AffiliateLinkAction, data: FormData) {
  await assert.rejects(() => action(data), /NEXT_REDIRECT:/);
}

// Break caught: moving authentication after parsing or execution lets unauthenticated requests inspect or mutate offers.
test('offer actions reject unauthenticated requests before parsing or store work', async () => {
  for (const kind of ['create', 'update'] as const) {
    const testHarness = harness();
    testHarness.dependencies.requireAdmin = async () => { throw new Error('UNAUTHENTICATED'); };

    await assert.rejects(() => factory(kind)(testHarness.dependencies)(form()), /UNAUTHENTICATED/);
    assert.deepEqual(testHarness.calls(), { createCalls: 0, findCalls: 0, updateCalls: 0 });
    assert.deepEqual(testHarness.invalidations, []);
    assert.deepEqual(testHarness.redirects, []);
  }
});

// Break caught: malformed offer fields must return the admin to the submitted product's offers form without persistence.
test('offer actions redirect invalid submitted offers to their product route', async () => {
  for (const kind of ['create', 'update'] as const) {
    const testHarness = harness();

    await captureRedirect(factory(kind)(testHarness.dependencies), validForm({ price: '0' }));
    assert.deepEqual(testHarness.calls(), { createCalls: 0, findCalls: 0, updateCalls: 0 });
    assert.deepEqual(testHarness.invalidations, []);
    assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/offers?error=invalid-input']);
  }
});

// Break caught: a malformed form with no safe product identity must not construct an offers route from invalid input.
test('offer actions redirect malformed forms without a safe product id to the products error route', async () => {
  for (const productId of ['', '../x', 'x?foo=bar', 'x#fragment']) {
    const testHarness = harness();

    await captureRedirect(factory('create')(testHarness.dependencies), validForm({ productId, price: '0' }));

    assert.deepEqual(testHarness.calls(), { createCalls: 0, findCalls: 0, updateCalls: 0 });
    assert.deepEqual(testHarness.invalidations, []);
    assert.deepEqual(testHarness.redirects, ['/admin/products?error=invalid-input']);
  }
});

// Break caught: a foreign-key rejection for an absent product must return the valid submitted offers route with invalid input.
test('create action redirects a rejected product foreign key to invalid input', async () => {
  const testHarness = harness({
    createError: Object.assign(new Error('foreign key constraint'), { code: 'P2003' }),
  });

  await captureRedirect(factory('create')(testHarness.dependencies), validForm());

  assert.deepEqual(testHarness.calls(), { createCalls: 1, findCalls: 0, updateCalls: 0 });
  assert.deepEqual(testHarness.invalidations, []);
  assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/offers?error=invalid-input']);
});

// Break caught: forwarding a missing or cross-product update as a success would conceal the product-scoped authorization guard.
test('update action redirects a product-scoped missing offer without cache invalidation', async () => {
  const testHarness = harness({ existing: false });

  await captureRedirect(factory('update')(testHarness.dependencies), validForm());

  assert.deepEqual(testHarness.calls(), { createCalls: 0, findCalls: 1, updateCalls: 0 });
  assert.deepEqual(testHarness.invalidations, []);
  assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/offers?error=not-found']);
});

// Break caught: a successful create that omits either public or offers-page revalidation leaves stale offer data after redirect.
test('create action revalidates public and parsed product offers paths before success redirect', async () => {
  const testHarness = harness();

  await captureRedirect(factory('create')(testHarness.dependencies), validForm({ productId: ' product-1 ' }));

  assert.deepEqual(testHarness.calls(), { createCalls: 1, findCalls: 0, updateCalls: 0 });
  assert.deepEqual(testHarness.invalidations, ['/', '/admin/products/product-1/offers']);
  assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/offers?saved=1']);
});

// Break caught: a successful update must preserve the command's product-bound guard while refreshing public and offers data.
test('update action revalidates public and product offers paths before success redirect', async () => {
  const testHarness = harness();

  await captureRedirect(factory('update')(testHarness.dependencies), validForm());

  assert.deepEqual(testHarness.calls(), { createCalls: 0, findCalls: 1, updateCalls: 1 });
  assert.deepEqual(testHarness.invalidations, ['/', '/admin/products/product-1/offers']);
  assert.deepEqual(testHarness.redirects, ['/admin/products/product-1/offers?saved=1']);
});
