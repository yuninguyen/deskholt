// Deskholt — Seed: Standing Desk Attribute Engine v1-alpha.
//
// Run: npx tsx prisma/seed-standing-desk-attributes.ts
//
// Does 4 things, in order (idempotent via upsert — safe to re-run):
//   1. Creates Category "standing-desks" if missing.
//   2. Creates 35 AttributeDefinition rows if missing.
//   3. Links each attribute to the Category via CategoryAttribute (this is what
//      actually defines "the Standing Desk schema" — displayOrder = seed order).
//   4. Creates one default active ProductVariant for every existing Product whose
//      category is "standing-desks" and that has no Variant yet, so VARIANT-scope
//      attribute rows are immediately usable in the Admin form.
//
// This does NOT touch Product/AffiliateLink/Click/Conversion rows or fields.

import { PrismaClient, AttributeDataType, AttributeScope } from '@prisma/client';

const prisma = new PrismaClient();

type AttributeSeed = {
  key: string;
  label: string;
  scope: AttributeScope;
  dataType: AttributeDataType;
  unit?: string;
  isFilterable: boolean;
  isComparable: boolean;
  isRequired: boolean;
  allowedValues?: string[];
};

export const STANDING_DESK_ATTRIBUTES: AttributeSeed[] = [
  // --- Dimensions (Product-level) ---
  { key: 'min_height_in', label: 'Minimum Height', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in', isFilterable: true, isComparable: true, isRequired: true },
  { key: 'max_height_in', label: 'Maximum Height', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in', isFilterable: true, isComparable: true, isRequired: true },
  { key: 'max_load_lb', label: 'Maximum Load Capacity', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'lb', isFilterable: true, isComparable: true, isRequired: true },
  { key: 'product_weight_lb', label: 'Product Weight', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'lb', isFilterable: false, isComparable: true, isRequired: false },

  // --- Desktop dimensions (Variant-level) ---
  { key: 'desktop_width_in', label: 'Desktop Width', scope: 'VARIANT', dataType: 'DECIMAL', unit: 'in', isFilterable: true, isComparable: true, isRequired: true },
  { key: 'desktop_depth_in', label: 'Desktop Depth', scope: 'VARIANT', dataType: 'DECIMAL', unit: 'in', isFilterable: true, isComparable: true, isRequired: true },
  { key: 'desktop_thickness_in', label: 'Desktop Thickness', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in', isFilterable: false, isComparable: true, isRequired: false },

  // --- Mechanism (Product-level) ---
  {
    key: 'adjustment_type',
    label: 'Adjustment Type',
    scope: 'PRODUCT',
    dataType: 'ENUM',
    isFilterable: true,
    isComparable: true,
    isRequired: true,
    allowedValues: ['ELECTRIC', 'MANUAL_CRANK', 'PNEUMATIC', 'FIXED'],
  },
  { key: 'motor_count', label: 'Motor Count', scope: 'PRODUCT', dataType: 'INTEGER', isFilterable: true, isComparable: true, isRequired: false },
  { key: 'lifting_speed_in_s', label: 'Lifting Speed', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in/s', isFilterable: false, isComparable: true, isRequired: false },
  { key: 'noise_db', label: 'Noise Level', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'dB', isFilterable: false, isComparable: true, isRequired: false },
  { key: 'anti_collision', label: 'Anti-Collision', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'memory_presets', label: 'Memory Presets', scope: 'PRODUCT', dataType: 'INTEGER', isFilterable: false, isComparable: true, isRequired: false },

  // --- Frame (Product-level) ---
  { key: 'leg_count', label: 'Leg Count', scope: 'PRODUCT', dataType: 'INTEGER', isFilterable: true, isComparable: false, isRequired: false },
  {
    key: 'leg_design',
    label: 'Leg Design',
    scope: 'PRODUCT',
    dataType: 'ENUM',
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    allowedValues: ['SINGLE_LEG', 'DUAL_LEG', 'C_SHAPE', 'T_SHAPE'],
  },
  {
    key: 'frame_material',
    label: 'Frame Material',
    scope: 'PRODUCT',
    dataType: 'ENUM',
    isFilterable: true,
    isComparable: true,
    isRequired: false,
    allowedValues: ['STEEL', 'ALUMINUM'],
  },
  { key: 'frame_width_min_in', label: 'Frame Width (Min)', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in', isFilterable: false, isComparable: true, isRequired: false },
  { key: 'frame_width_max_in', label: 'Frame Width (Max)', scope: 'PRODUCT', dataType: 'DECIMAL', unit: 'in', isFilterable: false, isComparable: true, isRequired: false },
  { key: 'crossbar', label: 'Has Crossbar', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: false, isComparable: false, isRequired: false },
  { key: 'casters_compatible', label: 'Casters Compatible', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },

  // --- Desktop (mix Product/Variant) ---
  { key: 'desktop_included', label: 'Desktop Included', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: true },
  {
    key: 'desktop_shape',
    label: 'Desktop Shape',
    scope: 'PRODUCT',
    dataType: 'ENUM',
    isFilterable: true,
    isComparable: false,
    isRequired: false,
    allowedValues: ['RECTANGULAR', 'L_SHAPED', 'CURVED'],
  },
  {
    key: 'desktop_material',
    label: 'Desktop Material',
    scope: 'VARIANT',
    dataType: 'ENUM',
    isFilterable: true,
    isComparable: true,
    isRequired: false,
    allowedValues: ['MDF', 'BAMBOO', 'SOLID_WOOD', 'LAMINATE', 'ENGINEERED_WOOD'],
  },
  { key: 'desktop_finish', label: 'Desktop Finish', scope: 'VARIANT', dataType: 'STRING', isFilterable: false, isComparable: false, isRequired: false },
  { key: 'frame_color', label: 'Frame Color', scope: 'VARIANT', dataType: 'STRING', isFilterable: true, isComparable: false, isRequired: false },

  // --- Warranty & Certifications (Product-level) ---
  { key: 'warranty_months', label: 'Warranty', scope: 'PRODUCT', dataType: 'INTEGER', unit: 'months', isFilterable: true, isComparable: true, isRequired: false },
  { key: 'certification_greenguard', label: 'GREENGUARD Certified', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'certification_bifma', label: 'BIFMA Certified', scope: 'PRODUCT', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'assembly_time_minutes', label: 'Assembly Time', scope: 'PRODUCT', dataType: 'INTEGER', unit: 'minutes', isFilterable: false, isComparable: true, isRequired: false },

  // --- DERIVED / QUESTIONABLE — inferred judgments, not manufacturer facts. ---
  { key: 'monitor_arm_compatible', label: 'Monitor Arm Compatible', scope: 'DERIVED', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'dual_monitor_suitable', label: 'Dual Monitor Suitable', scope: 'DERIVED', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'ultrawide_suitable', label: 'Ultrawide Suitable', scope: 'DERIVED', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  { key: 'keyboard_tray_compatible', label: 'Keyboard Tray Compatible', scope: 'DERIVED', dataType: 'BOOLEAN', isFilterable: true, isComparable: false, isRequired: false },
  {
    key: 'assembly_difficulty',
    label: 'Assembly Difficulty',
    scope: 'DERIVED',
    dataType: 'ENUM',
    isFilterable: false,
    isComparable: true,
    isRequired: false,
    allowedValues: ['EASY', 'MODERATE', 'HARD'],
  },
  {
    key: 'stability_rating',
    label: 'Stability',
    scope: 'DERIVED',
    dataType: 'ENUM',
    isFilterable: false,
    isComparable: true,
    isRequired: false,
    allowedValues: ['LOW', 'MEDIUM', 'HIGH'],
  },
];

async function main() {
  console.log('Seeding: Standing Desk Attribute Engine v1-alpha');

  const category = await prisma.category.upsert({
    where: { slug: 'standing-desks' },
    update: {},
    create: {
      slug: 'standing-desks',
      name: 'Standing Desks',
      description: 'Height-adjustable standing desks for home and office workspaces.',
      is_active: true,
    },
  });
  console.log(`Category ready: ${category.name} (id=${category.id})`);

  for (let i = 0; i < STANDING_DESK_ATTRIBUTES.length; i++) {
    const attr = STANDING_DESK_ATTRIBUTES[i];

    const definition = await prisma.attributeDefinition.upsert({
      where: { key: attr.key },
      update: {
        label: attr.label,
        scope: attr.scope,
        data_type: attr.dataType,
        unit: attr.unit,
        is_filterable: attr.isFilterable,
        is_comparable: attr.isComparable,
        allowed_values: attr.allowedValues ?? undefined,
      },
      create: {
        key: attr.key,
        label: attr.label,
        scope: attr.scope,
        data_type: attr.dataType,
        unit: attr.unit,
        is_filterable: attr.isFilterable,
        is_comparable: attr.isComparable,
        allowed_values: attr.allowedValues ?? undefined,
      },
    });

    await prisma.categoryAttribute.upsert({
      where: {
        category_id_attribute_definition_id: {
          category_id: category.id,
          attribute_definition_id: definition.id,
        },
      },
      update: { is_required: attr.isRequired, display_order: i },
      create: {
        category_id: category.id,
        attribute_definition_id: definition.id,
        is_required: attr.isRequired,
        display_order: i,
      },
    });

    console.log(`  [${i + 1}/${STANDING_DESK_ATTRIBUTES.length}] ${attr.key}`);
  }

  const standingDeskProducts = await prisma.product.findMany({
    where: { category: 'standing-desks' },
    include: { variants: true },
  });

  for (const product of standingDeskProducts) {
    if (product.variants.length > 0) continue;
    const variant = await prisma.productVariant.create({
      data: { product_id: product.id, is_active: true, sku: `${product.slug}-default` },
    });
    console.log(`  Default variant created for ${product.name} (variantId=${variant.id})`);
  }

  console.log('Done. Standing Desk Attribute Engine v1-alpha seeded.');
}

if (process.argv[1]?.endsWith('seed-standing-desk-attributes.ts')) {
  main()
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
