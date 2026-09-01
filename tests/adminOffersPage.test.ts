import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test, { mock } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { en } from '../src/lib/admin/i18n/en';
import { vi } from '../src/lib/admin/i18n/vi';

const pagePath = resolve(process.cwd(), 'src/app/(admin)/admin/products/[id]/offers/page.tsx');
const productId = 'cm12345678901234567890';
const createAction = async () => undefined;
const updateAction = async () => undefined;
const productQueries: unknown[] = [];
const offerQueries: unknown[] = [];

const moduleMock = mock as unknown as {
  module(
    specifier: string,
    options: { namedExports?: Record<string, unknown>; defaultExport?: unknown },
  ): { restore(): void };
};

const mocks = [
  moduleMock.module('next/link', {
    defaultExport: ({ children, href, ...props }: React.ComponentProps<'a'>) => React.createElement('a', { href, ...props }, children),
  }),
  moduleMock.module('next/navigation', {
    namedExports: { notFound: () => { throw new Error('NOT_FOUND'); } },
  }),
  moduleMock.module('@/lib/prisma', {
    namedExports: {
      prisma: {
        product: {
          findUnique: async (query: unknown) => {
            productQueries.push(query);
            return { id: productId, name: 'Test desk', category: 'Standing desks' };
          },
        },
        affiliateLink: {
          findMany: async (query: unknown) => {
            offerQueries.push(query);
            return [{
              id: 'link-1',
              network: 'amazon',
              price: 199.99,
              raw_url: 'https://shop.test/desk',
              is_in_stock: true,
              priority_order: 2,
            }];
          },
        },
      },
    },
  }),
  moduleMock.module('@/lib/admin/i18n/server', {
    namedExports: { getAdminTranslations: async () => en },
  }),
  moduleMock.module('@/components/ui/button', {
    namedExports: { Button: ({ children, ...props }: React.ComponentProps<'button'>) => React.createElement('button', props, children) },
  }),
  moduleMock.module('@/components/ui/card', {
    namedExports: {
      Card: ({ children, ...props }: React.ComponentProps<'div'>) => React.createElement('div', props, children),
      CardContent: ({ children, ...props }: React.ComponentProps<'div'>) => React.createElement('div', props, children),
      CardHeader: ({ children, ...props }: React.ComponentProps<'div'>) => React.createElement('div', props, children),
      CardTitle: ({ children, ...props }: React.ComponentProps<'h3'>) => React.createElement('h3', props, children),
    },
  }),
  moduleMock.module('@/components/ui/checkbox', {
    namedExports: { Checkbox: (props: React.ComponentProps<'input'>) => React.createElement('input', { ...props, type: 'checkbox' }) },
  }),
  moduleMock.module('@/components/ui/input', {
    namedExports: { Input: (props: React.ComponentProps<'input'>) => React.createElement('input', props) },
  }),
  moduleMock.module('@/components/ui/label', {
    namedExports: { Label: ({ children, ...props }: React.ComponentProps<'label'>) => React.createElement('label', props, children) },
  }),
  moduleMock.module('@/components/ui/select', {
    namedExports: {
      Select: ({ children, ...props }: React.ComponentProps<'select'>) => React.createElement('select', props, children),
      SelectContent: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
      SelectItem: ({ children, value }: { children: React.ReactNode; value: string }) => React.createElement('option', { value }, children),
      SelectTrigger: ({ children, ...props }: React.ComponentProps<'button'>) => React.createElement('button', props, children),
      SelectValue: () => null,
    },
  }),
  moduleMock.module('@/components/admin/AdminStatusBadge', {
    namedExports: { AdminStatusBadge: ({ children }: { children: React.ReactNode }) => React.createElement('span', null, children) },
  }),
  moduleMock.module('../src/app/(admin)/admin/products/[id]/offers/actions.ts', {
    namedExports: { createAffiliateLinkAction: createAction, updateAffiliateLinkAction: updateAction },
  }),
];

test.after(() => {
  for (const moduleMock of mocks) moduleMock.restore();
});

test('offers dictionaries preserve EN/VI shape and product offers action copy', () => {
  assert.deepEqual(Object.keys(en.offers).sort(), Object.keys(vi.offers).sort());
  assert.deepEqual(Object.keys(en.offers.networks).sort(), Object.keys(vi.offers.networks).sort());
  assert.equal(en.products.actions.offers, 'Offers');
  assert.equal(vi.products.actions.offers, 'Ưu đãi');
});

test('offers page renders translated product-scoped edit and create forms', async () => {
  const { default: OffersPage } = await import('../src/app/(admin)/admin/products/[id]/offers/page.tsx');
  const markup = renderToStaticMarkup(await OffersPage({
    params: Promise.resolve({ id: productId }),
    searchParams: Promise.resolve({ saved: '1', error: 'invalid-input' }),
  }));

  assert.ok(markup.includes(en.offers.title));
  assert.ok(markup.includes(en.offers.saved));
  assert.ok(markup.includes(en.offers.errors.invalidInput));
  assert.match(markup, /name="productId"[^>]*value="cm12345678901234567890"/);
  assert.match(markup, /name="linkId"[^>]*value="link-1"/);
  assert.match(markup, /name="network"[^>]*value="amazon"/);
  assert.match(markup, /<select[^>]*disabled/);
  assert.match(markup, /<option value="amazon" selected="">Amazon<\/option>/);
  assert.match(markup, /<select[^>]*name="network"[^>]*required/);
  assert.match(markup, /name="is_in_stock"[^>]*checked/);
  assert.doesNotMatch(markup, /tracking_url/);
  assert.deepEqual(productQueries, [{
    where: { id: productId },
    select: { id: true, name: true, category: true },
  }]);
  assert.deepEqual(offerQueries, [{ where: { product_id: productId }, orderBy: { priority_order: 'asc' } }]);
});

// Break caught: bypassing a missing product with an empty editor allows an invalid route to masquerade as an editable product.
test('offers page calls notFound when the requested product is missing', async () => {
  const pageSource = readFileSync(pagePath, 'utf8');

  assert.match(pageSource, /params:\s*Promise<\{ id: string \}>/);
  assert.match(pageSource, /searchParams:\s*Promise<\{ saved\?: string; error\?: string \}>/);
  assert.match(pageSource, /if \(!product\) \{\s*notFound\(\);\s*\}/);
});

// Break caught: breaking Radix's named form-control contract or exposing the derived tracking URL prevents safe offer creation/update.
test('offers page keeps server page and controlled Select form contracts', () => {
  const pageSource = readFileSync(pagePath, 'utf8');

  assert.match(pageSource, /export const dynamic = 'force-dynamic';/);
  assert.match(pageSource, /getAdminTranslations\(\)/);
  assert.match(pageSource, /affiliateLink\.findMany\(/);
  assert.match(pageSource, /orderBy:\s*\{ priority_order: 'asc' \}/);
  assert.match(pageSource, /<form\s+key=\{link\.id\}\s+action=\{updateAffiliateLinkAction\}/);
  assert.match(pageSource, /<form\s+action=\{createAffiliateLinkAction\}/);
  assert.match(pageSource, /<Input type="hidden" name="productId" value=\{product\.id\} \/>/);
  assert.match(pageSource, /<Input type="hidden" name="linkId" value=\{link\.id\} \/>/);
  assert.match(pageSource, /<Input type="hidden" name="network" value=\{link\.network\} \/>/);
  assert.match(pageSource, /<Select value=\{link\.network\} disabled>/);
  assert.match(pageSource, /<Select name="network" required>/);
  assert.match(pageSource, /<AdminStatusBadge variant=\{link\.is_in_stock \? 'success' : 'outline'\}>/);
  assert.match(pageSource, /translations\.offers\.networks\[link\.network as keyof typeof translations\.offers\.networks\]/);
  assert.doesNotMatch(pageSource, /tracking_url/);
  assert.doesNotMatch(pageSource, />\s*(Network|Price|Product URL|In stock|Priority|Add offer|Save)\s*</);
});
