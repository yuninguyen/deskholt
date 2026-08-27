import assert from 'node:assert/strict';
import test from 'node:test';
import { INDEXABLE_PRODUCT_WHERE } from '../src/lib/products/productAccessPolicy.ts';
import { mapProductSitemapRows } from '../src/lib/products/productSitemap.ts';
import { getProductCanonicalUrl } from '../src/lib/siteUrl.ts';

const siteUrl = new URL('http://localhost:43127/');
const earlier = new Date('2026-08-24T12:00:00.000Z');
const later = new Date('2026-08-25T12:00:00.000Z');

test('sitemap mapper preserves raw query order and emits exact string URLs and timestamps', () => {
  const rows = [
    { slug: 'Desk / 100%', updated_at: earlier },
    { slug: 'b-chair', updated_at: later },
  ];
  const entries = mapProductSitemapRows(rows, siteUrl);

  assert.deepEqual(entries, [
    {
      url: getProductCanonicalUrl(rows[0].slug, siteUrl).toString(),
      lastModified: earlier,
    },
    {
      url: getProductCanonicalUrl(rows[1].slug, siteUrl).toString(),
      lastModified: later,
    },
  ]);
  assert.equal(typeof entries[0]?.url, 'string');
  assert.deepEqual(Object.keys(entries[0]!).sort(), ['lastModified', 'url']);
});

test('sitemap mapper returns an empty Product sitemap for empty rows', () => {
  assert.deepEqual(mapProductSitemapRows([], siteUrl), []);
});

test('sitemap mapper does not mutate its origin or sort caller-owned rows', () => {
  const rows = [
    { slug: 'z-last', updated_at: later },
    { slug: 'a-first', updated_at: earlier },
  ];
  const beforeOrigin = siteUrl.toString();
  mapProductSitemapRows(rows, siteUrl);

  assert.deepEqual(rows.map((row) => row.slug), ['z-last', 'a-first']);
  assert.equal(siteUrl.toString(), beforeOrigin);
});

test('sitemap query intent is shared active-indexed, minimal, and raw-slug ascending', () => {
  const queryIntent = {
    where: INDEXABLE_PRODUCT_WHERE,
    select: { slug: true, updated_at: true },
    orderBy: { slug: 'asc' },
  };

  assert.deepEqual(queryIntent, {
    where: { status: 'ACTIVE', is_indexed: true },
    select: { slug: true, updated_at: true },
    orderBy: { slug: 'asc' },
  });
});

test('sitemap mapping errors propagate instead of fabricating an empty result', () => {
  assert.throws(() => mapProductSitemapRows([{ slug: 'desk', updated_at: later }], new URL('ftp://deskholt.com/')));
});
