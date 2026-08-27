import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const calls = {
  findUnique: [] as unknown[],
  uuid: 0,
  redis: [] as unknown[],
  click: [] as unknown[],
  urlMutations: 0,
};

let foundProduct: Record<string, unknown> | null = null;
let redisError: Error | null = null;

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports: Record<string, unknown> }
  ): { restore(): void };
};

moduleMock.module('@/lib/prisma', {
  namedExports: {
    prisma: {
      product: {
        findUnique: async (query: unknown) => {
          calls.findUnique.push(query);
          return foundProduct;
        },
      },
      click: {
        create: async (query: unknown) => {
          calls.click.push(query);
          return query;
        },
      },
    },
  },
});

moduleMock.module('@/lib/redis', {
  namedExports: {
    redis: {
      lpush: async (...args: unknown[]) => {
        calls.redis.push(args);
        if (redisError) throw redisError;
        return 1;
      },
    },
  },
});

moduleMock.module('uuid', {
  namedExports: {
    v4: () => {
      calls.uuid += 1;
      return '00000000-0000-4000-8000-000000000029';
    },
  },
});

let GET: typeof import('../src/app/go/[slug]/route.ts').GET;
let NextRequest: typeof import('next/server').NextRequest;

const realUrlSearchParamsSet = URLSearchParams.prototype.set;
mock.method(URLSearchParams.prototype, 'set', function set(this: URLSearchParams, name: string, value: string) {
  calls.urlMutations += 1;
  return realUrlSearchParamsSet.call(this, name, value);
});

test.before(async () => {
  ({ GET } = await import('../src/app/go/[slug]/route.ts'));
  ({ NextRequest } = await import('next/server'));
});

test.beforeEach(() => {
  calls.findUnique.length = 0;
  calls.uuid = 0;
  calls.redis.length = 0;
  calls.click.length = 0;
  calls.urlMutations = 0;
  foundProduct = null;
  redisError = null;
});

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: 'product-1',
    slug: 'standing-desk',
    name: 'Standing Desk',
    description: 'An adjustable desk',
    status: 'ACTIVE',
    is_indexed: true,
    affiliate_links: [],
    ...overrides,
  };
}

function affiliateLink(overrides: Record<string, unknown> = {}) {
  return {
    id: 'link-1',
    product_id: 'product-1',
    network: 'amazon',
    tracking_url: 'https://merchant.example/buy?tag=deskholt',
    is_in_stock: true,
    priority_order: 1,
    last_checked: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

async function request(slug = 'standing-desk', search = '') {
  const incoming = new NextRequest(`https://deskholt.example/go/${slug}${search}`, {
    headers: {
      referer: 'https://deskholt.example/products/standing-desk',
      'user-agent': 'go-product-access-test',
      'x-forwarded-for': '203.0.113.29, 10.0.0.1',
    },
  });
  calls.urlMutations = 0;

  return GET(incoming, { params: Promise.resolve({ slug }) });
}

function assertNoRedirectSideEffects() {
  assert.equal(calls.uuid, 0, 'must not generate a click UUID');
  assert.equal(calls.redis.length, 0, 'must not enqueue a Redis click');
  assert.equal(calls.click.length, 0, 'must not persist a Click fallback');
  assert.equal(calls.urlMutations, 0, 'must not mutate a merchant URL');
}

for (const lifecycle of [
  { status: 'DRAFT', is_indexed: false },
  { status: 'BLOCKED', is_indexed: true },
  { status: 'ARCHIVED', is_indexed: false },
]) {
  test(`found ${lifecycle.status} Product returns 404 before every redirect side effect`, async () => {
    foundProduct = product({
      ...lifecycle,
      affiliate_links: [affiliateLink()],
    });

    const response = await request();

    assert.equal(response.status, 404);
    assert.equal(response.headers.get('location'), null);
    assertNoRedirectSideEffects();
  });
}

test('found active Product preserves click attribution and merchant redirect flow', async () => {
  foundProduct = product({
    status: 'ACTIVE',
    is_indexed: false,
    affiliate_links: [affiliateLink()],
  });

  const response = await request();

  assert.equal(response.status, 302);
  assert.equal(calls.urlMutations, 1);
  const location = response.headers.get('location');
  assert.ok(location);
  const merchantUrl = new URL(location);
  const clickId = merchantUrl.searchParams.get('subid');
  assert.match(clickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(merchantUrl.origin + merchantUrl.pathname, 'https://merchant.example/buy');
  assert.equal(merchantUrl.searchParams.get('tag'), 'deskholt');
  assert.equal(calls.redis.length, 1);
  assert.equal(calls.click.length, 0);

  const [queueName, serializedPayload] = calls.redis[0] as [string, string];
  assert.equal(queueName, 'deskholt:click_queue');
  const payload = JSON.parse(serializedPayload);
  assert.deepEqual(payload, {
    click_id: clickId,
    product_id: 'product-1',
    network: 'amazon',
    source_page: 'https://deskholt.example/products/standing-desk',
    ip_hash: payload.ip_hash,
    user_agent: 'go-product-access-test',
    timestamp: payload.timestamp,
  });
  assert.match(payload.ip_hash, /^[a-f0-9]{64}$/);
  assert.equal(typeof payload.timestamp, 'number');
});

test('active Product uses mandatory all-out-of-stock fallback by priorityOrder', async () => {
  foundProduct = product({
    status: 'ACTIVE',
    is_indexed: true,
    affiliate_links: [
      affiliateLink({
        id: 'priority-1',
        network: 'walmart',
        tracking_url: 'https://priority.example/buy',
        is_in_stock: false,
        priority_order: 1,
      }),
      affiliateLink({
        id: 'priority-2',
        network: 'amazon',
        tracking_url: 'https://secondary.example/buy',
        is_in_stock: false,
        priority_order: 2,
      }),
    ],
  });

  const response = await request('standing-desk', '?network=amazon');

  const location = response.headers.get('location');
  assert.ok(location);
  const fallbackUrl = new URL(location);
  assert.equal(fallbackUrl.origin + fallbackUrl.pathname, 'https://priority.example/buy');
  assert.match(
    fallbackUrl.searchParams.get('subid') ?? '',
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/
  );
  assert.equal(calls.redis.length, 1);
  const [, serializedPayload] = calls.redis[0] as [string, string];
  assert.equal(JSON.parse(serializedPayload).network, 'walmart');
});

test('missing Product preserves redirect-home behavior without click side effects', async () => {
  foundProduct = null;

  const response = await request('missing-product');

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://deskholt.example/');
  assertNoRedirectSideEffects();
});

test('found Product with no affiliate links preserves redirect-home behavior without click side effects', async () => {
  foundProduct = product({ affiliate_links: [] });

  const response = await request();

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://deskholt.example/');
  assertNoRedirectSideEffects();
});
