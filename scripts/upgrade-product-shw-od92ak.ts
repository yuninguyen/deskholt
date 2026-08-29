import { PrismaClient, type Confidence, type SourceType } from '@prisma/client';
import { validateProductAttributeInput } from '../src/lib/products/productAttributeValidator';
import { convertLengthToCanonicalInches, convertMassToCanonicalPounds } from '../src/lib/products/unitConversion';

const PRODUCT_SLUG = 'shw-48in-standing-desk-drawer-black';
const VARIANT_SKU = 'shw-48in-standing-desk-drawer-black-default';
const SOURCE_URL = 'https://www.amazon.com/dp/B07MBR8N89';
type Entry = { key: string; variantId: string | null; valueString?: string; valueNumber?: number; valueBoolean?: boolean };

function entries(variantId: string): Entry[] {
  return [
    { key: 'min_height_in', variantId: null, valueNumber: 28 },
    { key: 'max_height_in', variantId: null, valueNumber: convertLengthToCanonicalInches(114, 'cm') },
    { key: 'max_load_lb', variantId: null, valueNumber: convertMassToCanonicalPounds(50, 'kg') },
    { key: 'desktop_thickness_in', variantId: null, valueNumber: 0.6 },
    { key: 'adjustment_type', variantId: null, valueString: 'ELECTRIC' },
    { key: 'frame_material', variantId: null, valueString: 'STEEL' },
    { key: 'desktop_shape', variantId: null, valueString: 'RECTANGULAR' },
    { key: 'desktop_included', variantId: null, valueBoolean: true },
    { key: 'desktop_width_in', variantId, valueNumber: 48 },
    { key: 'desktop_depth_in', variantId, valueNumber: 24 },
    { key: 'desktop_material', variantId, valueString: 'ENGINEERED_WOOD' },
    { key: 'desktop_finish', variantId, valueString: 'Laminated' },
    { key: 'frame_color', variantId, valueString: 'Black' },
  ];
}

export async function upgradeProductShwOd92ak(prisma: PrismaClient) {
  return prisma.$transaction(async (rawTx) => {
    const tx = rawTx as PrismaClient;
    const product = await tx.product.findUnique({ where: { slug: PRODUCT_SLUG } });
    if (!product) throw new Error(`Required Product "${PRODUCT_SLUG}" was not found; this upgrade only updates the existing legacy row.`);
    const category = await tx.category.findUnique({ where: { slug: 'standing-desks' } });
    if (!category) throw new Error('Required Category "standing-desks" was not found; run the standing-desk attribute seed first.');
    const brand = await tx.brand.upsert({ where: { slug: 'shw' }, update: { name: 'SHW' }, create: { slug: 'shw', name: 'SHW' } });
    await tx.product.update({ where: { id: product.id }, data: { category_id: category.id, brand_id: brand.id, upc_code: '811244032715' } });
    const variant = await tx.productVariant.findFirst({ where: { product_id: product.id, sku: VARIANT_SKU } });
    if (!variant) throw new Error(`Required existing ProductVariant for Product "${PRODUCT_SLUG}" was not found.`);
    await tx.productVariant.update({ where: { id: variant.id }, data: { size: '48-Inch', color: 'Black' } });
    const prepared: { entry: Entry; definition: { id: string } }[] = [];
    const errors: string[] = [];
    for (const entry of entries(variant.id)) {
      const definition = await tx.attributeDefinition.findUnique({ where: { key: entry.key } });
      if (!definition) { errors.push(`${entry.key}: definition missing`); continue; }
      const result = await validateProductAttributeInput(tx, { productId: product.id, variantId: entry.variantId, attributeDefinitionId: definition.id, valueString: entry.valueString ?? null, valueNumber: entry.valueNumber ?? null, valueBoolean: entry.valueBoolean ?? null });
      if (!result.valid) errors.push(`${entry.key}: ${result.errors.join('; ')}`); else prepared.push({ entry, definition });
    }
    if (errors.length) throw new Error(`SHW attribute validation failed:\n${errors.join('\n')}`);
    for (const { entry, definition } of prepared) {
      const where = { product_id: product.id, attribute_definition_id: definition.id, variant_id: entry.variantId };
      const data = { ...where, value_string: entry.valueString ?? null, value_number: entry.valueNumber ?? null, value_boolean: entry.valueBoolean ?? null, source_url: SOURCE_URL, source_type: 'RETAILER' as SourceType, confidence: 'VERIFIED' as Confidence, verified_at: new Date() };
      const existing = await tx.productAttribute.findFirst({ where });
      if (existing) await tx.productAttribute.update({ where: { id: existing.id }, data }); else await tx.productAttribute.create({ data });
    }
    const link = await tx.affiliateLink.findFirst({ where: { product_id: product.id, network: 'amazon' } });
    if (!link) throw new Error('Required existing Amazon AffiliateLink was not found.');
    await tx.affiliateLink.update({ where: { id: link.id }, data: { price: 159.87 } });
    return tx.product.findUniqueOrThrow({ where: { id: product.id } });
  });
}

if (process.argv[1]?.endsWith('upgrade-product-shw-od92ak.ts')) {
  const prisma = new PrismaClient();
  upgradeProductShwOd92ak(prisma).then((product) => console.log(`Product upgraded: ${product.slug} (${product.id})`)).catch((error) => { console.error('Upgrade product failed:', error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
}
