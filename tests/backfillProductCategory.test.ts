import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCategoryBackfill } from '../scripts/backfill-product-category';

test('resolves matching category names and only proposes necessary updates', () => {
  const categories = [
    { id: 'cat-standing', name: 'Standing Desks', slug: 'standing-desks' },
    { id: 'cat-office', name: 'Office Chairs', slug: 'office-chairs' },
  ];
  const products = [
    { id: 'p1', slug: 'desk-one', category: 'Standing Desks', category_id: null },
    { id: 'p2', slug: 'desk-two', category: 'Standing Desks', category_id: 'cat-standing' },
    { id: 'p3', slug: 'chair-one', category: 'Office Chairs', category_id: 'cat-standing' },
  ];

  assert.deepEqual(resolveCategoryBackfill(products, categories), {
    updates: [{ productId: 'p1', categoryId: 'cat-standing' }, { productId: 'p3', categoryId: 'cat-office' }],
    unchanged: [{ productId: 'p2', slug: 'desk-two', category: 'Standing Desks' }],
    unmatched: [],
  });
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
  const products = [{ id: 'p1', slug: 'one', category: 'Alpha', category_id: 'cat-b' }];
  const first = resolveCategoryBackfill(products, categories);
  const second = resolveCategoryBackfill(products, categories);

  assert.deepEqual(first, second);
  assert.deepEqual(first.updates, [{ productId: 'p1', categoryId: 'cat-a' }]);
  assert.deepEqual(resolveCategoryBackfill([{ ...products[0], category: 'Beta', category_id: 'cat-b' }], categories).updates, []);
});
