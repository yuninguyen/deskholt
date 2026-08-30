import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createNewProductPage } from '../src/app/(admin)/admin/products/new/page.tsx';

type Category = { slug: string; name: string };
type NewProductPage = (props: {
  searchParams: Promise<{ error?: string }>;
}) => Promise<React.ReactElement>;
type CreateNewProductPage = (dependencies: {
  findCategories(): Promise<Category[]>;
  action(formData: FormData): void | Promise<void>;
}) => NewProductPage;

const pageFactory: CreateNewProductPage = createNewProductPage;

async function renderPage(error?: string) {
  assert.equal(typeof pageFactory, 'function');
  let categoryLookups = 0;
  const NewProductPage = pageFactory({
    findCategories: async () => {
      categoryLookups += 1;
      return [
        { slug: 'office-chairs', name: 'Office Chairs' },
        { slug: 'standing-desks', name: 'Standing Desks' },
      ];
    },
    action: async () => undefined,
  });
  const markup = renderToStaticMarkup(
    await NewProductPage({ searchParams: Promise.resolve(error ? { error } : {}) })
  );
  return { markup, categoryLookups };
}

// Break caught: omitting an identity field means the admin cannot supply the data required by Product creation.
test('new Product page renders the complete minimal identity form with fetched Categories', async () => {
  const { markup, categoryLookups } = await renderPage();

  assert.equal(categoryLookups, 1);
  for (const field of ['name', 'slug', 'categorySlug', 'brandName', 'description', 'imageUrl', 'upcCode', 'isSustainable']) {
    assert.match(markup, new RegExp(`name="${field}"`));
  }
  assert.match(markup, /<option value="office-chairs">Office Chairs<\/option>/);
  assert.match(markup, /<option value="standing-desks">Standing Desks<\/option>/);
  assert.match(markup, /type="checkbox"/);
  assert.match(markup, /Create Product/);
});

// Break caught: failure redirects without visible feedback leave the editor unable to correct the rejected submission.
test('new Product page renders a stable inline error message for every creation rejection', async () => {
  for (const [reason, message] of [
    ['invalid-input', 'Review the required Product fields and try again.'],
    ['category-missing', 'The selected Category no longer exists. Refresh and choose another Category.'],
    ['slug-taken', 'That Product slug is already in use. Choose a different slug.'],
  ]) {
    const { markup } = await renderPage(reason);
    assert.match(markup, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
});
