import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SpecificationData } from '../src/lib/products/specificationRows';

const productId = 'cm12345678901234567890';
const rowKey = 'cm22345678901234567890__p';
const draftRows = {
  [rowKey]: {
    value: '49.250',
    sourceUrl: 'not-yet-valid source',
    sourceType: 'MANUFACTURER',
    confidence: 'VERIFIED',
  },
};

const data: SpecificationData = {
  product: { id: productId, name: 'Test Desk', slug: 'test-desk', category: 'standing-desks' },
  categoryName: 'Standing Desks',
  variants: [],
  rows: [
    {
      rowKey,
      attributeDefinitionId: 'cm22345678901234567890',
      variantId: null,
      variantLabel: null,
      scope: 'PRODUCT',
      dataType: 'DECIMAL',
      key: 'max_height_in',
      label: 'Maximum Height',
      unit: 'in',
      allowedValues: null,
      isRequired: true,
      existing: {
        valueString: null,
        valueNumber: 48.5,
        valueBoolean: null,
        sourceUrl: 'https://existing.example/specs',
        sourceType: 'RETAILER',
        confidence: 'LIKELY',
      },
    },
  ],
  completeness: { met: 1, total: 1 },
};

const takeCalls: Array<{ productId: string; token: string }> = [];
let takeResult: typeof draftRows | null = null;
let formProps: Record<string, unknown> | null = null;

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports?: Record<string, unknown>; defaultExport?: unknown }
  ): { restore(): void };
};

const mocks = [
  moduleMock.module('next/navigation', {
    namedExports: { notFound: () => { throw new Error('NOT_FOUND'); } },
  }),
  moduleMock.module('next/link', {
    defaultExport: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
  }),
  moduleMock.module('@/lib/prisma', {
    namedExports: {
      prisma: { product: { findUnique: async () => ({ id: productId }) } },
    },
  }),
  moduleMock.module('@/lib/products/specificationRows', {
    namedExports: { loadSpecificationData: async () => data },
  }),
  moduleMock.module('@/components/admin/products/ProductSpecificationsForm', {
    defaultExport: (props: Record<string, unknown>) => {
      formProps = props;
      return null;
    },
  }),
];

type Page = typeof import('../src/app/(admin)/admin/products/[id]/specifications/page').default;
let createProductSpecificationsPage: ((dependencies: {
  takeDraft(productId: string, token: string): typeof draftRows | null;
}) => Page) | undefined;

test.before(async () => {
  const pageModule = await import('../src/app/(admin)/admin/products/[id]/specifications/page');
  createProductSpecificationsPage = (pageModule as unknown as {
    createProductSpecificationsPage?: typeof createProductSpecificationsPage;
  }).createProductSpecificationsPage;
});

test.beforeEach(() => {
  takeCalls.length = 0;
  takeResult = null;
  formProps = null;
});

test.after(() => {
  for (const module of mocks) module.restore();
});

async function renderPage(draft?: string) {
  assert.ok(createProductSpecificationsPage, 'page must export createProductSpecificationsPage for draft consumption');
  const ProductSpecificationsPage = createProductSpecificationsPage({
    takeDraft: (requestedProductId, token) => {
      takeCalls.push({ productId: requestedProductId, token });
      return takeResult;
    },
  });
  const element = await ProductSpecificationsPage({
    params: Promise.resolve({ id: productId }),
    searchParams: Promise.resolve(draft === undefined ? {} : { draft }),
  });
  renderToStaticMarkup(element);
  assert.ok(formProps);
  return formProps;
}

test('page consumes the opaque token for the awaited current Product and passes the draft to the form', async () => {
  takeResult = draftRows;

  const props = await renderPage('opaque_token_123');

  assert.deepEqual(takeCalls, [{ productId, token: 'opaque_token_123' }]);
  assert.deepEqual(props.draft, draftRows);
  assert.equal(props.data, data);
});

test('page falls back to existing data when the draft token is missing', async () => {
  const props = await renderPage();

  assert.deepEqual(takeCalls, []);
  assert.equal(props.draft, undefined);
  assert.equal(props.data, data);
});

for (const scenario of ['expired', 'wrong Product', 'already consumed']) {
  test(`page falls back to existing data when the draft token is ${scenario}`, async () => {
    takeResult = null;

    const props = await renderPage(`opaque_${scenario.replaceAll(' ', '_')}`);

    assert.deepEqual(takeCalls, [
      { productId, token: `opaque_${scenario.replaceAll(' ', '_')}` },
    ]);
    assert.ok(props.draft === undefined || props.draft === null);
    assert.equal(props.data, data);
  });
}
