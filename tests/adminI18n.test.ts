import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dictionaries, resolveAdminLocale } from '@/lib/admin/i18n';

const layoutSourcePath = new URL('../src/app/(admin)/layout.tsx', import.meta.url);
const localeToggleSourcePath = new URL('../src/components/admin/LocaleToggle.tsx', import.meta.url);

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

test('Admin locale infrastructure preserves SSR defaults and persists client selection', async () => {
  const [layoutSource, localeToggleSource] = await Promise.all([
    readFile(layoutSourcePath, 'utf8'),
    readFile(localeToggleSourcePath, 'utf8'),
  ]);

  assert.match(layoutSource, /data-locale="en"/);
  assert.match(layoutSource, /localStorage\.getItem\('admin-locale'\)/);
  assert.match(layoutSource, /suppressHydrationWarning/);
  assert.match(localeToggleSource, /localStorage\.setItem\('admin-locale', locale\)/);
  assert.match(localeToggleSource, /document\.cookie = `admin-locale=\$\{locale\}; Path=\/; SameSite=Lax; Max-Age=/);
  assert.match(localeToggleSource, /root\.setAttribute\('data-locale', locale\)/);
});
