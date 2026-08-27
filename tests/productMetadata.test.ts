import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateProductAccess } from '../src/lib/products/productAccessPolicy.ts';
import { buildProductMetadata } from '../src/lib/products/productMetadata.ts';

const siteUrl = new URL('https://deskholt.com/');
const product = {
  name: 'Truthful Desk',
  slug: 'Desk / 100%',
  description: '  A carefully measured workspace.  ',
};

test('Product metadata maps title, trimmed description, robots, and canonical URL', () => {
  const metadata = buildProductMetadata({
    product,
    decision: evaluateProductAccess({ status: 'ACTIVE', is_indexed: true }),
    siteUrl,
  });

  assert.equal(metadata.title, 'Truthful Desk');
  assert.equal(metadata.description, 'A carefully measured workspace.');
  assert.deepEqual(metadata.robots, { index: true, follow: true });
  assert.equal(metadata.alternates?.canonical, 'https://deskholt.com/products/Desk%20%2F%20100%25');
});

test('Product metadata falls back to the Product name for blank descriptions', () => {
  for (const description of [null, '', '   \n']) {
    const metadata = buildProductMetadata({
      product: { ...product, description },
      decision: evaluateProductAccess({ status: 'ACTIVE', is_indexed: true }),
      siteUrl,
    });

    assert.equal(metadata.description, product.name);
  }
});

test('public non-indexable Product metadata emits noindex,follow', () => {
  const metadata = buildProductMetadata({
    product,
    decision: evaluateProductAccess({ status: 'ACTIVE', is_indexed: false }),
    siteUrl,
  });

  assert.deepEqual(metadata.robots, { index: false, follow: true });
});

test('metadata canonical construction leaves the supplied origin unchanged', () => {
  const before = siteUrl.toString();
  buildProductMetadata({
    product,
    decision: evaluateProductAccess({ status: 'ACTIVE', is_indexed: true }),
    siteUrl,
  });
  assert.equal(siteUrl.toString(), before);
});
