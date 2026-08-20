import assert from 'node:assert/strict';
import test from 'node:test';
import { filterPublicDisplayRows, type SpecRow } from '../src/lib/products/specificationRows.ts';

function makeRow(overrides: Partial<SpecRow>): SpecRow {
  return {
    rowKey: 'row',
    attributeDefinitionId: 'def',
    variantId: null,
    variantLabel: null,
    scope: 'PRODUCT',
    dataType: 'DECIMAL',
    key: 'max_height_in',
    label: 'Maximum Height',
    unit: 'in',
    allowedValues: null,
    isRequired: true,
    existing: null,
    ...overrides,
  };
}

test('filterPublicDisplayRows keeps PRODUCT-scope rows with a saved value', () => {
  const rows = [
    makeRow({ scope: 'PRODUCT', existing: { valueString: null, valueNumber: 49.2, valueBoolean: null, sourceUrl: null, sourceType: null, confidence: 'VERIFIED' } }),
  ];
  assert.equal(filterPublicDisplayRows(rows, null).length, 1);
});

test('filterPublicDisplayRows drops rows with no existing value', () => {
  const rows = [makeRow({ scope: 'PRODUCT', existing: null })];
  assert.equal(filterPublicDisplayRows(rows, null).length, 0);
});

test('filterPublicDisplayRows keeps VARIANT rows only for the default variant', () => {
  const value = { valueString: null, valueNumber: 30, valueBoolean: null, sourceUrl: null, sourceType: null, confidence: 'VERIFIED' as const };
  const rows = [
    makeRow({ scope: 'VARIANT', variantId: 'variant-a', existing: value }),
    makeRow({ scope: 'VARIANT', variantId: 'variant-b', existing: value }),
  ];
  const result = filterPublicDisplayRows(rows, 'variant-a');
  assert.equal(result.length, 1);
  assert.equal(result[0].variantId, 'variant-a');
});

test('filterPublicDisplayRows excludes DERIVED rows', () => {
  const value = { valueString: null, valueNumber: null, valueBoolean: true, sourceUrl: null, sourceType: null, confidence: 'LIKELY' as const };
  const rows = [makeRow({ scope: 'DERIVED', existing: value })];
  assert.equal(filterPublicDisplayRows(rows, null).length, 0);
});

test('populated structured rows list means the public page renders the structured section', () => {
  const value = { valueString: null, valueNumber: 49.2, valueBoolean: null, sourceUrl: null, sourceType: null, confidence: 'VERIFIED' as const };
  const rows = [makeRow({ scope: 'PRODUCT', existing: value })];
  const structuredRows = filterPublicDisplayRows(rows, null);
  assert.ok(structuredRows.length > 0, 'non-empty structured rows should trigger the structured render branch');
});

test('zero structured rows means the public page falls back to the legacy specs block', () => {
  const rows = [makeRow({ scope: 'PRODUCT', existing: null })];
  const structuredRows = filterPublicDisplayRows(rows, null);
  assert.equal(structuredRows.length, 0, 'empty structured rows should trigger the legacy fallback branch');
});
