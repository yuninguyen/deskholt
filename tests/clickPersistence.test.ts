import assert from 'node:assert/strict';
import test from 'node:test';
import type { Prisma } from '@prisma/client';
import { persistClickWithRetry } from '../src/lib/products/clickPersistence.ts';

const click = {
  click_id: 'click-request-1',
  product_id: 'product-1',
  network: 'amazon',
  source_page: 'https://deskholt.com/products/test-desk',
  ip_hash: 'hashed-ip',
  user_agent: 'test-agent',
  created_at: new Date('2026-08-28T12:00:00.000Z'),
} satisfies Prisma.ClickUncheckedCreateInput;

type CreateInput = { data: Prisma.ClickUncheckedCreateInput };
type Create = (input: CreateInput) => Promise<unknown>;
type PersistOptions = Parameters<typeof persistClickWithRetry>[0];
type Assert<T extends true> = T;
const clickInputTypeAssertions: [
  Assert<PersistOptions['click'] extends Prisma.ClickUncheckedCreateInput ? true : false>,
  Assert<PersistOptions['click'] extends { click_id: string } ? true : false>,
  Assert<PersistOptions['click'] extends { created_at: Date } ? true : false>,
] = [true, true, true];

function retryOptions(create: Create, overrides: Record<string, unknown> = {}) {
  return {
    create,
    click,
    maxAttempts: 3,
    backoffMs: 0,
    timeoutMs: 100,
    ...overrides,
  };
}

function errorWithCode(code: string, extra: Record<string, unknown> = {}) {
  return Object.assign(new Error(code), { code, ...extra });
}

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

test('helper click input remains Prisma-compatible with required identity fields', () => {
  assert.deepEqual(clickInputTypeAssertions, [true, true, true]);
});

test('normal insert persists the supplied click once', async () => {
  const inputs: CreateInput[] = [];
  const create: Create = async (input) => {
    inputs.push(input);
    return input.data;
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'persisted' });
  assert.deepEqual(inputs, [{ data: click }]);
});

test('transient failure retries and then succeeds', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    if (attempts === 1) throw errorWithCode('P1001');
    return click;
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'persisted' });
  assert.equal(attempts, 2);
});

for (const sqlstate of ['40001', '40P01']) {
  test(`raw PostgreSQL SQLSTATE ${sqlstate} retries and then succeeds`, async () => {
    let attempts = 0;
    const create: Create = async () => {
      attempts += 1;
      if (attempts === 1) throw errorWithCode(sqlstate);
      return click;
    };

    const result = await persistClickWithRetry(retryOptions(create));

    assert.deepEqual(result, { outcome: 'persisted' });
    assert.equal(attempts, 2);
  });
}

test('raw PostgreSQL SQLSTATE 40001 stops after the configured attempt limit', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('40001');
  };

  const result = await persistClickWithRetry(
    retryOptions(create, { maxAttempts: 2 })
  );

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'transient', attempts: 2 });
  assert.equal(attempts, 2);
});

test('ambiguous commit is idempotent when retrying the same click_id', async () => {
  const persisted = new Set<string>();
  const observedClickIds: string[] = [];
  const create: Create = async ({ data }) => {
    const clickId = data.click_id;
    observedClickIds.push(clickId);
    if (persisted.has(clickId)) {
      throw errorWithCode('P2002', { meta: { target: ['click_id'] } });
    }

    persisted.add(clickId);
    throw errorWithCode('ECONNRESET');
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'idempotent-duplicate' });
  assert.deepEqual(observedClickIds, [click.click_id, click.click_id]);
  assert.deepEqual([...persisted], [click.click_id]);
});

test('retrying an already-persisted click is idempotent', async () => {
  const persisted = new Set<string>();
  const create: Create = async ({ data }) => {
    if (persisted.has(data.click_id)) {
      throw errorWithCode('P2002', { meta: { target: ['click_id'] } });
    }
    persisted.add(data.click_id);
    return data;
  };

  const first = await persistClickWithRetry(retryOptions(create));
  const retry = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(first, { outcome: 'persisted' });
  assert.deepEqual(retry, { outcome: 'idempotent-duplicate' });
  assert.deepEqual([...persisted], [click.click_id]);
});

test('canonical Prisma P2002 on click_id is an idempotent duplicate', async () => {
  const create: Create = async () => {
    throw errorWithCode('P2002', { meta: { target: ['click_id'] } });
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'idempotent-duplicate' });
});

test('defensive raw PostgreSQL 23505 on clicks_click_id_key is an idempotent duplicate', async () => {
  const create: Create = async () => {
    throw errorWithCode('23505', { constraint: 'clicks_click_id_key' });
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'idempotent-duplicate' });
});

test('P2002 on a composite target containing click_id is not treated as success', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('P2002', {
      meta: { target: ['click_id', 'product_id'] },
    });
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'permanent', attempts: 1 });
  assert.equal(attempts, 1);
});

test('P2002 on a different unique field is not treated as success', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('P2002', { meta: { target: ['product_id'] } });
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'permanent', attempts: 1 });
  assert.equal(attempts, 1);
});

test('23505 on a different constraint is not treated as success', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('23505', { constraint: 'clicks_other_unique_key' });
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'permanent', attempts: 1 });
  assert.equal(attempts, 1);
});

test('known permanent failure stops without retrying', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('P2003');
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'permanent', attempts: 1 });
  assert.equal(attempts, 1);
});

test('unknown generic error is permanent and is not retried', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw new Error('unexpected database adapter failure');
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'permanent', attempts: 1 });
  assert.equal(attempts, 1);
});

test('transient failures stop after the configured attempt limit', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('P1001');
  };

  const result = await persistClickWithRetry(
    retryOptions(create, { maxAttempts: 2 })
  );

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'transient', attempts: 2 });
  assert.equal(attempts, 2);
});

test('maxAttempts is finite, floored, and capped', async () => {
  const cases = [
    { value: Number.NaN, expectedAttempts: 1 },
    { value: Number.POSITIVE_INFINITY, expectedAttempts: 1 },
    { value: -4, expectedAttempts: 1 },
    { value: 2.9, expectedAttempts: 2 },
    { value: 1_000, expectedAttempts: 100 },
  ];

  for (const { value, expectedAttempts } of cases) {
    let attempts = 0;
    const create: Create = async () => {
      attempts += 1;
      throw errorWithCode('P1001');
    };

    const result = await persistClickWithRetry(
      retryOptions(create, { maxAttempts: value, timeoutMs: 1_000 })
    );

    assert.deepEqual(result, {
      outcome: 'exhausted',
      classification: 'transient',
      attempts: expectedAttempts,
    });
    assert.equal(attempts, expectedAttempts);
  }
});

test('non-finite and negative timeout values become an immediate finite timeout', async () => {
  for (const timeoutMs of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    const releaseInsert = deferred();
    let attempts = 0;
    const create: Create = async () => {
      attempts += 1;
      await releaseInsert.promise;
      return click;
    };

    const result = await persistClickWithRetry(
      retryOptions(create, { timeoutMs })
    );

    assert.deepEqual(result, { outcome: 'exhausted', classification: 'timeout', attempts: 1 });
    assert.equal(attempts, 1);
    releaseInsert.resolve();
  }
});

test('fractional timeoutMs is floored to whole milliseconds', async () => {
  const releaseInsert = deferred();
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    await releaseInsert.promise;
    return click;
  };

  const result = await persistClickWithRetry(
    retryOptions(create, { timeoutMs: 1.9 })
  );

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'timeout', attempts: 1 });
  assert.equal(attempts, 1);
  releaseInsert.resolve();
});

test('non-finite and negative backoff values normalize to zero', async () => {
  for (const backoffMs of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
    let attempts = 0;
    const create: Create = async () => {
      attempts += 1;
      if (attempts === 1) throw errorWithCode('P1001');
      return click;
    };

    const result = await persistClickWithRetry(
      retryOptions(create, { backoffMs, timeoutMs: 50 })
    );

    assert.deepEqual(result, { outcome: 'persisted' });
    assert.equal(attempts, 2);
  }
});

test('fractional backoffMs is floored and remains within the timeout budget', async () => {
  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    if (attempts === 1) throw errorWithCode('P1001');
    return click;
  };

  const result = await persistClickWithRetry(
    retryOptions(create, { backoffMs: 1.9, timeoutMs: 50 })
  );

  assert.deepEqual(result, { outcome: 'persisted' });
  assert.equal(attempts, 2);
});

test('backoff consuming the timeout does not start a second create', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout', 'Date'] });

  let attempts = 0;
  const create: Create = async () => {
    attempts += 1;
    throw errorWithCode('P1001');
  };

  const result = persistClickWithRetry(
    retryOptions(create, { backoffMs: 1_000, timeoutMs: 10 })
  );
  await Promise.resolve();

  t.mock.timers.tick(10);
  assert.deepEqual(await result, { outcome: 'exhausted', classification: 'timeout', attempts: 1 });
  assert.equal(attempts, 1);

  t.mock.timers.tick(20);
  assert.equal(attempts, 1);
});

test('application timeout can return before the underlying insert commits', async () => {
  const releaseInsert = deferred();
  const insertSettled = deferred();
  const persisted = new Set<string>();
  let attempts = 0;
  const create: Create = async ({ data }) => {
    attempts += 1;
    await releaseInsert.promise;
    persisted.add(data.click_id);
    insertSettled.resolve();
    return data;
  };

  const result = await persistClickWithRetry(
    retryOptions(create, { timeoutMs: 25 })
  );

  assert.deepEqual(result, { outcome: 'exhausted', classification: 'timeout', attempts: 1 });
  assert.equal(attempts, 1);
  assert.equal(persisted.size, 0);

  releaseInsert.resolve();
  await insertSettled.promise;

  assert.deepEqual([...persisted], [click.click_id]);
});

test('late rejection after timeout is observed without an unhandled rejection', async () => {
  let rejectInsert!: (reason: unknown) => void;
  const insert = new Promise<never>((_resolve, reject) => {
    rejectInsert = reject;
  });
  let unhandled: unknown;
  const onUnhandled = (reason: unknown) => {
    unhandled = reason;
  };
  process.on('unhandledRejection', onUnhandled);

  try {
    const create: Create = async () => insert;
    const result = await persistClickWithRetry(
      retryOptions(create, { timeoutMs: 5 })
    );

    assert.deepEqual(result, { outcome: 'exhausted', classification: 'timeout', attempts: 1 });

    rejectInsert(errorWithCode('P1001'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(unhandled, undefined);
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
});

test('all retries within one persistence request reuse its pre-generated click_id', async () => {
  const observedClickIds: string[] = [];
  const create: Create = async ({ data }) => {
    observedClickIds.push(data.click_id);
    if (observedClickIds.length < 3) throw errorWithCode('P1001');
    return data;
  };

  const result = await persistClickWithRetry(retryOptions(create));

  assert.deepEqual(result, { outcome: 'persisted' });
  assert.deepEqual(observedClickIds, [click.click_id, click.click_id, click.click_id]);
});
