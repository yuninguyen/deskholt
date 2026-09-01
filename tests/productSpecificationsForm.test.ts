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

test('Specifications form renders clearable Boolean, ENUM, and source type options without synthetic values', async () => {
  const booleanKey = 'boolean-row';
  const enumKey = 'enum-row';
  const sourceTypeKey = 'source-type-row';
  const html = await render(makeData({
    rows: [
      { rowKey: booleanKey, attributeDefinitionId: 'boolean-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'BOOLEAN', key: 'has_motor', label: 'Has motor', unit: null, allowedValues: null, isRequired: false, existing: { valueString: null, valueNumber: null, valueBoolean: true, sourceUrl: null, sourceType: 'MANUFACTURER', confidence: 'VERIFIED' } },
      { rowKey: enumKey, attributeDefinitionId: 'enum-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'ENUM', key: 'finish', label: 'Finish', unit: null, allowedValues: ['BAMBOO'], isRequired: false, existing: { valueString: 'BAMBOO', valueNumber: null, valueBoolean: null, sourceUrl: null, sourceType: null, confidence: 'LIKELY' } },
      { rowKey: sourceTypeKey, attributeDefinitionId: 'source-type-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'STRING', key: 'material', label: 'Material', unit: null, allowedValues: null, isRequired: false, existing: { valueString: null, valueNumber: null, valueBoolean: null, sourceUrl: null, sourceType: 'RETAILER', confidence: 'UNVERIFIED' } },
    ],
  }));

  assert.match(html, new RegExp(`name="value__${booleanKey}"[\\s\\S]*?<option value="">—<\\/option>[\\s\\S]*?<option value="true" selected="">True<\\/option>`));
  assert.match(html, new RegExp(`name="value__${enumKey}"[\\s\\S]*?<option value="">—<\\/option>[\\s\\S]*?<option value="BAMBOO" selected="">BAMBOO<\\/option>`));
  assert.match(html, new RegExp(`name="sourceType__${sourceTypeKey}"[\\s\\S]*?<option value="">Source type<\\/option>[\\s\\S]*?<option value="RETAILER" selected="">Retailer<\\/option>`));
  assert.doesNotMatch(html, /value="empty"/);

  const blankHtml = await render(makeData({
    rows: [
      { rowKey: 'blank-boolean', attributeDefinitionId: 'blank-boolean-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'BOOLEAN', key: 'has_drawer', label: 'Has drawer', unit: null, allowedValues: null, isRequired: false, existing: null },
      { rowKey: 'blank-enum', attributeDefinitionId: 'blank-enum-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'ENUM', key: 'finish', label: 'Finish', unit: null, allowedValues: ['BAMBOO'], isRequired: false, existing: null },
      { rowKey: 'blank-source-type', attributeDefinitionId: 'blank-source-type-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'STRING', key: 'material', label: 'Material', unit: null, allowedValues: null, isRequired: false, existing: null },
    ],
  }));
  assert.match(blankHtml, /name="value__blank-boolean"[\s\S]*?<option value="" selected="">—<\/option>/);
  assert.match(blankHtml, /name="value__blank-enum"[\s\S]*?<option value="" selected="">—<\/option>/);
  assert.match(blankHtml, /name="sourceType__blank-source-type"[\s\S]*?<option value="" selected="">Source type<\/option>/);
});

test('Specifications form preserves in/cm and lb/kg source-unit defaults and invalid draft fallbacks', async () => {
  const source = await readFile(formSourcePath, 'utf8');

  assert.match(source, /name=\{`sourceUnit__\$\{row\.rowKey\}`\}/);
  assert.match(source, /draft\?\.sourceUnit === 'cm'\s*\? 'cm'\s*:\s*'in'/);
  assert.match(source, /draft\?\.sourceUnit === 'kg'\s*\? 'kg'\s*:\s*'lb'/);
  assert.match(source, /<SelectItem value="in">in<\/SelectItem>/);
  assert.match(source, /<SelectItem value="cm">cm<\/SelectItem>/);
  assert.match(source, /<SelectItem value="lb">lb<\/SelectItem>/);
  assert.match(source, /<SelectItem value="kg">kg<\/SelectItem>/);
});

test('Specifications form restores native clearable selects and delegates confidence state to a client leaf', async () => {
  const source = await readFile(formSourcePath, 'utf8');

  assert.match(source, /<select[\s\S]*name=\{`value__\$\{row\.rowKey\}`\}/);
  assert.match(source, /<option value="">\{translations\.emptyOption\}<\/option>/);
  assert.match(source, /<select[\s\S]*name=\{`sourceType__\$\{row\.rowKey\}`\}/);
  assert.doesNotMatch(source, /SelectItem value="empty"/);
  assert.match(source, /aria-invalid=\{staleEnumValue \? true : undefined\}/);
  assert.match(source, /from '\.\/SpecificationConfidenceSelect';/);
  assert.match(source, /<SpecificationConfidenceSelect/);
});

test('Confidence presentation maps every stored enum to its label and semantic Admin status variant', async () => {
  const confidenceModule = await import('../src/components/admin/products/SpecificationConfidenceSelect');
  const presentConfidence = (confidenceModule as { confidencePresentation?: (value: string, labels: Record<string, string>) => { label: string; variant: string } }).confidencePresentation;
  const labels = { VERIFIED: 'Verified', LIKELY: 'Likely', UNVERIFIED: 'Unverified' };

  assert.equal(typeof presentConfidence, 'function');
  assert.deepEqual(presentConfidence?.('VERIFIED', labels), { label: 'Verified', variant: 'success' });
  assert.deepEqual(presentConfidence?.('LIKELY', labels), { label: 'Likely', variant: 'warning' });
  assert.deepEqual(presentConfidence?.('UNVERIFIED', labels), { label: 'Unverified', variant: 'neutral' });
});

test('Confidence client leaf updates its Admin status label from Select changes while preserving the field name', async () => {
  const source = await readFile(
    new URL('../src/components/admin/products/SpecificationConfidenceSelect.tsx', import.meta.url),
    'utf8',
  );

  assert.match(source, /^'use client';/);
  assert.match(source, /useState<Confidence>\(defaultValue\)/);
  assert.match(source, /<Select name=\{name\} defaultValue=\{defaultValue\} onValueChange=\{\(value\) => setConfidence\(value as Confidence\)\}>/);
  assert.match(source, /<AdminStatusBadge variant=\{presentation\.variant\}/);
  assert.match(source, /const presentation = confidencePresentation\(confidence, labels\)/);
});

test('Specifications form resolves translations and retains the external inspection contract', async () => {
  const source = await readFile(formSourcePath, 'utf8');

  assert.match(source, /import \{ getAdminTranslations \} from '@\/lib\/admin\/i18n\/server';/);
  assert.match(source, /const translations = await getAdminTranslations\(\);/);
  assert.match(source, /import \{ Input \} from '@\/components\/ui\/input';/);
  assert.match(source, /import \{ AdminStatusBadge \} from '@\/components\/admin\/AdminStatusBadge';/);
  assert.match(source, /import \{\s*Select,/);
  assert.match(source, /border-b border-admin-border/);
  assert.match(source, /row\.isRequired && row\.scope !== 'DERIVED'/);
  assert.match(source, /row\.scope === 'DERIVED'/);
  assert.match(source, /tabular-nums/);
  assert.match(source, /<form action=\{action\}/);
  assert.match(source, /data: SpecificationData;/);
  assert.match(source, /draft\?: SpecificationDraftRows;/);
  assert.match(source, /action: \(formData: FormData\) => void \| Promise<void>;/);
});
