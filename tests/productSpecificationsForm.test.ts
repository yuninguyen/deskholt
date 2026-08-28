import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductSpecificationsForm from '../src/components/admin/products/ProductSpecificationsForm';
import type { SpecificationData } from '../src/lib/products/specificationRows';

function render(
  data: SpecificationData,
  draft?: Record<string, { value: string; sourceUrl: string; sourceType: string; confidence: string }>
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
