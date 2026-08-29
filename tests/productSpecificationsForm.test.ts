import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductSpecificationsForm from '../src/components/admin/products/ProductSpecificationsForm';
import type { SpecificationData } from '../src/lib/products/specificationRows';

function render(
  data: SpecificationData,
  draft?: Record<
    string,
    { value: string; sourceUrl: string; sourceType: string; confidence: string; sourceUnit?: string }
  >
): string {
  return renderToStaticMarkup(
    React.createElement(ProductSpecificationsForm, {
      data,
      draft,
      action: async () => {},
    })
  );
}

function makeData(overrides: Partial<SpecificationData> = {}): SpecificationData {
  return {
    product: {
      id: 'cm12345678901234567890',
      name: 'Test Standing Desk',
      slug: 'test-standing-desk',
      category: 'standing-desks',
    },
    categoryName: 'Standing Desks',
    variants: [],
    rows: [],
    completeness: { met: 0, total: 0 },
    ...overrides,
  };
}

test('Specifications form warns when the Product has no Variants', () => {
  const html = render(makeData());

  assert.match(html, /chưa có Variant/i);
  assert.match(html, /tạo Variant trước/i);
});

test('Specifications form warns when every existing Variant is inactive', () => {
  const html = render(
    makeData({
      variants: [
        {
          id: 'cm09876543210987654321',
          label: 'Inactive default',
          isActive: false,
        },
      ],
    })
  );

  assert.match(html, /không có Variant đang hoạt động/i);
  assert.match(html, /tạo hoặc kích hoạt Variant/i);
});

test('Specifications form does not show the missing-active-Variant warning when one is active', () => {
  const html = render(
    makeData({
      variants: [
        {
          id: 'cm09876543210987654321',
          label: 'Active default',
          isActive: true,
        },
      ],
    })
  );

  assert.doesNotMatch(html, /không có Variant đang hoạt động/i);
});

test('Specifications form preserves and flags a stored ENUM value removed from allowedValues', () => {
  const html = render(
    makeData({
      rows: [
        {
          rowKey: 'cm22345678901234567890__p',
          attributeDefinitionId: 'cm22345678901234567890',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'ENUM',
          key: 'adjustment_type',
          label: 'Adjustment Type',
          unit: null,
          allowedValues: ['ELECTRIC', 'MANUAL_CRANK'],
          isRequired: true,
          existing: {
            valueString: 'PNEUMATIC',
            valueNumber: null,
            valueBoolean: null,
            sourceUrl: null,
            sourceType: null,
            confidence: 'VERIFIED',
          },
        },
      ],
    })
  );

  assert.match(html, /<option value="PNEUMATIC" selected="">PNEUMATIC \(stored value — no longer allowed\)<\/option>/);
  assert.match(html, /Giá trị ENUM đã lưu không còn nằm trong danh sách cho phép/i);
  assert.match(html, /role="alert"/);
});

test('Specifications form renders source-unit selectors only for inch rows', () => {
  const html = render(
    makeData({
      rows: [
        {
          rowKey: 'inch-row',
          attributeDefinitionId: 'inch-definition',
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
        },
        {
          rowKey: 'cm-row',
          attributeDefinitionId: 'cm-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'DECIMAL',
          key: 'max_height_cm',
          label: 'Maximum Height Metric',
          unit: 'cm',
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
        {
          rowKey: 'unitless-row',
          attributeDefinitionId: 'unitless-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'STRING',
          key: 'finish',
          label: 'Finish',
          unit: null,
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
        {
          rowKey: 'string-inch-row',
          attributeDefinitionId: 'string-inch-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'STRING',
          key: 'material_note',
          label: 'Material Note',
          unit: 'in',
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
        {
          rowKey: 'enum-inch-row',
          attributeDefinitionId: 'enum-inch-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'ENUM',
          key: 'finish_type',
          label: 'Finish Type',
          unit: 'in',
          allowedValues: ['MDF', 'BAMBOO'],
          isRequired: false,
          existing: null,
        },
        {
          rowKey: 'boolean-inch-row',
          attributeDefinitionId: 'boolean-inch-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'BOOLEAN',
          key: 'has_motor',
          label: 'Has Motor',
          unit: 'in',
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
      ],
    })
  );

  assert.match(html, /name="sourceUnit__inch-row"/);
  assert.match(
    html,
    /name="sourceUnit__inch-row"[\s\S]*?<option value="in" selected="">in<\/option>[\s\S]*?<option value="cm">cm<\/option>/
  );
  assert.doesNotMatch(html, /name="sourceUnit__cm-row"/);
  assert.doesNotMatch(html, /name="sourceUnit__unitless-row"/);
  assert.doesNotMatch(html, /name="sourceUnit__string-inch-row"/);
  assert.doesNotMatch(html, /name="sourceUnit__enum-inch-row"/);
  assert.doesNotMatch(html, /name="sourceUnit__boolean-inch-row"/);
});

test('Specifications form renders pound selectors defaulting to lb', () => {
  const html = render(
    makeData({
      rows: [{
        rowKey: 'pound-row', attributeDefinitionId: 'pound-definition', variantId: null, variantLabel: null,
        scope: 'PRODUCT', dataType: 'DECIMAL', key: 'max_load_lb', label: 'Maximum Load', unit: 'lb',
        allowedValues: null, isRequired: true, existing: null,
      }],
    })
  );

  assert.match(html, /name="sourceUnit__pound-row"[\s\S]*?<option value="lb" selected="">lb<\/option>[\s\S]*?<option value="kg">kg<\/option>/);
});

test('Specifications form preserves valid pound draft units and defaults invalid values to lb', () => {
  const html = render(
    makeData({
      rows: [
        { rowKey: 'valid-pound-row', attributeDefinitionId: 'valid-pound-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'DECIMAL', key: 'max_load_lb', label: 'Load', unit: 'lb', allowedValues: null, isRequired: false, existing: null },
        { rowKey: 'invalid-pound-row', attributeDefinitionId: 'invalid-pound-definition', variantId: null, variantLabel: null, scope: 'PRODUCT', dataType: 'DECIMAL', key: 'product_weight_lb', label: 'Weight', unit: 'lb', allowedValues: null, isRequired: false, existing: null },
      ],
    }),
    {
      'valid-pound-row': { value: '10', sourceUrl: '', sourceType: '', confidence: 'UNVERIFIED', sourceUnit: 'kg' },
      'invalid-pound-row': { value: '5', sourceUrl: '', sourceType: '', confidence: 'UNVERIFIED', sourceUnit: 'oz' },
    }
  );

  assert.match(html, /name="sourceUnit__valid-pound-row"[\s\S]*?<option value="kg" selected="">kg<\/option>/);
  assert.match(html, /name="sourceUnit__invalid-pound-row"[\s\S]*?<option value="lb" selected="">lb<\/option>/);
});

test('Specifications form preserves a valid draft source unit and defaults invalid values to inches', () => {
  const html = render(
    makeData({
      rows: [
        {
          rowKey: 'metric-draft-row',
          attributeDefinitionId: 'metric-draft-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'DECIMAL',
          key: 'width_in',
          label: 'Width',
          unit: 'in',
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
        {
          rowKey: 'invalid-draft-row',
          attributeDefinitionId: 'invalid-draft-definition',
          variantId: null,
          variantLabel: null,
          scope: 'PRODUCT',
          dataType: 'DECIMAL',
          key: 'depth_in',
          label: 'Depth',
          unit: 'in',
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
      ],
    }),
    {
      'metric-draft-row': { value: '10', sourceUrl: '', sourceType: '', confidence: 'UNVERIFIED', sourceUnit: 'cm' },
      'invalid-draft-row': { value: '5', sourceUrl: '', sourceType: '', confidence: 'UNVERIFIED', sourceUnit: 'mm' },
    }
  );

  assert.match(html, /name="sourceUnit__metric-draft-row"[\s\S]*?<option value="cm" selected="">cm<\/option>/);
  assert.match(html, /name="sourceUnit__invalid-draft-row"[\s\S]*?<option value="in" selected="">in<\/option>/);
});

test('Specifications form merges exact draft strings over existing and blank rows across Product and Variant sections', () => {
  const productRowKey = 'cm22345678901234567890__p';
  const variantId = 'cm09876543210987654321';
  const variantRowKey = `cm33333333333333333333__${variantId}`;
  const html = render(
    makeData({
      variants: [{ id: variantId, label: 'Walnut top', isActive: true }],
      rows: [
        {
          rowKey: productRowKey,
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
            sourceUrl: 'https://existing.example/product',
            sourceType: 'RETAILER',
            confidence: 'LIKELY',
          },
        },
        {
          rowKey: variantRowKey,
          attributeDefinitionId: 'cm33333333333333333333',
          variantId,
          variantLabel: 'Walnut top',
          scope: 'VARIANT',
          dataType: 'STRING',
          key: 'finish',
          label: 'Finish',
          unit: null,
          allowedValues: null,
          isRequired: false,
          existing: null,
        },
      ],
    }),
    {
      [productRowKey]: {
        value: '49.250',
        sourceUrl: 'not-yet-valid product source',
        sourceType: 'MANUFACTURER',
        confidence: 'VERIFIED',
      },
      [variantRowKey]: {
        value: 'Draft Walnut',
        sourceUrl: 'https://draft.example/variant?raw=1&keep=2',
        sourceType: 'CERTIFICATION',
        confidence: 'LIKELY',
      },
    }
  );

  assert.match(html, new RegExp(`name="value__${productRowKey}"[^>]*value="49.250"`));
  assert.match(html, new RegExp(`name="sourceUrl__${productRowKey}"[^>]*value="not-yet-valid product source"`));
  assert.match(html, /<option value="MANUFACTURER" selected="">MANUFACTURER<\/option>/);
  assert.match(html, /<option value="VERIFIED" selected="">VERIFIED<\/option>/);
  assert.doesNotMatch(html, /value="48\.5"|https:\/\/existing\.example\/product/);

  assert.match(html, new RegExp(`name="value__${variantRowKey}"[^>]*value="Draft Walnut"`));
  assert.match(
    html,
    new RegExp(`name="sourceUrl__${variantRowKey}"[^>]*value="https://draft.example/variant\\?raw=1&amp;keep=2"`)
  );
  assert.match(
    html,
    new RegExp(
      `name="sourceType__${variantRowKey}"(?:(?!<\\/select>)[\\s\\S])*?<option value="CERTIFICATION" selected="">CERTIFICATION<\\/option>(?:(?!<\\/select>)[\\s\\S])*?<\\/select>`
    )
  );
  assert.match(
    html,
    new RegExp(
      `name="confidence__${variantRowKey}"(?:(?!<\\/select>)[\\s\\S])*?<option value="LIKELY" selected="">LIKELY<\\/option>(?:(?!<\\/select>)[\\s\\S])*?<\\/select>`
    )
  );
});
