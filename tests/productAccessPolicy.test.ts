import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INDEXABLE_PRODUCT_WHERE,
  evaluateProductAccess,
  type ProductAccessReason,
} from '../src/lib/products/productAccessPolicy.ts';

const CLOSED_REASONS = new Set<ProductAccessReason>([
  'draft',
  'blocked',
  'archived',
  'explicit-noindex',
  'eligible',
]);

const cases = [
  {
    status: 'DRAFT',
    is_indexed: false,
    expected: {
      reason: 'draft',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'DRAFT',
    is_indexed: true,
    expected: {
      reason: 'draft',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'BLOCKED',
    is_indexed: false,
    expected: {
      reason: 'blocked',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'BLOCKED',
    is_indexed: true,
    expected: {
      reason: 'blocked',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'ARCHIVED',
    is_indexed: false,
    expected: {
      reason: 'archived',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'ARCHIVED',
    is_indexed: true,
    expected: {
      reason: 'archived',
      isPublic: false,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: false,
      robots: null,
    },
  },
  {
    status: 'ACTIVE',
    is_indexed: false,
    expected: {
      reason: 'explicit-noindex',
      isPublic: true,
      isIndexable: false,
      isListable: false,
      isInSitemap: false,
      isCommerceEligible: true,
      robots: { index: false, follow: true },
    },
  },
  {
    status: 'ACTIVE',
    is_indexed: true,
    expected: {
      reason: 'eligible',
      isPublic: true,
      isIndexable: true,
      isListable: true,
      isInSitemap: true,
      isCommerceEligible: true,
      robots: { index: true, follow: true },
    },
  },
] as const;

for (const matrixCase of cases) {
  test(`evaluateProductAccess maps ${matrixCase.status} + indexed=${matrixCase.is_indexed}`, () => {
    const decision = evaluateProductAccess({
      status: matrixCase.status,
      is_indexed: matrixCase.is_indexed,
    });

    assert.deepEqual(decision, matrixCase.expected);
    assert.equal(CLOSED_REASONS.has(decision.reason), true);
  });
}

test('non-active lifecycle states override a malformed true index flag', () => {
  for (const status of ['DRAFT', 'BLOCKED', 'ARCHIVED'] as const) {
    const decision = evaluateProductAccess({ status, is_indexed: true });

    assert.equal(decision.isPublic, false);
    assert.equal(decision.isIndexable, false);
    assert.equal(decision.isListable, false);
    assert.equal(decision.isInSitemap, false);
    assert.equal(decision.isCommerceEligible, false);
    assert.equal(decision.robots, null);
  }
});

test('shared indexable Product predicate requires ACTIVE plus indexed', () => {
  assert.deepEqual(INDEXABLE_PRODUCT_WHERE, {
    status: 'ACTIVE',
    is_indexed: true,
  });
});
