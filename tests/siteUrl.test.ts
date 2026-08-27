import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_SITE_URL,
  getCanonicalSiteUrl,
  getProductCanonicalUrl,
} from '../src/lib/siteUrl.ts';

test('canonical origin falls back only for absent or blank configuration', () => {
  assert.equal(DEFAULT_SITE_URL, 'https://deskholt.com');
  for (const input of [undefined, '', '   ', '\n\t']) {
    const siteUrl = getCanonicalSiteUrl(input);
    assert.equal(siteUrl.toString(), 'https://deskholt.com/');
    assert.notEqual(siteUrl, getCanonicalSiteUrl(input));
  }
});

test('canonical origin accepts exact HTTP(S) origins and retains a custom port', () => {
  assert.equal(getCanonicalSiteUrl('http://localhost:43127').toString(), 'http://localhost:43127/');
  assert.equal(getCanonicalSiteUrl('https://deskholt.com/').toString(), 'https://deskholt.com/');
});

test('canonical origin rejects credentials, paths, query, fragment, and unsupported origins', () => {
  for (const input of [
    'https://user:password@deskholt.com',
    'https://deskholt.com/products',
    'https://deskholt.com/?preview=1',
    'https://deskholt.com/#top',
    'ftp://deskholt.com',
    'https:///missing-host',
    'deskholt.com',
  ]) {
    assert.throws(() => getCanonicalSiteUrl(input), input);
  }
});

test('Product canonical paths encode the raw persisted slug exactly once', () => {
  const siteUrl = new URL('http://localhost:43127/');
  const cases = [
    ['desk-chair', '/products/desk-chair'],
    ['Desk Chair', '/products/Desk%20Chair'],
    ['Bàn Làm Việc', '/products/B%C3%A0n%20L%C3%A0m%20Vi%E1%BB%87c'],
    ['save%20now', '/products/save%2520now'],
    ['desk/chair', '/products/desk%2Fchair'],
    ['desk?chair', '/products/desk%3Fchair'],
    ['MixedCase', '/products/MixedCase'],
  ] as const;

  for (const [slug, pathname] of cases) {
    const url = getProductCanonicalUrl(slug, siteUrl);
    assert.equal(url.pathname, pathname, slug);
    assert.equal(url.toString(), `http://localhost:43127${pathname}`, slug);
    assert.equal(url.pathname.endsWith('/'), false, slug);
  }
});

test('Product URL construction does not mutate the supplied origin URL', () => {
  const siteUrl = new URL('https://deskholt.com/');
  const before = siteUrl.toString();
  const productUrl = getProductCanonicalUrl('desk/chair', siteUrl);

  assert.equal(siteUrl.toString(), before);
  assert.notEqual(productUrl, siteUrl);
});
