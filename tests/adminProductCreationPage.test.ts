import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test, { mock } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const pagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/new/page.tsx');
const slugAutoFillFieldsPath = resolve(process.cwd(), 'src/components/admin/products/SlugAutoFillFields.tsx');
const checkboxSourcePath = resolve(process.cwd(), 'node_modules/@radix-ui/react-checkbox/dist/index.js');
const selectSourcePath = resolve(process.cwd(), 'node_modules/@radix-ui/react-select/dist/index.js');
const creationAction = async () => undefined;
const translations = {
  createProduct: {
    back: 'Catalog',
    title: 'Create catalog record',
    description: 'Inspect its identity before specifications.',
    rejected: 'Creation rejected.',
    name: 'Record name',
    slug: 'Record slug',
    slugHelp: 'Use lowercase slugs.',
    category: 'Record category',
    selectCategory: 'Choose a category',
    brandName: 'Maker',
    optional: 'optional',
    descriptionLabel: 'Record description',
    imageUrl: 'Image address',
    upcSku: 'Record code',
    sustainable: 'Sustainable record',
    submit: 'Create record',
    errors: {
      invalidInput: 'KNOWN_ERROR',
      categoryMissing: 'MISSING_CATEGORY',
      slugTaken: 'TAKEN_SLUG',
      fallback: 'FALLBACK_ERROR',
    },
  },
};
let translationLookups = 0;
const categoryQueries: unknown[] = [];

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports?: Record<string, unknown>; defaultExport?: unknown }
  ): { restore(): void };
};

const mocks = [
  moduleMock.module('@/components/ui/select', {
    namedExports: {
      Select: ({ children, ...props }: React.ComponentProps<'select'>) => React.createElement('select', props, children),
      SelectTrigger: () => null,
      SelectValue: () => null,
      SelectContent: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
      SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => React.createElement('option', { value }, children),
    },
  }),
  moduleMock.module('@/lib/admin/i18n/server', {
    namedExports: {
      getAdminTranslations: async () => {
        translationLookups += 1;
        return translations;
      },
    },
  }),
  moduleMock.module('@/lib/prisma', {
    namedExports: {
      prisma: {
        category: {
          findMany: async (query: unknown) => {
            categoryQueries.push(query);
            return [{ slug: 'default-category', name: 'Default Category' }];
          },
        },
      },
    },
  }),
  moduleMock.module('../src/app/(admin)/admin/products/actions.ts', {
    namedExports: { createProductAction: creationAction },
  }),
];

type Category = { slug: string; name: string };
type NewProductPage = (props: {
  searchParams: Promise<{ error?: string }>;
}) => Promise<React.ReactElement>;
type CreateNewProductPage = (dependencies: {
  findCategories(): Promise<Category[]>;
  action(formData: FormData): void | Promise<void>;
}) => NewProductPage;

let createNewProductPage: CreateNewProductPage | undefined;
let defaultPage: NewProductPage | undefined;

test.before(async () => {
  const pageModule = await import('../src/app/(admin)/admin/products/new/page.tsx');
  createNewProductPage = pageModule.createNewProductPage;
  defaultPage = pageModule.default;
});

test.beforeEach(() => {
  translationLookups = 0;
  categoryQueries.length = 0;
});

test.after(() => {
  for (const moduleMock of mocks) moduleMock.restore();
});

async function renderFactoryPage(error?: string) {
  assert.ok(createNewProductPage, 'page must export createNewProductPage');
  let categoryLookups = 0;
  const NewProductPage = createNewProductPage({
    findCategories: async () => {
      categoryLookups += 1;
      return [
        { slug: 'office-chairs', name: 'Office Chairs' },
        { slug: 'standing-desks', name: 'Standing Desks' },
      ];
    },
    action: creationAction,
  });
  const markup = renderToStaticMarkup(
    await NewProductPage({ searchParams: Promise.resolve(error ? { error } : {}) })
  );

  return { markup, categoryLookups };
}

// Break caught: replacing the injected category lookup with unrelated data means the editor cannot choose a real category.
test('new Product page renders injected Categories and translated associated labels', async () => {
  const { markup, categoryLookups } = await renderFactoryPage();

  assert.equal(categoryLookups, 1);
  assert.equal(translationLookups, 1);
  assert.match(markup, /Office Chairs/);
  assert.match(markup, /Standing Desks/);
  assert.match(markup, /value="office-chairs"/);
  assert.match(markup, /value="standing-desks"/);
  assert.match(markup, /<label[^>]*for="name"[^>]*>Record name<\/label>/);
  assert.match(markup, /<label[^>]*for="categorySlug"[^>]*>Record category<\/label>/);
  assert.match(markup, /Create catalog record/);
});

// Break caught: a redirect error that is ignored or mapped to the wrong dictionary message leaves the editor without actionable feedback.
test('new Product page renders known and fallback creation errors in an alert', async () => {
  const known = await renderFactoryPage('invalid-input');
  assert.match(known.markup, /role="alert"/);
  assert.match(known.markup, /Creation rejected\. KNOWN_ERROR/);

  const fallback = await renderFactoryPage('unexpected');
  assert.match(fallback.markup, /role="alert"/);
  assert.match(fallback.markup, /Creation rejected\. FALLBACK_ERROR/);
});

// Break caught: default construction can silently disconnect the page from the production category query.
test('default new Product page uses the production category lookup configuration', async () => {
  assert.ok(defaultPage, 'page must provide the configured default component');

  const markup = renderToStaticMarkup(
    await defaultPage({ searchParams: Promise.resolve({}) })
  );

  assert.match(markup, /Default Category/);
  assert.deepEqual(categoryQueries, [
    { select: { slug: true, name: true }, orderBy: { name: 'asc' } },
  ]);
});

// Break caught: replacing the Radix form-control props with unassociated controls drops creation fields from submitted FormData.
test('new Product page keeps the shadcn control FormData contract', () => {
  const page = readFileSync(pagePath, 'utf8');

  const slugAutoFillFields = readFileSync(slugAutoFillFieldsPath, 'utf8');

  assert.match(page, /<form\s+action=\{action\}/);
  assert.match(page, /action:\s*createProductAction/);
  assert.match(page, /<SlugAutoFillFields\s+nameLabel=\{translations\.createProduct\.name\}\s+slugLabel=\{translations\.createProduct\.slug\}\s+slugHelp=\{translations\.createProduct\.slugHelp\}/);
  assert.match(slugAutoFillFields, /<Input[^>]*id="name"[^>]*name="name"[^>]*required/);
  assert.match(slugAutoFillFields, /<Input[\s\S]*id="slug"[\s\S]*name="slug"[\s\S]*required[\s\S]*pattern="\[a-z0-9\]\+\(-\[a-z0-9\]\+\)\*"/);
  assert.match(page, /<Select\s+name="categorySlug"\s+required/);
  assert.match(page, /<SelectItem\s+key=\{category\.slug\}\s+value=\{category\.slug\}/);
  assert.match(page, /<Textarea[^>]*id="description"[^>]*name="description"[^>]*required[^>]*rows=\{4\}/);
  assert.match(page, /<Input[^>]*id="imageUrl"[^>]*name="imageUrl"[^>]*type="url"[^>]*required/);
  assert.match(page, /<Checkbox[^>]*id="isSustainable"[^>]*name="isSustainable"[^>]*value="on"/);
});

// The Node test command has no DOM or React interaction harness; installed Radix sources provide the supplemental form-control evidence.
test('installed Radix Select and Checkbox create named native form controls', () => {
  const checkboxSource = readFileSync(checkboxSourcePath, 'utf8');
  const selectSource = readFileSync(selectSourcePath, 'utf8');

  assert.match(checkboxSource, /var BUBBLE_INPUT_NAME = "CheckboxBubbleInput"/);
  assert.match(checkboxSource, /type: "checkbox"[\s\S]*name,[\s\S]*value,[\s\S]*form,/);
  assert.match(selectSource, /var BUBBLE_INPUT_NAME = "SelectBubbleInput"/);
  assert.match(selectSource, /Primitive\.select[\s\S]*required,[\s\S]*name,[\s\S]*autoComplete,[\s\S]*disabled,[\s\S]*form,/);
});
