import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductCard, { type ProductCardProps } from '../src/components/ui/ProductCard';

function renderProductCard(overrides: Partial<ProductCardProps> = {}): string {
  return renderToStaticMarkup(
    React.createElement(ProductCard, {
      name: 'Test Standing Desk',
      slug: 'test-standing-desk',
      category: 'standing-desks',
      imageUrl: '/test-standing-desk.jpg',
      linkCount: 0,
      ...overrides,
    })
  );
}

test('ProductCard shows a clear zero-offer state with or without a price', () => {
  for (const lowestPrice of [undefined, 499]) {
    const html = renderProductCard({ linkCount: 0, lowestPrice });

    assert.match(html, /Price coming soon/);
    assert.match(html, /View product →/);
    assert.doesNotMatch(html, /Best price from/);
    assert.doesNotMatch(html, /N\/A/);
    assert.doesNotMatch(html, /Compare 0 stores/);
  }
});

test('ProductCard preserves priced-offer rendering', () => {
  const html = renderProductCard({ linkCount: 1, lowestPrice: 499 });

  assert.match(html, /Best price from/);
  assert.match(html, /\$499\.00/);
  assert.match(html, /Compare 1 stores →/);
  assert.doesNotMatch(html, /Price coming soon/);
  assert.doesNotMatch(html, /View product →/);
});
