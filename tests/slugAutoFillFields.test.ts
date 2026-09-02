import assert from 'node:assert/strict';
import test from 'node:test';
import { slugify, transitionSlugAutoFill } from '../src/components/admin/products/SlugAutoFillFields';

const initialState = { name: '', slug: '', slugTouched: false };

test('slugify collapses whitespace, punctuation, and uppercase letters', () => {
  assert.equal(slugify('FlexiSpot E7 Pro (Black)'), 'flexispot-e7-pro-black');
});

test('untouched name changes continue to track the slugified name', () => {
  const first = transitionSlugAutoFill(initialState, { field: 'name', value: 'FlexiSpot E7' });
  const second = transitionSlugAutoFill(first, { field: 'name', value: 'FlexiSpot E7 Pro (Black)' });

  assert.deepEqual(first, { name: 'FlexiSpot E7', slug: 'flexispot-e7', slugTouched: false });
  assert.deepEqual(second, { name: 'FlexiSpot E7 Pro (Black)', slug: 'flexispot-e7-pro-black', slugTouched: false });
});

test('a manually customized slug freezes later name changes', () => {
  const autoFilled = transitionSlugAutoFill(initialState, { field: 'name', value: 'FlexiSpot E7' });
  const customized = transitionSlugAutoFill(autoFilled, { field: 'slug', value: 'custom-standing-desk' });
  const renamed = transitionSlugAutoFill(customized, { field: 'name', value: 'FlexiSpot E7 Pro' });

  assert.deepEqual(renamed, { name: 'FlexiSpot E7 Pro', slug: 'custom-standing-desk', slugTouched: true });
});

test('manually clearing the slug also freezes later name changes', () => {
  const autoFilled = transitionSlugAutoFill(initialState, { field: 'name', value: 'FlexiSpot E7' });
  const cleared = transitionSlugAutoFill(autoFilled, { field: 'slug', value: '' });
  const renamed = transitionSlugAutoFill(cleared, { field: 'name', value: 'FlexiSpot E7 Pro' });

  assert.deepEqual(renamed, { name: 'FlexiSpot E7 Pro', slug: '', slugTouched: true });
});
