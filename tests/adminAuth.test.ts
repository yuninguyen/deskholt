import assert from 'node:assert/strict';
import test, { afterEach } from 'node:test';
import { authenticateAdmin, isValidSessionToken } from '../src/lib/admin/auth.ts';
import { sanitizeAdminRedirect } from '../src/lib/admin/redirect.ts';

const originalPassword = process.env.ADMIN_PASSWORD;
const originalSessionSecret = process.env.ADMIN_SESSION_SECRET;

function setAdminAuthConfig(password: string | undefined, sessionSecret: string | undefined) {
  if (password === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = password;
  }

  if (sessionSecret === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = sessionSecret;
  }
}

afterEach(() => {
  setAdminAuthConfig(originalPassword, originalSessionSecret);
});

test('sanitizeAdminRedirect allows local admin paths', () => {
  assert.equal(sanitizeAdminRedirect('/admin/products'), '/admin/products');
  assert.equal(sanitizeAdminRedirect('/admin/products?status=draft'), '/admin/products?status=draft');
});

test('sanitizeAdminRedirect rejects external and malformed targets', () => {
  for (const target of [
    'https://attacker.example',
    '//attacker.example',
    '/\\attacker.example',
    '/products',
    'admin/products',
  ]) {
    assert.equal(sanitizeAdminRedirect(target), '/admin/products');
  }
});

test('authenticateAdmin rejects a missing admin password', async () => {
  setAdminAuthConfig(undefined, 'session-secret');
  assert.equal(await authenticateAdmin(''), null);
});

test('authenticateAdmin rejects an empty admin password', async () => {
  setAdminAuthConfig('', 'session-secret');
  assert.equal(await authenticateAdmin(''), null);
});

test('authenticateAdmin rejects a missing session secret', async () => {
  setAdminAuthConfig('admin-password', undefined);
  assert.equal(await authenticateAdmin('admin-password'), null);
});

test('authenticateAdmin rejects an empty session secret', async () => {
  setAdminAuthConfig('admin-password', '');
  assert.equal(await authenticateAdmin('admin-password'), null);
});

test('authenticateAdmin rejects an incorrect password', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');
  assert.equal(await authenticateAdmin('wrong-password'), null);
});

test('authenticateAdmin issues a token for valid configuration and password', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');
  const token = await authenticateAdmin('admin-password');

  assert.equal(typeof token, 'string');
  assert.ok(token !== null);
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(await isValidSessionToken(token), true);
});

test('isValidSessionToken accepts a token under unchanged valid configuration', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');
  const token = await authenticateAdmin('admin-password');

  assert.notEqual(token, null);
  assert.equal(await isValidSessionToken(token), true);
});

test('isValidSessionToken rejects missing, empty, and incorrect tokens', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');

  assert.equal(await isValidSessionToken(undefined), false);
  assert.equal(await isValidSessionToken(null), false);
  assert.equal(await isValidSessionToken(''), false);
  assert.equal(await isValidSessionToken('not-a-valid-token'), false);
});

test('isValidSessionToken fails closed when the password becomes missing or empty', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');
  const token = await authenticateAdmin('admin-password');
  assert.notEqual(token, null);

  setAdminAuthConfig(undefined, 'session-secret');
  assert.equal(await isValidSessionToken(token), false);

  setAdminAuthConfig('', 'session-secret');
  assert.equal(await isValidSessionToken(token), false);
});

test('isValidSessionToken fails closed when the session secret becomes missing or empty', async () => {
  setAdminAuthConfig('admin-password', 'session-secret');
  const token = await authenticateAdmin('admin-password');
  assert.notEqual(token, null);

  setAdminAuthConfig('admin-password', undefined);
  assert.equal(await isValidSessionToken(token), false);

  setAdminAuthConfig('admin-password', '');
  assert.equal(await isValidSessionToken(token), false);
});
