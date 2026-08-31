import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test, { mock } from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { en } from '../src/lib/admin/i18n/en';
import type { SpecificationData } from '../src/lib/products/specificationRows';

const formSourcePath = new URL('../src/components/admin/products/ProductSpecificationsForm.tsx', import.meta.url);
const moduleMock = mock as unknown as {
  module(specifier: string, options: { namedExports?: Record<string, unknown> }): { restore(): void };
};
const translationMock = moduleMock.module('@/lib/admin/i18n/server', {
  namedExports: { getAdminTranslations: async () => en },
});
let ProductSpecificationsForm: typeof import('../src/components/admin/products/ProductSpecificationsForm').default;

test.before(async () => {
  ProductSpecificationsForm = (await import('../src/components/admin/products/ProductSpecificationsForm')).default;
});
test.after(() => translationMock.restore());

function makeData(overrides: Partial<SpecificationData> = {}): SpecificationData {
  return {
    product: { id: 'product-1', name: 'Test Desk', slug: 'test-desk', category: 'standing-desks' },
    categoryName: 'Standing Desks',
    variants: [],
    rows: [],
    completeness: { met: 0, total: 0 },
    ...overrides,
  };
}

async function render(data: SpecificationData, draft?: Record<string, { value: string; sourceUrl: string; sourceType: string; confidence: string; sourceUnit?: string }>) {
  return renderToStaticMarkup(await ProductSpecificationsForm({ data, draft, action: async () => {} }));
}

test('Specifications form preserves row field names, draft defaults, stale ENUM accessibility, and active variants', async () => {
  const variantId = 'active-variant';
  const productKey = 'enum-product-row';
  const numericKey = 'numeric-product-row';
  const variantKey = 'variant-row';
  const html = await render(
    makeData({
      variants: [{ id: variantId, label: 'Walnut', isActive: true }, { id: 'inactive-variant', label: 'Hidden', isActive: false }],
      rows: [
        { rowKey: productKey, attributeDefinitionId: 'enum-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'ENUM', key: 'adjustment', label: 'Adjustment', unit: null, allowedValues: ['ELECTRIC'], isRequired: true, existing: { valueString: 'PNEUMATIC', valueNumber: null, valueBoolean: null, sourceUrl: null, sourceType: null, confidence: 'VERIFIED' } },
        { rowKey: numericKey, attributeDefinitionId: 'numeric-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'DECIMAL', key: 'height', label: 'Height', unit: 'in', allowedValues: null, isRequired: true, existing: null },
        { rowKey: variantKey, attributeDefinitionId: 'variant-definition', variantId, variantLabel: 'Walnut', scope: 'VARIANT', dataType: 'STRING', key: 'finish', label: 'Finish', unit: null, allowedValues: null, isRequired: false, existing: null },
      ],
    }),
    {
      [numericKey]: { value: '49.250', sourceUrl: 'https://draft.example/source', sourceType: 'MANUFACTURER', confidence: 'LIKELY', sourceUnit: 'cm' },
      [variantKey]: { value: 'Draft Walnut', sourceUrl: '', sourceType: '', confidence: 'UNVERIFIED' },
    },
  );

  for (const name of [`value__${productKey}`, `sourceUrl__${productKey}`, `sourceType__${productKey}`, `confidence__${productKey}`, `value__${numericKey}`, `sourceUnit__${numericKey}`, `value__${variantKey}`]) {
    assert.match(html, new RegExp(`name="${name}"`));
  }
  assert.match(html, /name="productId" value="product-1"/);
  assert.match(html, new RegExp(`name="value__${numericKey}"[^>]*value="49.250"`));
  assert.match(html, new RegExp(`name="sourceUrl__${numericKey}"[^>]*value="https://draft.example/source"`));
  assert.match(html, /step="any"/);
  assert.match(html, /aria-invalid="true"/);
  assert.match(html, /aria-describedby="enum-product-row-stale-enum"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /Walnut/);
  assert.doesNotMatch(html, /Hidden/);
});

test('Specifications form resolves translations and retains the external inspection contract', async () => {
  const source = await readFile(formSourcePath, 'utf8');

  assert.match(source, /import \{ getAdminTranslations \} from '@\/lib\/admin\/i18n\/server';/);
  assert.match(source, /const translations = await getAdminTranslations\(\);/);
  assert.match(source, /import \{ Input \} from '@\/components\/ui\/input';/);
  assert.match(source, /import \{ Badge \} from '@\/components\/ui\/Badge';/);
  assert.match(source, /import \{\s*Select,/);
  assert.match(source, /border-b border-admin-border/);
  assert.match(source, /tabular-nums/);
  assert.match(source, /<form action=\{action\}/);
  assert.match(source, /data: SpecificationData;/);
  assert.match(source, /draft\?: SpecificationDraftRows;/);
  assert.match(source, /action: \(formData: FormData\) => void \| Promise<void>;/);
});
