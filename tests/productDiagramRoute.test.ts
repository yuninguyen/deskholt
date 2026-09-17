import assert from 'node:assert/strict';
import test from 'node:test';
import { createProductDiagramGetHandler } from '../src/app/api/product-diagram/[slug]/route.ts';

const dimensions = {
  desktopWidthIn: 48,
  desktopDepthIn: 24,
  minHeightIn: 27.3,
  maxHeightIn: 45,
  maxLoadLb: 176,
};

function handlerFor(product: { id: string; name: string } | null, eligible = true) {
  return createProductDiagramGetHandler({
    findProductBySlug: async () => product,
    getEligibility: async () => eligible
      ? { eligible: true, dimensions }
      : { eligible: false, missing: ['maxLoadLb'] },
  });
}

test('diagram route returns 404 without an SVG body for an unknown slug', async () => {
  const response = await handlerFor(null)(
    new Request('https://deskholt.example/api/product-diagram/missing'),
    { params: Promise.resolve({ slug: 'missing' }) }
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});

test('diagram route returns an SVG containing the eligible product dimensions', async () => {
  const response = await handlerFor({ id: 'product-1', name: 'Fixture Standing Desk' })(
    new Request('https://deskholt.example/api/product-diagram/fixture-standing-desk'),
    { params: Promise.resolve({ slug: 'fixture-standing-desk' }) }
  );
  const body = await response.text();

  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /^image\/svg\+xml/);
  for (const value of ['48', '24', '27.3', '45', '176']) assert.match(body, new RegExp(value));
  assert.match(body, /Fixture Standing Desk/);
});

test('diagram route returns 404 without an SVG body for an ineligible product', async () => {
  const response = await handlerFor({ id: 'product-1', name: 'Incomplete Desk' }, false)(
    new Request('https://deskholt.example/api/product-diagram/incomplete-desk'),
    { params: Promise.resolve({ slug: 'incomplete-desk' }) }
  );

  assert.equal(response.status, 404);
  assert.equal(await response.text(), '');
});
