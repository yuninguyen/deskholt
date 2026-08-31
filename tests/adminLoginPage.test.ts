import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const pagePath = resolve(process.cwd(), 'src/app/(admin)/admin/login/page.tsx');

// Break caught: a redesigned login screen can silently bypass server translations,
// accessibility, shadcn primitives, or the existing auth form contract.
test('Admin login page keeps its translated accessible shadcn form and auth wiring', () => {
  const source = readFileSync(pagePath, 'utf8');

  assert.match(source, /import\s*\{\s*getAdminTranslations\s*\}\s*from\s*['"][^'"]*i18n\/server['"]/);
  assert.match(source, /const\s+(?:t|translations)\s*=\s*await\s+getAdminTranslations\(\)/);
  for (const key of ['title', 'prompt', 'invalidPassword', 'password', 'submit']) {
    assert.match(source, new RegExp(`(?:t|translations)\\.login\\.${key}`));
  }

  assert.match(source, /import\s*\{[^}]*Card[^}]*\}\s*from\s*['"]@\/components\/ui\/card['"]/);
  assert.match(source, /import\s*\{\s*Input\s*\}\s*from\s*['"]@\/components\/ui\/input['"]/);
  assert.match(source, /import\s*\{\s*Label\s*\}\s*from\s*['"]@\/components\/ui\/label['"]/);
  assert.match(source, /import\s*\{\s*Button\s*\}\s*from\s*['"]@\/components\/ui\/button['"]/);
  assert.match(source, /<Card\b/);
  assert.match(source, /<Input\b/);
  assert.match(source, /<Label\b/);
  assert.match(source, /<Button\b/);

  assert.match(source, /role=["']alert["']/);
  assert.match(source, /autoComplete=["']current-password["']/);
  assert.match(source, /<form[^>]*action=\{loginAction\}/);
  assert.match(source, /\{from\s*&&\s*<input\s+type=["']hidden["']\s+name=["']from["']\s+value=\{from\}\s*\/>\}/);
  assert.match(source, /<Input[^>]*id=["']password["'][^>]*name=["']password["'][^>]*type=["']password["'][^>]*required[^>]*autoFocus/);
});
