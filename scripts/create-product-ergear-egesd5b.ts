import { PrismaClient, type ProductStatus, type SourceType, type Confidence } from '@prisma/client';
import { validateProductAttributeInput } from '../src/lib/products/productAttributeValidator';
import { convertLengthToCanonicalInches } from '../src/lib/products/unitConversion';

const STOCK_IMAGE = 'https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=800&auto=format&fit=crop&q=80';
const PRODUCT_SLUG = 'ergear-egesd5b-standing-desk-black';
const SOURCE_URL = 'https://www.amazon.com/dp/B0B41YH9B6';
type Entry = { key: string; variantId: string | null; valueString?: string; valueNumber?: number; valueBoolean?: boolean };
const entries = (variantId: string): Entry[] => [
  { key: 'min_height_in', variantId: null, valueNumber: 28.35 }, { key: 'max_height_in', variantId: null, valueNumber: convertLengthToCanonicalInches(118, 'cm') },
  { key: 'max_load_lb', variantId: null, valueNumber: 176 }, { key: 'product_weight_lb', variantId: null, valueNumber: 43.8 }, { key: 'desktop_thickness_in', variantId: null, valueNumber: 0.67 },
  { key: 'adjustment_type', variantId: null, valueString: 'ELECTRIC' }, { key: 'memory_presets', variantId: null, valueNumber: 4 }, { key: 'frame_material', variantId: null, valueString: 'STEEL' },
  { key: 'desktop_shape', variantId: null, valueString: 'RECTANGULAR' }, { key: 'desktop_included', variantId: null, valueBoolean: true }, { key: 'desktop_width_in', variantId, valueNumber: 47.2 },
  { key: 'desktop_depth_in', variantId, valueNumber: 23.6 }, { key: 'desktop_material', variantId, valueString: 'ENGINEERED_WOOD' }, { key: 'desktop_finish', variantId, valueString: 'Laminated' }, { key: 'frame_color', variantId, valueString: 'Black' },
];

export async function createProductErgearEgesd5b(prisma: PrismaClient) {
  return prisma.$transaction(async (rawTx) => {
    const tx = rawTx as PrismaClient;
    const category = await tx.category.findUnique({ where: { slug: 'standing-desks' } });
    if (!category) throw new Error('Required Category "standing-desks" was not found; run the standing-desk attribute seed first.');
    const brand = await tx.brand.upsert({ where: { slug: 'ergear' }, update: { name: 'ErGear' }, create: { slug: 'ergear', name: 'ErGear' } });
    const product = await tx.product.upsert({ where: { slug: PRODUCT_SLUG }, update: productData(category.id, brand.id), create: { ...productData(category.id, brand.id), slug: PRODUCT_SLUG } });
    const found = await tx.productVariant.findFirst({ where: { product_id: product.id, sku: 'ergear-egesd5b-48x24-black' } });
    const variant = found ? await tx.productVariant.update({ where: { id: found.id }, data: { size: '48x24', color: 'Black', material: null, is_active: true } }) : await tx.productVariant.create({ data: { product_id: product.id, sku: 'ergear-egesd5b-48x24-black', size: '48x24', color: 'Black', is_active: true } });
    const prepared = [];
    const errors: string[] = [];
    for (const entry of entries(variant.id)) {
      const definition = await tx.attributeDefinition.findUnique({ where: { key: entry.key } });
      if (!definition) { errors.push(`${entry.key}: definition missing`); continue; }
      const input = { productId: product.id, variantId: entry.variantId, attributeDefinitionId: definition.id, valueString: entry.valueString ?? null, valueNumber: entry.valueNumber ?? null, valueBoolean: entry.valueBoolean ?? null };
      const result = await validateProductAttributeInput(tx, input);
      if (!result.valid) errors.push(`${entry.key}: ${result.errors.join('; ')}`); else prepared.push({ entry, definition });
    }
    if (errors.length) throw new Error(`ErGear attribute validation failed:\n${errors.join('\n')}`);
    for (const { entry, definition } of prepared) {
      const where = { product_id: product.id, attribute_definition_id: definition.id, variant_id: entry.variantId };
      const data = { ...where, value_string: entry.valueString ?? null, value_number: entry.valueNumber ?? null, value_boolean: entry.valueBoolean ?? null, source_url: SOURCE_URL, source_type: 'RETAILER' as SourceType, confidence: 'VERIFIED' as Confidence, verified_at: new Date() };
      const existing = await tx.productAttribute.findFirst({ where });
      if (existing) await tx.productAttribute.update({ where: { id: existing.id }, data }); else await tx.productAttribute.create({ data });
    }
    return product;
  });
}
function productData(categoryId: string, brandId: string) { return { name: 'ErGear 48 x 24 Inch Height Adjustable Electric Standing Desk (Black)', category: 'standing-desks', category_id: categoryId, brand_id: brandId, description: 'Electric height-adjustable standing desk with a 48 x 24 inch engineered-wood top, steel frame, and 176 lb weight capacity.', image_url: STOCK_IMAGE, upc_code: 'B0B41YH9B6', status: 'DRAFT' as ProductStatus, is_indexed: false, is_sustainable: false }; }
if (process.argv[1]?.endsWith('create-product-ergear-egesd5b.ts')) { const prisma = new PrismaClient(); createProductErgearEgesd5b(prisma).then((product) => console.log(`Product ready: ${product.slug} (${product.id})`)).catch((error) => { console.error('Create product failed:', error); process.exitCode = 1; }).finally(() => prisma.$disconnect()); }
