import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ProductSpecificationsForm from '../src/components/admin/products/ProductSpecificationsForm';
import type { SpecificationData } from '../src/lib/products/specificationRows';

function render(data: SpecificationData): string {
  return renderToStaticMarkup(
    React.createElement(ProductSpecificationsForm, {
      data,
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
