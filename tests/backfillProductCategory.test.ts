import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCategoryBackfill } from '../scripts/backfill-product-category';

test('resolves matching category names and only proposes necessary updates', () => {
  const categories = [
    { id: 'cat-standing', name: 'Standing Desks', slug: 'standing-desks' },
    { id: 'cat-office', name: 'Office Chairs', slug: 'office-chairs' },
  ];
  const products = [
    { id: 'p1', slug: 'desk-one', category: 'standing-desks', category_id: null },
    { id: 'p2', slug: 'desk-two', category: 'standing-desks', category_id: 'cat-standing' },
    { id: 'p3', slug: 'chair-one', category: 'office-chairs', category_id: 'cat-standing' },
  ];

  assert.deepEqual(resolveCategoryBackfill(products, categories), {
    updates: [{ productId: 'p1', categoryId: 'cat-standing' }, { productId: 'p3', categoryId: 'cat-office' }],
    unchanged: [{ productId: 'p2', slug: 'desk-two', category: 'standing-desks' }],
    unmatched: [],
  });
});

test('matches case-distinct slugs to the exact category IDs', () => {
  const categories = [
    { id: 'cat-lower', name: 'Standing Desks', slug: 'standing-desks' },
    { id: 'cat-upper', name: 'Standing Desks (Upper)', slug: 'Standing-Desks' },
  ];
  const products = [
    { id: 'p-lower', slug: 'lower', category: 'standing-desks', category_id: null },
    { id: 'p-upper', slug: 'upper', category: 'Standing-Desks', category_id: null },
  ];

  assert.deepEqual(resolveCategoryBackfill(products, categories).updates, [
    { productId: 'p-lower', categoryId: 'cat-lower' },
    { productId: 'p-upper', categoryId: 'cat-upper' },
  ]);
});

test('does not match whitespace or case variants without an exact slug', () => {
  const result = resolveCategoryBackfill(
    [{ id: 'p-variant', slug: 'variant', category: ' Standing-Desks ', category_id: null }],
    [{ id: 'cat', name: 'Standing Desks', slug: 'standing-desks' }],
  );

  assert.deepEqual(result.updates, []);
  assert.deepEqual(result.unmatched, [{ productId: 'p-variant', slug: 'variant', category: ' Standing-Desks ' }]);
});

test('resolves unrelated exact slugs despite normalized collisions elsewhere', () => {
  const result = resolveCategoryBackfill(
    [
      { id: 'p-exact', slug: 'exact', category: 'office-chairs', category_id: null },
      { id: 'p-ambiguous', slug: 'ambiguous', category: 'STANDING-DESKS', category_id: null },
    ],
    [
      { id: 'cat-upper', name: 'Upper', slug: 'Standing-Desks' },
      { id: 'cat-office', name: 'Office', slug: 'office-chairs' },
    ],
  );

  assert.deepEqual(result.updates, [{ productId: 'p-exact', categoryId: 'cat-office' }]);
  assert.deepEqual(result.unmatched, [{ productId: 'p-ambiguous', slug: 'ambiguous', category: 'STANDING-DESKS' }]);
});

test('does not match a legacy category name when it is not the category slug', () => {
  const result = resolveCategoryBackfill(
    [{ id: 'p-name-only', slug: 'name-only', category: 'Standing Desks', category_id: null }],
    [{ id: 'cat', name: 'Standing Desks', slug: 'standing-desks' }],
  );

  assert.deepEqual(result.updates, []);
  assert.deepEqual(result.unmatched, [{ productId: 'p-name-only', slug: 'name-only', category: 'Standing Desks' }]);
});

test('reports unmatched products with id, slug, and category without proposing an update', () => {
  const result = resolveCategoryBackfill(
    [{ id: 'p9', slug: 'mystery', category: 'Unknown Category', category_id: null }],
    [{ id: 'cat', name: 'Standing Desks', slug: 'standing-desks' }],
  );

  assert.deepEqual(result.updates, []);
  assert.deepEqual(result.unmatched, [{ productId: 'p9', slug: 'mystery', category: 'Unknown Category' }]);
});

test('is deterministic and idempotent, while a changed category string resolves anew', () => {
  const categories = [{ id: 'cat-a', name: 'Alpha', slug: 'alpha' }, { id: 'cat-b', name: 'Beta', slug: 'beta' }];
  const products = [{ id: 'p1', slug: 'one', category: 'alpha', category_id: 'cat-b' }];
  const first = resolveCategoryBackfill(products, categories);
  const second = resolveCategoryBackfill(products, categories);

  assert.deepEqual(first, second);
  assert.deepEqual(first.updates, [{ productId: 'p1', categoryId: 'cat-a' }]);
  assert.deepEqual(resolveCategoryBackfill([{ ...products[0], category: 'beta', category_id: 'cat-b' }], categories).updates, []);
});
