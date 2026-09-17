import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DIAGRAM_ROUTE_PREFIX,
  getDiagramEligibility,
  isDiagramUrl,
} from '../src/lib/products/productDiagram.ts';

test('isDiagramUrl recognizes only product diagram route URLs', () => {
  assert.equal(isDiagramUrl(`${DIAGRAM_ROUTE_PREFIX}example-standing-desk`), true);
  assert.equal(isDiagramUrl('https://m.media-amazon.com/images/I/example.jpg'), false);
  assert.equal(isDiagramUrl('https://images.unsplash.com/photo-example'), false);
  assert.equal(isDiagramUrl(''), false);
});

type AttributeFixture = {
  key: string;
  variantId: string | null;
  valueNumber?: number;
  valueString?: string;
  confidence?: 'VERIFIED' | 'LIKELY' | 'UNVERIFIED';
};

function diagramStore(attributes: AttributeFixture[], activeVariantId: string | null = 'variant-1') {
  return {
    productVariant: {
      findFirst: async () => activeVariantId === null ? null : { id: activeVariantId },
    },
    productAttribute: {
      findMany: async () => attributes.map((attribute) => ({
        variant_id: attribute.variantId,
        value_number: attribute.valueNumber ?? null,
        value_string: attribute.valueString ?? null,
        confidence: attribute.confidence ?? 'VERIFIED',
        attribute_definition: { key: attribute.key },
      })),
    },
  };
}

const completeAttributes: AttributeFixture[] = [
  { key: 'min_height_in', variantId: null, valueNumber: 28.3 },
  { key: 'max_height_in', variantId: null, valueNumber: 46.5 },
  { key: 'max_load_lb', variantId: null, valueNumber: 176 },
  { key: 'desktop_width_in', variantId: 'variant-1', valueNumber: 47.24 },
  { key: 'desktop_depth_in', variantId: 'variant-1', valueNumber: 23.64 },
  { key: 'frame_color', variantId: 'variant-1', valueString: 'Black' },
  { key: 'desktop_material', variantId: 'variant-1', valueString: 'ENGINEERED_WOOD' },
];

test('getDiagramEligibility returns dimensions from product scope and the first active variant', async () => {
  const result = await getDiagramEligibility('product-1', diagramStore(completeAttributes));

  assert.deepEqual(result, {
    eligible: true,
    dimensions: {
      desktopWidthIn: 47.24,
      desktopDepthIn: 23.64,
      minHeightIn: 28.3,
      maxHeightIn: 46.5,
      maxLoadLb: 176,
      frameColor: 'Black',
      desktopMaterial: 'ENGINEERED_WOOD',
    },
  });
});

test('getDiagramEligibility reports a missing required field', async () => {
  const result = await getDiagramEligibility(
    'product-1',
    diagramStore(completeAttributes.filter(({ key }) => key !== 'max_load_lb'))
  );

  assert.deepEqual(result, { eligible: false, missing: ['maxLoadLb'] });
});

test('getDiagramEligibility rejects a required field that is not VERIFIED', async () => {
  const attributes = completeAttributes.map((attribute) =>
    attribute.key === 'desktop_width_in' ? { ...attribute, confidence: 'LIKELY' as const } : attribute
  );

  const result = await getDiagramEligibility('product-1', diagramStore(attributes));

  assert.deepEqual(result, { eligible: false, missing: ['desktopWidthIn'] });
});

test('getDiagramEligibility reports both variant dimensions when no active variant exists', async () => {
  const result = await getDiagramEligibility('product-1', diagramStore(completeAttributes, null));

  assert.deepEqual(result, {
    eligible: false,
    missing: ['desktopWidthIn', 'desktopDepthIn'],
  });
});
