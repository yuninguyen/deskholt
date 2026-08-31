import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dictionaries, resolveAdminClientLocale, resolveAdminLocale } from '@/lib/admin/i18n/shared';

const layoutSourcePath = new URL('../src/app/(admin)/layout.tsx', import.meta.url);
const adminHeaderSourcePath = new URL('../src/components/admin/AdminHeader.tsx', import.meta.url);
const clientSourcePath = new URL('../src/lib/admin/i18n/client.ts', import.meta.url);
const localeToggleSourcePath = new URL('../src/components/admin/LocaleToggle.tsx', import.meta.url);
const serverSourcePath = new URL('../src/lib/admin/i18n/server.ts', import.meta.url);

function leafPaths(value: unknown, prefix = ''): string[] {
  if (typeof value === 'string') return [prefix];
  if (value === null || typeof value !== 'object') return [prefix];

  return Object.entries(value).flatMap(([key, child]) =>
    leafPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

test('resolves missing and unknown locales to English', () => {
  assert.equal(resolveAdminLocale(undefined), 'en');
  assert.equal(resolveAdminLocale('vi'), 'vi');
  assert.equal(resolveAdminLocale('fr'), 'en');
});

test('Vietnamese dictionary has the same leaf-key shape as English', () => {
  assert.deepEqual(leafPaths(dictionaries.en).sort(), leafPaths(dictionaries.vi).sort());
});

test('uses the validated Admin root locale before persisted localStorage', () => {
  assert.equal(resolveAdminClientLocale(null, 'vi'), 'vi');
  assert.equal(resolveAdminClientLocale(undefined, 'vi'), 'vi');
  assert.equal(resolveAdminClientLocale('fr', 'vi'), 'vi');
  assert.equal(resolveAdminClientLocale('en', 'vi'), 'vi');
  assert.equal(resolveAdminClientLocale('vi', 'fr'), 'vi');
  assert.equal(resolveAdminClientLocale(null, 'fr'), 'en');
});

test('getClientLocale prioritizes the immediate Admin root locale over persistence', async () => {
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  let rootLocale: string | null = 'vi';
  let storedLocale: string | null = 'en';
  let storageThrows = false;

  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: {
      getElementById: () => ({ getAttribute: () => rootLocale }),
    },
  });
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      localStorage: {
        getItem: () => {
          if (storageThrows) throw new Error('storage unavailable');
          return storedLocale;
        },
      },
    },
  });

  try {
    const { getClientLocale } = await import('@/lib/admin/i18n/client');

    assert.equal(getClientLocale(), 'vi');
    storageThrows = true;
    assert.equal(getClientLocale(), 'vi');
    storageThrows = false;
    rootLocale = null;
    storedLocale = 'vi';
    assert.equal(getClientLocale(), 'vi');
    storedLocale = 'fr';
    assert.equal(getClientLocale(), 'en');
  } finally {
    if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor);
    else delete (globalThis as { document?: unknown }).document;
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else delete (globalThis as { window?: unknown }).window;
  }
});

test('Admin locale infrastructure preserves SSR defaults and persists client selection', async () => {
  const [layoutSource, adminHeaderSource, clientSource, localeToggleSource, serverSource] = await Promise.all([
    readFile(layoutSourcePath, 'utf8'),
    readFile(adminHeaderSourcePath, 'utf8'),
    readFile(clientSourcePath, 'utf8'),
    readFile(localeToggleSourcePath, 'utf8'),
    readFile(serverSourcePath, 'utf8'),
  ]);

  assert.match(layoutSource, /data-locale="en"/);
  assert.match(layoutSource, /localStorage\.getItem\('admin-locale'\)/);
  assert.match(layoutSource, /suppressHydrationWarning/);
  assert.match(localeToggleSource, /localStorage\.setItem\('admin-locale', locale\)/);
  assert.match(localeToggleSource, /document\.cookie = `admin-locale=\$\{locale\}; Path=\/; SameSite=Lax; Max-Age=/);
  assert.match(localeToggleSource, /root\.setAttribute\('data-locale', locale\)/);
  assert.match(clientSource, /^'use client';/);
  assert.match(clientSource, /resolveAdminClientLocale/);
  assert.doesNotMatch(serverSource, /from ['"]\.\/index['"]/);
  assert.match(serverSource, /from ['"]\.\/shared['"]/);
  assert.match(layoutSource, /font-body/);
  assert.match(adminHeaderSource, /font-body/);
  assert.doesNotMatch(adminHeaderSource, /font-mono/);
});
