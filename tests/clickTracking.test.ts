import assert from 'node:assert/strict';
import test from 'node:test';
import {
  appendClickId,
  getClientIp,
  hashIp,
  selectAffiliateLink,
} from '../src/lib/clickTracking.ts';

const links = [
  { network: 'amazon', is_in_stock: false, id: 'amazon' },
  { network: 'walmart', is_in_stock: true, id: 'walmart' },
];

test('selectAffiliateLink selects an in-stock requested network', () => {
  assert.equal(selectAffiliateLink(links, 'WALMART')?.id, 'walmart');
});

test('selectAffiliateLink falls back to the first in-stock link', () => {
  assert.equal(selectAffiliateLink(links, 'target')?.id, 'walmart');
});

test('appendClickId replaces a placeholder and preserves existing query params', () => {
  assert.equal(
    appendClickId('https://example.com/buy?tag=deskholt&ref={subid}', 'click 1'),
    'https://example.com/buy?tag=deskholt&ref=click%201'
  );
  assert.equal(
    appendClickId('https://example.com/buy?tag=deskholt', 'click-2'),
    'https://example.com/buy?tag=deskholt&subid=click-2'
  );
});

test('getClientIp uses the first proxy address and hashIp does not retain the raw IP', () => {
  const headers = new Headers({ 'x-forwarded-for': '203.0.113.4, 10.0.0.1' });
  const ip = getClientIp(headers);
  const digest = hashIp(ip, 'test-salt');

  assert.equal(ip, '203.0.113.4');
  assert.equal(digest.length, 64);
  assert.ok(!digest.includes(ip));
});
