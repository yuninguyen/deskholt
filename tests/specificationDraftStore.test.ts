import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createSpecificationDraftStore,
  type SpecificationDraftRows,
} from '../src/lib/products/specificationDraftStore';

const productA = 'cm12345678901234567890';
const productB = 'cm09876543210987654321';
const rowKey = 'cm22345678901234567890__p';

function rows(value = '48.5'): SpecificationDraftRows {
  return {
    [rowKey]: {
      value,
      sourceUrl: 'https://manufacturer.example/specs',
      sourceType: 'MANUFACTURER',
      confidence: 'VERIFIED',
    },
  };
}

test('saveDraft returns a unique opaque query token for every draft', () => {
  const store = createSpecificationDraftStore();

  const first = store.saveDraft(productA, rows('48.5'));
  const second = store.saveDraft(productA, rows('49.25'));

  assert.notEqual(first, second);
  assert.match(first, /^[A-Za-z0-9_-]+$/);
  assert.doesNotMatch(first, new RegExp(productA));
});

test('takeDraft returns the exact row-keyed strings once and then consumes the token', () => {
  const store = createSpecificationDraftStore();
  const draft = rows();
  const token = store.saveDraft(productA, draft);

  assert.deepEqual(store.takeDraft(productA, token), draft);
  assert.equal(store.takeDraft(productA, token), null);
});

test('takeDraft remains readable through five minutes minus 1ms and expires at exactly five minutes', () => {
  let now = Date.parse('2026-08-28T10:00:00.000Z');
  const store = createSpecificationDraftStore({ now: () => now });
  const readableToken = store.saveDraft(productA, rows('48.5'));
  const expiredToken = store.saveDraft(productA, rows('49.25'));

  now += 5 * 60 * 1000 - 1;
  assert.deepEqual(store.takeDraft(productA, readableToken), rows('48.5'));

  now += 1;
  assert.equal(store.takeDraft(productA, expiredToken), null);
});

test('saveDraft opportunistically prunes expired abandoned tokens', () => {
  const startedAt = Date.parse('2026-08-28T10:00:00.000Z');
  let now = startedAt;
  const store = createSpecificationDraftStore({ now: () => now });
  const abandonedToken = store.saveDraft(productA, rows('48.5'));

  now += 5 * 60 * 1000;
  store.saveDraft(productB, rows('30'));

  now = startedAt + 5 * 60 * 1000 - 1;
  assert.equal(store.takeDraft(productA, abandonedToken), null);
});

test('takeDraft never serves or consumes a token through the wrong Product', () => {
  const store = createSpecificationDraftStore();
  const draft = rows();
  const token = store.saveDraft(productA, draft);

  assert.equal(store.takeDraft(productB, token), null);
  assert.deepEqual(store.takeDraft(productA, token), draft);
});

test('clearProductDrafts removes every draft for one Product without affecting another Product', () => {
  const store = createSpecificationDraftStore();
  const firstA = store.saveDraft(productA, rows('48.5'));
  const secondA = store.saveDraft(productA, rows('49.25'));
  const tokenB = store.saveDraft(productB, rows('30'));

  store.clearProductDrafts(productA);

  assert.equal(store.takeDraft(productA, firstA), null);
  assert.equal(store.takeDraft(productA, secondA), null);
  assert.deepEqual(store.takeDraft(productB, tokenB), rows('30'));
});
