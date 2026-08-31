import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const pagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/new/page.tsx');
const source = () => readFileSync(pagePath, 'utf8');

// Break caught: a redesign can bypass the server dictionary and show English copy despite the selected Admin locale.
test('new Product page uses the server dictionary for translated form and creation-error copy', () => {
  const page = source();

  assert.match(page, /import\s*\{\s*getAdminTranslations\s*\}\s*from\s*['"][^'"]*i18n\/server['"]/);
  assert.match(page, /const\s+translations\s*=\s*await\s+getAdminTranslations\(\)/);
  for (const key of [
    'back', 'title', 'description', 'rejected', 'name', 'slug', 'slugHelp', 'category',
    'selectCategory', 'brandName', 'optional', 'descriptionLabel', 'imageUrl', 'upcSku',
    'sustainable', 'submit',
  ]) {
    assert.match(page, new RegExp(`translations\\.createProduct\\.${key}`));
  }
  for (const key of ['invalidInput', 'categoryMissing', 'slugTaken', 'fallback']) {
    assert.match(page, new RegExp(`translations\\.createProduct\\.errors\\.${key}`));
  }
});

// Break caught: replacing the native submission controls with non-form shadcn primitives drops Product creation fields from FormData.
test('new Product page uses shadcn inspection controls while preserving the complete creation FormData contract', () => {
  const page = source();

  for (const component of ['Card', 'Input', 'Select', 'Textarea', 'Checkbox', 'Label', 'Button']) {
    assert.match(page, new RegExp(`<${component}\\b`));
  }
  assert.match(page, /<form\s+action=\{action\}/);
  assert.match(page, /<Input[^>]*id="name"[^>]*name="name"[^>]*required/);
  assert.match(page, /<Input[^>]*id="slug"[^>]*name="slug"[^>]*required[^>]*pattern="\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*"/);
  assert.match(page, /<Select\s+name="categorySlug"\s+required/);
  assert.match(page, /<SelectTrigger[^>]*id="categorySlug"/);
  assert.match(page, /<SelectItem\s+key=\{category\.slug\}\s+value=\{category\.slug\}/);
  assert.match(page, /<Input[^>]*id="brandName"[^>]*name="brandName"/);
  assert.match(page, /<Textarea[^>]*id="description"[^>]*name="description"[^>]*required[^>]*rows=\{4\}/);
  assert.match(page, /<Input[^>]*id="imageUrl"[^>]*name="imageUrl"[^>]*type="url"[^>]*required/);
  assert.match(page, /<Input[^>]*id="upcCode"[^>]*name="upcCode"/);
  assert.match(page, /<Checkbox[^>]*id="isSustainable"[^>]*name="isSustainable"[^>]*value="on"/);
  assert.match(page, /<Button\s+type="submit"/);
});
