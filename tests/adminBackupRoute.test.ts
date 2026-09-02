import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const calls = {
  cookies: 0,
  tokens: [] as Array<string | undefined>,
  transactions: [] as unknown[][],
  queries: [] as Array<{ model: string; query: unknown }>,
};

let sessionIsValid = false;

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports: Record<string, unknown> }
  ): { restore(): void };
};

const headersModuleMock = moduleMock.module('next/headers', {
  namedExports: {
    cookies: async () => {
      calls.cookies += 1;
      return { get: () => ({ value: 'admin-token' }) };
    },
  },
});

const authModuleMock = moduleMock.module('@/lib/admin/auth', {
  namedExports: {
    ADMIN_SESSION_COOKIE: 'deskholt_admin_session',
    isValidSessionToken: async (token: string | undefined) => {
      calls.tokens.push(token);
      return sessionIsValid;
    },
  },
});

function findMany(model: string, result: unknown[]) {
  return async (query: unknown) => {
    calls.queries.push({ model, query });
    return result;
  };
}

const prismaModuleMock = moduleMock.module('@/lib/prisma', {
  namedExports: {
    prisma: {
      category: { findMany: findMany('category', [{ id: 'category-1' }]) },
      brand: { findMany: findMany('brand', [{ id: 'brand-1' }]) },
      attributeDefinition: { findMany: findMany('attributeDefinition', [{ id: 'definition-1' }]) },
      categoryAttribute: { findMany: findMany('categoryAttribute', [{ id: 'category-attribute-1' }]) },
      product: { findMany: findMany('product', [{ id: 'product-1', product_attributes: [], affiliate_links: [] }]) },
      productVariant: { findMany: findMany('productVariant', [{ id: 'variant-1', product_attributes: [] }]) },
      $transaction: async (queries: unknown[]) => {
        calls.transactions.push(queries);
        return Promise.all(queries);
      },
    },
  },
});

let GET: (request: Request) => Promise<Response>;

test.before(async () => {
  ({ GET } = await import('../src/app/(admin)/admin/backup/route.ts'));
});

test.beforeEach(() => {
  calls.cookies = 0;
  calls.tokens.length = 0;
  calls.transactions.length = 0;
  calls.queries.length = 0;
  sessionIsValid = false;
});

test.after(() => {
  prismaModuleMock.restore();
  authModuleMock.restore();
  headersModuleMock.restore();
});

test('GET redirects an invalid session before catalog queries', async () => {
  const response = await GET(new Request('https://deskholt.example/admin/backup'));

  assert.equal(response.status, 307);
  assert.equal(response.headers.get('location'), 'https://deskholt.example/admin/login?from=%2Fadmin%2Fbackup');
  assert.equal(calls.cookies, 1);
  assert.deepEqual(calls.tokens, ['admin-token']);
  assert.deepEqual(calls.transactions, []);
  assert.deepEqual(calls.queries, []);
});

test('GET exports one transactional catalog snapshot as a JSON attachment without Clicks', async () => {
  sessionIsValid = true;

  const response = await GET(new Request('https://deskholt.example/admin/backup'));
  const body = await response.text();
  const payload = JSON.parse(body);

  assert.equal(response.status, 200);
  assert.match(body, /\n  "categories": \[/);
  assert.match(
    response.headers.get('content-disposition') ?? '',
    /^attachment; filename="deskholt-backup-\d{4}-\d{2}-\d{2}\.json"$/
  );
  assert.deepEqual(Object.keys(payload), [
    'exportedAt',
    'categories',
    'brands',
    'attributeDefinitions',
    'categoryAttributes',
    'products',
    'productVariants',
  ]);
  assert.ok(Number.isFinite(Date.parse(String(payload.exportedAt))));
  assert.deepEqual(payload.categories, [{ id: 'category-1' }]);
  assert.deepEqual(payload.brands, [{ id: 'brand-1' }]);
  assert.deepEqual(payload.attributeDefinitions, [{ id: 'definition-1' }]);
  assert.deepEqual(payload.categoryAttributes, [{ id: 'category-attribute-1' }]);
  assert.deepEqual(payload.products, [{ id: 'product-1', product_attributes: [], affiliate_links: [] }]);
  assert.deepEqual(payload.productVariants, [{ id: 'variant-1', product_attributes: [] }]);
  assert.equal(calls.transactions.length, 1);
  assert.equal(calls.transactions[0].length, 6);
  assert.deepEqual(calls.queries.map(({ model }) => model), [
    'category',
    'brand',
    'attributeDefinition',
    'categoryAttribute',
    'product',
    'productVariant',
  ]);
  assert.deepEqual(calls.queries[4].query, { include: { product_attributes: true, affiliate_links: true } });
  assert.deepEqual(calls.queries[5].query, { include: { product_attributes: true } });
  assert.equal(calls.queries.some(({ model }) => model === 'click'), false);
});
