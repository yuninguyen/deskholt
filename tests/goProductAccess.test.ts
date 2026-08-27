import assert from 'node:assert/strict';
import test, { mock } from 'node:test';

const calls = {
  findUnique: [] as unknown[],
  click: [] as Array<{ data: Record<string, unknown> }>,
  urlMutations: 0,
  errors: [] as unknown[][],
};

let foundProduct: Record<string, unknown> | null = null;
let createClick: (query: { data: Record<string, unknown> }) => Promise<unknown> = async (query) => query;
let consoleErrorThrows = false;

const originalPersistenceEnv = {
  maxAttempts: process.env.CLICK_PERSIST_MAX_ATTEMPTS,
  backoffMs: process.env.CLICK_PERSIST_BACKOFF_MS,
  timeoutMs: process.env.CLICK_PERSIST_TIMEOUT_MS,
};

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports: Record<string, unknown> }
  ): { restore(): void };
};

const prismaModuleMock = moduleMock.module('@/lib/prisma', {
  namedExports: {
    prisma: {
      product: {
        findUnique: async (query: unknown) => {
          calls.findUnique.push(query);
          return foundProduct;
        },
      },
      click: {
        create: async (query: { data: Record<string, unknown> }) => {
          calls.click.push(query);
          return createClick(query);
        },
      },
    },
  },
});

let GET: typeof import('../src/app/go/[slug]/route.ts').GET;
let NextRequest: typeof import('next/server').NextRequest;

const realUrlSearchParamsSet = URLSearchParams.prototype.set;
const urlSearchParamsSetMock = mock.method(URLSearchParams.prototype, 'set', function set(this: URLSearchParams, name: string, value: string) {
  calls.urlMutations += 1;
  return realUrlSearchParamsSet.call(this, name, value);
});
const consoleErrorMock = mock.method(console, 'error', (...args: unknown[]) => {
  calls.errors.push(args);
  if (consoleErrorThrows) throw new Error('logger unavailable');
});

test.before(async () => {
  process.env.CLICK_PERSIST_MAX_ATTEMPTS = '2';
  process.env.CLICK_PERSIST_BACKOFF_MS = '0';
  process.env.CLICK_PERSIST_TIMEOUT_MS = '15';
  ({ GET } = await import('../src/app/go/[slug]/route.ts'));
  ({ NextRequest } = await import('next/server'));
});

test.beforeEach(() => {
  calls.findUnique.length = 0;
  calls.click.length = 0;
  calls.urlMutations = 0;
  calls.errors.length = 0;
  foundProduct = null;
  createClick = async (query) => query;
  consoleErrorThrows = false;
  process.env.CLICK_PERSIST_MAX_ATTEMPTS = '2';
  process.env.CLICK_PERSIST_BACKOFF_MS = '0';
  process.env.CLICK_PERSIST_TIMEOUT_MS = '15';
});

test.after(() => {
  for (const [key, value] of Object.entries({
    CLICK_PERSIST_MAX_ATTEMPTS: originalPersistenceEnv.maxAttempts,
    CLICK_PERSIST_BACKOFF_MS: originalPersistenceEnv.backoffMs,
    CLICK_PERSIST_TIMEOUT_MS: originalPersistenceEnv.timeoutMs,
  })) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  urlSearchParamsSetMock.mock.restore();
  consoleErrorMock.mock.restore();
  prismaModuleMock.restore();
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

function errorWithCode(code: string) {
  return Object.assign(new Error(code), { code });
}

function merchantClickId(response: Response) {
  assert.equal(response.status, 302);
  const location = response.headers.get('location');
  assert.ok(location);
  const merchantUrl = new URL(location);
  assert.equal(merchantUrl.origin + merchantUrl.pathname, 'https://merchant.example/buy');
  assert.equal(merchantUrl.searchParams.get('tag'), 'deskholt');
  return merchantUrl.searchParams.get('subid');
}

function assertNoRedirectSideEffects() {
  assert.equal(calls.click.length, 0, 'must not persist a Click');
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

test('successful direct persistence redirects to merchant and stores exactly one click with the redirect click_id', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });

  const response = await request();
  const clickId = merchantClickId(response);

  assert.match(clickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(calls.click.length, 1);
  assert.deepEqual(calls.click[0].data, {
    click_id: clickId,
    product_id: 'product-1',
    network: 'amazon',
    source_page: 'https://deskholt.example/products/standing-desk',
    ip_hash: calls.click[0].data.ip_hash,
    user_agent: 'go-product-access-test',
    created_at: calls.click[0].data.created_at,
  });
  assert.match(String(calls.click[0].data.ip_hash), /^[a-f0-9]{64}$/);
  assert.ok(calls.click[0].data.created_at instanceof Date);
});

test('transient failure retries and succeeds with one logical click identity', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  let attempts = 0;
  createClick = async (query) => {
    attempts += 1;
    if (attempts === 1) throw errorWithCode('P1001');
    return query;
  };

  const response = await request();
  const clickId = merchantClickId(response);

  assert.match(clickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(calls.click.length, 2);
  assert.deepEqual(calls.click.map(({ data }) => data.click_id), [clickId, clickId]);
  assert.equal(calls.click[0].data.created_at, calls.click[1].data.created_at);
});

for (const failure of [
  { name: 'permanent', error: errorWithCode('P2003'), expectedAttempts: 1 },
  { name: 'transient', error: errorWithCode('P1001'), expectedAttempts: 2 },
]) {
  test(`exhausted ${failure.name} persistence still redirects to merchant and emits structured failure evidence`, async () => {
    foundProduct = product({ affiliate_links: [affiliateLink()] });
    createClick = async () => {
      throw failure.error;
    };

    const response = await request();
    const clickId = merchantClickId(response);

    assert.match(clickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    assert.equal(calls.click.length, failure.expectedAttempts);
    assert.deepEqual(calls.click.map(({ data }) => data.click_id), Array(failure.expectedAttempts).fill(clickId));
    assert.equal(calls.errors.length, 1);
    const [event] = calls.errors[0] as [Record<string, unknown>];
    assert.deepEqual(event, {
      event: 'click_persistence_exhausted',
      metric: 'click_persistence_failure_total',
      clickId,
      clickedAt: calls.click[0].data.created_at,
      productId: 'product-1',
      productSlug: 'standing-desk',
      affiliateLinkId: 'link-1',
      merchant: 'amazon',
      network: 'amazon',
      destination: 'https://merchant.example/buy',
      classification: failure.name,
      attempts: failure.expectedAttempts,
    });
  });
}

test('persistence timeout still redirects to merchant and emits timeout failure evidence', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  createClick = async () => new Promise(() => {});

  const response = await request();
  const clickId = merchantClickId(response);

  assert.match(clickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(calls.click.length, 1);
  const exhaustedEvents = calls.errors.filter(
    ([event]) => typeof event === 'object' && event !== null && (event as Record<string, unknown>).event === 'click_persistence_exhausted'
  );
  assert.equal(exhaustedEvents.length, 1);
  const [event] = exhaustedEvents[0] as [Record<string, unknown>];
  assert.equal(event.event, 'click_persistence_exhausted');
  assert.equal(event.metric, 'click_persistence_failure_total');
  assert.equal(event.clickId, clickId);
  assert.equal(event.clickedAt, calls.click[0].data.created_at);
  assert.equal(event.productId, 'product-1');
  assert.equal(event.productSlug, 'standing-desk');
  assert.equal(event.affiliateLinkId, 'link-1');
  assert.equal(event.merchant, 'amazon');
  assert.equal(event.network, 'amazon');
  assert.equal(event.destination, 'https://merchant.example/buy');
  assert.equal(event.classification, 'timeout');
  assert.equal(event.attempts, 1);
});

test('structured failure emission cannot block the merchant redirect when console.error throws', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  createClick = async () => {
    throw errorWithCode('P2003');
  };
  consoleErrorThrows = true;

  const response = await request();

  assert.match(merchantClickId(response) ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(calls.click.length, 1);
  assert.equal(calls.errors.length, 1);
});

test('invalid route persistence config falls back to three observable attempts', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  createClick = async () => {
    throw errorWithCode('P1001');
  };
  process.env.CLICK_PERSIST_BACKOFF_MS = '0';
  process.env.CLICK_PERSIST_TIMEOUT_MS = '1000';

  for (const value of [undefined, '', 'malformed', 'Infinity', '-1', '6', '1.5']) {
    calls.click.length = 0;
    calls.errors.length = 0;
    if (value === undefined) delete process.env.CLICK_PERSIST_MAX_ATTEMPTS;
    else process.env.CLICK_PERSIST_MAX_ATTEMPTS = value;

    const response = await request();

    assert.equal(response.status, 302, `config ${String(value)} must still redirect`);
    assert.equal(calls.click.length, 3, `config ${String(value)} must use the documented default`);
  }
});

test('malformed and out-of-range backoff config uses the documented 10 ms default', async () => {
  const original = {
    backoffMs: process.env.CLICK_PERSIST_BACKOFF_MS,
    timeoutMs: process.env.CLICK_PERSIST_TIMEOUT_MS,
  };

  try {
    for (const value of ['malformed', '101']) {
      calls.click.length = 0;
      calls.errors.length = 0;
      foundProduct = product({ affiliate_links: [affiliateLink()] });
      process.env.CLICK_PERSIST_BACKOFF_MS = value;
      process.env.CLICK_PERSIST_TIMEOUT_MS = '1000';
      let attempts = 0;
      createClick = async (query) => {
        attempts += 1;
        if (attempts === 1) throw errorWithCode('P1001');
        return query;
      };
      const observedDelays: number[] = [];
      const timerMock = mock.method(globalThis, 'setTimeout', (callback: () => void, delay?: number) => {
        observedDelays.push(Number(delay));
        if (delay === 10) queueMicrotask(callback);
        return {} as ReturnType<typeof setTimeout>;
      });
      const clearTimerMock = mock.method(globalThis, 'clearTimeout', () => {});

      try {
        const response = await request();
        assert.equal(response.status, 302);
      } finally {
        clearTimerMock.mock.restore();
        timerMock.mock.restore();
      }

      assert.equal(attempts, 2, `config ${value} must retry once`);
      assert.deepEqual(observedDelays, [1000, 10], `config ${value} must use 10 ms backoff`);
    }
  } finally {
    if (original.backoffMs === undefined) delete process.env.CLICK_PERSIST_BACKOFF_MS;
    else process.env.CLICK_PERSIST_BACKOFF_MS = original.backoffMs;
    if (original.timeoutMs === undefined) delete process.env.CLICK_PERSIST_TIMEOUT_MS;
    else process.env.CLICK_PERSIST_TIMEOUT_MS = original.timeoutMs;
  }
});

test('malformed and out-of-range timeout config uses the documented 150 ms default', async () => {
  const original = process.env.CLICK_PERSIST_TIMEOUT_MS;

  try {
    for (const value of ['malformed', '1001']) {
      calls.click.length = 0;
      calls.errors.length = 0;
      foundProduct = product({ affiliate_links: [affiliateLink()] });
      process.env.CLICK_PERSIST_TIMEOUT_MS = value;
      createClick = async () => new Promise(() => {});
      const observedDelays: number[] = [];
      const timerMock = mock.method(globalThis, 'setTimeout', (callback: () => void, delay?: number) => {
        observedDelays.push(Number(delay));
        queueMicrotask(callback);
        return {} as ReturnType<typeof setTimeout>;
      });
      const clearTimerMock = mock.method(globalThis, 'clearTimeout', () => {});

      try {
        const response = await request();
        assert.equal(response.status, 302);
      } finally {
        clearTimerMock.mock.restore();
        timerMock.mock.restore();
      }

      assert.equal(calls.click.length, 1, `config ${value} must start one create`);
      assert.deepEqual(observedDelays, [150], `config ${value} must use 150 ms timeout`);
    }
  } finally {
    if (original === undefined) delete process.env.CLICK_PERSIST_TIMEOUT_MS;
    else process.env.CLICK_PERSIST_TIMEOUT_MS = original;
  }
});

test('unexpected persistence boundary failures log controlled metadata with unknown attempts', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  const timerError = errorWithCode('E_TIMER');
  const timerMock = mock.method(globalThis, 'setTimeout', () => {
    throw timerError;
  });

  let response!: Response;
  try {
    response = await request();
  } finally {
    timerMock.mock.restore();
  }

  assert.match(merchantClickId(response) ?? '', /^[0-9a-f-]{36}$/);
  assert.equal(calls.click.length, 1);
  assert.equal(calls.errors.length, 1);
  const [event] = calls.errors[0] as [Record<string, unknown>];
  assert.equal(event.event, 'click_persistence_unexpected_failure');
  assert.equal(event.affiliateLinkId, 'link-1');
  assert.equal(event.destination, 'https://merchant.example/buy');
  assert.equal(event.classification, 'unexpected');
  assert.equal(event.attempts, null);
  assert.equal(event.errorName, 'Error');
  assert.equal(event.errorCode, 'E_TIMER');
  assert.equal('error' in event, false);
});

test('a new request lifecycle gets a new UUID while retries within one request reuse one UUID', async () => {
  foundProduct = product({ affiliate_links: [affiliateLink()] });
  let attempts = 0;
  createClick = async (query) => {
    attempts += 1;
    if (attempts === 1) throw errorWithCode('P1001');
    return query;
  };

  const firstResponse = await request();
  const firstClickId = merchantClickId(firstResponse);
  const secondResponse = await request();
  const secondClickId = merchantClickId(secondResponse);

  assert.match(firstClickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.match(secondClickId ?? '', /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(firstClickId, secondClickId);
  assert.deepEqual(calls.click.map(({ data }) => data.click_id), [firstClickId, firstClickId, secondClickId]);
});

test('active Product uses mandatory all-out-of-stock fallback by priorityOrder', async () => {
  foundProduct = product({
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
  assert.equal(calls.click.length, 1);
  assert.equal(fallbackUrl.searchParams.get('subid'), calls.click[0].data.click_id);
  assert.equal(calls.click[0].data.network, 'walmart');
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
