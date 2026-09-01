import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { mock } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { dictionaries, resolveAdminClientLocale, resolveAdminLocale } from '@/lib/admin/i18n/shared';

const layoutSourcePath = new URL('../src/app/(admin)/layout.tsx', import.meta.url);
const adminHeaderSourcePath = new URL('../src/components/admin/AdminHeader.tsx', import.meta.url);
const clientSourcePath = new URL('../src/lib/admin/i18n/client.ts', import.meta.url);
const localeToggleSourcePath = new URL('../src/components/admin/LocaleToggle.tsx', import.meta.url);
const serverSourcePath = new URL('../src/lib/admin/i18n/server.ts', import.meta.url);

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports?: Record<string, unknown>; defaultExport?: unknown },
  ): { restore(): void };
};

const serverLocaleMock = moduleMock.module('@/lib/admin/i18n/server', {
  namedExports: { getAdminLocale: async () => 'vi' },
});
const nextFontMock = moduleMock.module('next/font/google', {
  namedExports: { IBM_Plex_Sans: () => ({ variable: 'admin-font' }) },
});

test.after(() => {
  serverLocaleMock.restore();
  nextFontMock.restore();
});

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
    rootLocale = 'en';
    storedLocale = 'vi';
    assert.equal(getClientLocale(), 'en');
  } finally {
    if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor);
    else delete (globalThis as { document?: unknown }).document;
    if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
    else delete (globalThis as { window?: unknown }).window;
  }
});

// Break caught: a cookie-resolved Vietnamese page with no usable localStorage can SSR an English root or header controls.
test('Admin layout SSR preserves the cookie locale through the root and header controls', async () => {
  const { default: AdminLayout } = await import('../src/app/(admin)/layout.tsx');
  const markup = renderToStaticMarkup(
    await AdminLayout({ children: React.createElement('p', null, 'Admin content') }),
  );

  assert.match(markup, /id="admin-theme-root"[^>]*data-locale="vi"/);
  assert.match(markup, /Quản trị Deskholt/);
  assert.match(markup, /aria-label="Ngôn ngữ"/);
  assert.match(markup, /aria-label="Chuyển giao diện sáng\/tối"/);
  assert.match(markup, />Tối<\/span>/);
});

async function runThemeInitScript(storedLocale: string | null | 'unavailable', rootLocale = 'vi'): Promise<string | null> {
  const layoutSource = await readFile(layoutSourcePath, 'utf8');
  const script = layoutSource.match(/const THEME_INIT_SCRIPT = `([\s\S]*?)`;/)?.[1];
  assert.ok(script, 'Admin layout must define the prepaint theme initialization script');

  const attributes = new Map<string, string>([['data-locale', rootLocale]]);
  const root = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  };
  const localStorage = {
    getItem: () => {
      if (storedLocale === 'unavailable') throw new Error('storage unavailable');
      return storedLocale;
    },
  };
  new Function('window', 'document', 'localStorage', script)(
    { matchMedia: () => ({ matches: false }) },
    { currentScript: { parentElement: root } },
    localStorage,
  );

  return root.getAttribute('data-locale');
}

// Break caught: a direct document read gives the locale buttons an English server selection even when their locale snapshot is Vietnamese.
test('LocaleToggle SSR selects Vietnamese from its initial locale without document access', async () => {
  const { default: LocaleToggle } = await import('../src/components/admin/LocaleToggle.tsx');
  const markup = renderToStaticMarkup(React.createElement(LocaleToggle, { initialLocale: 'vi' }));

  assert.match(markup, /aria-label="Ngôn ngữ"/);
  assert.match(markup, /<button[^>]*aria-pressed="false"[^>]*>EN<\/button><button[^>]*aria-pressed="true"[^>]*>VI<\/button>/);
});

// Break caught: overwriting the cookie-seeded root locale before hydration makes SSR and client snapshots disagree.
test('prepaint initialization keeps the root locale without valid stored locale and accepts a valid override', async () => {
  assert.equal(await runThemeInitScript(null), 'vi');
  assert.equal(await runThemeInitScript('unavailable'), 'vi');
  assert.equal(await runThemeInitScript('fr'), 'vi');
  assert.equal(await runThemeInitScript('en'), 'en');
});

test('Admin locale infrastructure preserves SSR defaults and persists client selection', async () => {
  const [layoutSource, adminHeaderSource, clientSource, localeToggleSource, serverSource] = await Promise.all([
    readFile(layoutSourcePath, 'utf8'),
    readFile(adminHeaderSourcePath, 'utf8'),
    readFile(clientSourcePath, 'utf8'),
    readFile(localeToggleSourcePath, 'utf8'),
    readFile(serverSourcePath, 'utf8'),
  ]);

  assert.match(layoutSource, /data-locale=\{locale\}/);
  assert.match(layoutSource, /getAdminLocale\(\)/);
  assert.match(layoutSource, /root\.getAttribute\('data-locale'\)/);
  assert.match(layoutSource, /localStorage\.getItem\('admin-locale'\)/);
  assert.match(layoutSource, /suppressHydrationWarning/);
  assert.match(localeToggleSource, /const locale = useAdminLocale\(initialLocale\);/);
  assert.doesNotMatch(localeToggleSource, /resolveAdminLocale/);
  assert.match(localeToggleSource, /localStorage\.setItem\('admin-locale', locale\)/);
  assert.match(localeToggleSource, /document\.cookie = `admin-locale=\$\{locale\}; Path=\/; SameSite=Lax; Max-Age=/);
  assert.match(localeToggleSource, /root\.setAttribute\('data-locale', locale\)/);
  assert.match(clientSource, /^'use client';/);
  assert.match(clientSource, /resolveAdminClientLocale/);
  assert.doesNotMatch(serverSource, /from ['"]\.\/index['"]/);
  assert.match(serverSource, /from ['"]\.\/shared['"]/);
  assert.match(layoutSource, /font-body/);
  assert.match(adminHeaderSource, /initialLocale: Locale/);
  assert.match(adminHeaderSource, /useAdminTranslations\(initialLocale\)/);
  assert.match(adminHeaderSource, /<LocaleToggle initialLocale=\{initialLocale\}/);
  assert.match(adminHeaderSource, /<ThemeToggle initialLocale=\{initialLocale\}/);
  assert.match(clientSource, /useAdminTranslations\(initialLocale: Locale = 'en'\)/);
  assert.match(adminHeaderSource, /font-body/);
  assert.doesNotMatch(adminHeaderSource, /font-mono/);
});
