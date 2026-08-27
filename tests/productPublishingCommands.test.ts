import assert from 'node:assert/strict';
import test from 'node:test';
import {
  classifyZeroRowEnable,
  executePublishingCommand,
  parsePublishingCommand,
  type ProductPublishingStore,
} from '../src/lib/products/productPublishingCommands.ts';

const PRODUCT_ID = '00000000-0000-4000-8000-000000000035';

function form(entries: Array<[string, string]>) {
  const data = new FormData();
  for (const [key, value] of entries) data.set(key, value);
  return data;
}

test('parsePublishingCommand accepts each explicit command shape', () => {
  for (const status of ['DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED'] as const) {
    assert.deepEqual(
      parsePublishingCommand(
        form([
          ['productId', PRODUCT_ID],
          ['command', 'set-lifecycle'],
          ['status', status],
        ])
      ),
      { productId: PRODUCT_ID, command: { kind: 'set-lifecycle', status } }
    );
  }

  assert.deepEqual(
    parsePublishingCommand(
      form([
        ['productId', PRODUCT_ID],
        ['command', 'enable-index'],
      ])
    ),
    { productId: PRODUCT_ID, command: { kind: 'enable-index' } }
  );
  assert.deepEqual(
    parsePublishingCommand(
      form([
        ['productId', PRODUCT_ID],
        ['command', 'disable-index'],
      ])
    ),
    { productId: PRODUCT_ID, command: { kind: 'disable-index' } }
  );
});

test('parsePublishingCommand rejects invalid IDs, kinds, and lifecycle values before mutation', () => {
  const invalidForms = [
    form([['command', 'enable-index']]),
    form([
      ['productId', 'not-a-product-id'],
      ['command', 'enable-index'],
    ]),
    form([['productId', PRODUCT_ID]]),
    form([
      ['productId', PRODUCT_ID],
      ['command', 'publish-everything'],
    ]),
    form([
      ['productId', PRODUCT_ID],
      ['command', 'set-lifecycle'],
    ]),
    form([
      ['productId', PRODUCT_ID],
      ['command', 'set-lifecycle'],
      ['status', 'DELETED'],
    ]),
  ];

  for (const formData of invalidForms) {
    assert.throws(() => parsePublishingCommand(formData), /product|command|status|lifecycle/i);
  }
});

function recordingStore(current: { status: 'DRAFT' | 'ACTIVE' | 'BLOCKED' | 'ARCHIVED'; is_indexed: boolean } | null) {
  const calls: Array<{ operation: string; args: unknown }> = [];
  const store: ProductPublishingStore = {
    setLifecycle: async (productId, status) => {
      calls.push({ operation: 'setLifecycle', args: { productId, status } });
      return current ? 1 : 0;
    },
    enableIndexWhenActive: async (productId) => {
      calls.push({ operation: 'enableIndexWhenActive', args: { productId } });
      return current?.status === 'ACTIVE' ? 1 : 0;
    },
    disableIndex: async (productId) => {
      calls.push({ operation: 'disableIndex', args: { productId } });
      return current ? 1 : 0;
    },
    findPublishingState: async (productId) => {
      calls.push({ operation: 'findPublishingState', args: { productId } });
      return current;
    },
  };
  return { store, calls };
}

for (const status of ['DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED'] as const) {
  test(`set-lifecycle ${status} uses one normalized lifecycle write that clears indexing`, async () => {
    const { store, calls } = recordingStore({ status: 'DRAFT', is_indexed: true });

    assert.deepEqual(
      await executePublishingCommand(store, PRODUCT_ID, { kind: 'set-lifecycle', status }),
      { ok: true }
    );
    assert.deepEqual(calls, [
      { operation: 'setLifecycle', args: { productId: PRODUCT_ID, status } },
    ]);
  });
}

test('enable-index uses only the active-conditional write', async () => {
  const { store, calls } = recordingStore({ status: 'ACTIVE', is_indexed: false });

  assert.deepEqual(await executePublishingCommand(store, PRODUCT_ID, { kind: 'enable-index' }), {
    ok: true,
  });
  assert.deepEqual(calls, [
    { operation: 'enableIndexWhenActive', args: { productId: PRODUCT_ID } },
  ]);
});

test('disable-index preserves lifecycle by writing only the index flag', async () => {
  const { store, calls } = recordingStore({ status: 'BLOCKED', is_indexed: true });

  assert.deepEqual(await executePublishingCommand(store, PRODUCT_ID, { kind: 'disable-index' }), {
    ok: true,
  });
  assert.deepEqual(calls, [{ operation: 'disableIndex', args: { productId: PRODUCT_ID } }]);
});

test('zero-row enable classification distinguishes missing, non-active, and concurrent conflict', () => {
  assert.deepEqual(classifyZeroRowEnable(null), { ok: false, reason: 'missing' });

  for (const status of ['DRAFT', 'BLOCKED', 'ARCHIVED'] as const) {
    assert.deepEqual(classifyZeroRowEnable({ status, is_indexed: false }), {
      ok: false,
      reason: 'active-only',
    });
  }

  assert.deepEqual(classifyZeroRowEnable({ status: 'ACTIVE', is_indexed: false }), {
    ok: false,
    reason: 'concurrency-conflict',
  });
});

test('zero-row enable performs classification only and never retries a write', async () => {
  const { store, calls } = recordingStore({ status: 'BLOCKED', is_indexed: false });

  assert.deepEqual(await executePublishingCommand(store, PRODUCT_ID, { kind: 'enable-index' }), {
    ok: false,
    reason: 'active-only',
  });
  assert.deepEqual(calls, [
    { operation: 'enableIndexWhenActive', args: { productId: PRODUCT_ID } },
    { operation: 'findPublishingState', args: { productId: PRODUCT_ID } },
  ]);
});

test('zero-row lifecycle and disable writes classify the Product as missing', async () => {
  for (const command of [
    { kind: 'set-lifecycle', status: 'ACTIVE' } as const,
    { kind: 'disable-index' } as const,
  ]) {
    const { store } = recordingStore(null);
    assert.deepEqual(await executePublishingCommand(store, PRODUCT_ID, command), {
      ok: false,
      reason: 'missing',
    });
  }
});
