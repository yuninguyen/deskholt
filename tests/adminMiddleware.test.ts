import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';
import { NextRequest } from 'next/server';
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { proxy, config } from '../src/proxy.ts';
import { ADMIN_SESSION_COOKIE, authenticateAdmin } from '../src/lib/admin/auth.ts';

const originalPassword = process.env.ADMIN_PASSWORD;
const originalSessionSecret = process.env.ADMIN_SESSION_SECRET;

function restoreEnvironment() {
  if (originalPassword === undefined) delete process.env.ADMIN_PASSWORD;
  else process.env.ADMIN_PASSWORD = originalPassword;

  if (originalSessionSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
  else process.env.ADMIN_SESSION_SECRET = originalSessionSecret;
}

beforeEach(() => {
  process.env.ADMIN_PASSWORD = 'middleware-test-password';
  process.env.ADMIN_SESSION_SECRET = 'middleware-test-session-secret';
});

afterEach(restoreEnvironment);

function request(pathname: string, token?: string) {
  return new NextRequest(`https://deskholt.example${pathname}`, {
    headers: token ? { cookie: `${ADMIN_SESSION_COOKIE}=${token}` } : undefined,
  });
}

function assertPassThrough(response: Response) {
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('x-middleware-next'), '1');
  assert.equal(response.headers.get('location'), null);
}

test('/admin/login bypasses authentication without a redirect', async () => {
  assertPassThrough(await proxy(request('/admin/login')));
});

test('/admin/products without a valid session redirects with the original path', async () => {
  for (const token of [undefined, 'invalid-session-token']) {
    const response = await proxy(request('/admin/products', token));

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get('location'),
      'https://deskholt.example/admin/login?from=%2Fadmin%2Fproducts'
    );
  }
});

test('/admin/products with a valid session passes through', async () => {
  const token = await authenticateAdmin('middleware-test-password');
  if (token === null) throw new Error('Expected authenticateAdmin to issue a session token');

  assertPassThrough(await proxy(request('/admin/products', token)));
});

test('matcher scope includes Admin paths and excludes non-Admin paths', () => {
  assert.deepEqual(config.matcher, ['/admin/:path*']);
  assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: '/admin/products' }), true);
  assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: '/admin/login' }), true);
  assert.equal(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url: '/products/example' }), false);
});
