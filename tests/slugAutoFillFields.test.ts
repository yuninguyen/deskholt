import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { slugify } from '../src/components/admin/products/SlugAutoFillFields';

const componentPath = new URL('../src/components/admin/products/SlugAutoFillFields.tsx', import.meta.url);

test('slugify collapses whitespace, punctuation, and uppercase letters', () => {
  assert.equal(slugify('FlexiSpot E7 Pro (Black)'), 'flexispot-e7-pro-black');
});

test('name input fills the slug until a direct slug change marks it touched', async () => {
  const source = await readFile(componentPath, 'utf8');

  assert.match(source, /const \[slugTouched, setSlugTouched\] = useState\(false\);/);
  assert.match(source, /function onNameChange\(value: string\) \{\s*setName\(value\);\s*if \(!slugTouched\) setSlug\(slugify\(value\)\);\s*\}/);
  assert.match(source, /function onSlugChange\(value: string\) \{\s*setSlugTouched\(true\);\s*setSlug\(value\);\s*\}/);
});
