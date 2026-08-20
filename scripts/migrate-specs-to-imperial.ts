// One-time migration: renames the 10 standing-desk length/weight/speed
// AttributeDefinition rows from metric to imperial (key + unit), then converts
// the already-saved ProductAttribute.value_number rows tied to those
// definitions to the equivalent imperial number.
//
// UPDATEs rows in place (does not delete+recreate) so existing foreign keys
// from ProductAttribute/CategoryAttribute are preserved.
//
// Idempotent: safe to re-run. On a second run, each definition's old key no
// longer exists (it was already renamed to the new key), so that row's step 2
// (value conversion) is skipped rather than double-converting.
//
// Run: npx tsx scripts/migrate-specs-to-imperial.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Rename = {
  oldKey: string;
  newKey: string;
  newUnit: string;
  kind: 'length' | 'weight' | 'speed';
};

const RENAMES: Rename[] = [
  { oldKey: 'min_height_mm', newKey: 'min_height_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'max_height_mm', newKey: 'max_height_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'max_load_kg', newKey: 'max_load_lb', newUnit: 'lb', kind: 'weight' },
  { oldKey: 'product_weight_kg', newKey: 'product_weight_lb', newUnit: 'lb', kind: 'weight' },
  { oldKey: 'desktop_width_mm', newKey: 'desktop_width_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'desktop_depth_mm', newKey: 'desktop_depth_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'desktop_thickness_mm', newKey: 'desktop_thickness_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'lifting_speed_mm_s', newKey: 'lifting_speed_in_s', newUnit: 'in/s', kind: 'speed' },
  { oldKey: 'frame_width_min_mm', newKey: 'frame_width_min_in', newUnit: 'in', kind: 'length' },
  { oldKey: 'frame_width_max_mm', newKey: 'frame_width_max_in', newUnit: 'in', kind: 'length' },
];

// length/speed: mm -> in (divide by 25.4). weight: kg -> lb (multiply by 2.20462).
// Rounded to 1 decimal place, matching the precision editors use going forward.
function convert(kind: Rename['kind'], value: number): number {
  const converted = kind === 'weight' ? value * 2.20462 : value / 25.4;
  return Math.round(converted * 10) / 10;
}

async function main() {
  console.log('Migrating standing-desk specs to imperial canonical units...');

  let definitionsRenamed = 0;
  let definitionsAlreadyRenamed = 0;
  let valuesConverted = 0;

  for (const r of RENAMES) {
    // Step 1: rename the AttributeDefinition (key + unit) in place, preserving id.
    const existingOld = await prisma.attributeDefinition.findUnique({ where: { key: r.oldKey } });
    const existingNew = await prisma.attributeDefinition.findUnique({ where: { key: r.newKey } });

    let definitionId: string;

    if (existingOld) {
      const updated = await prisma.attributeDefinition.update({
        where: { key: r.oldKey },
        data: { key: r.newKey, unit: r.newUnit },
      });
      definitionId = updated.id;
      definitionsRenamed += 1;
      console.log(`  Renamed ${r.oldKey} -> ${r.newKey} (unit: ${r.newUnit})`);
    } else if (existingNew) {
      // Already renamed on a prior run — idempotent no-op, and its values were
      // already converted the first time this branch was reached as existingOld.
      definitionId = existingNew.id;
      definitionsAlreadyRenamed += 1;
      console.log(`  Already renamed: ${r.newKey} (skipping)`);
      continue;
    } else {
      console.warn(`  WARNING: neither ${r.oldKey} nor ${r.newKey} found — skipping`);
      continue;
    }

    // Step 2: convert existing ProductAttribute.value_number rows for this definition.
    // Only reached when existingOld was found above (i.e. first time this row is
    // migrated), so re-running the script never double-converts.
    const attrs = await prisma.productAttribute.findMany({
      where: { attribute_definition_id: definitionId, value_number: { not: null } },
    });
    for (const attr of attrs) {
      const oldValue = Number(attr.value_number);
      const newValue = convert(r.kind, oldValue);
      await prisma.productAttribute.update({
        where: { id: attr.id },
        data: { value_number: newValue },
      });
      valuesConverted += 1;
      console.log(`    ProductAttribute ${attr.id}: ${oldValue} -> ${newValue}`);
    }
  }

  console.log(
    `Done. ${definitionsRenamed} definitions renamed, ${definitionsAlreadyRenamed} already renamed (skipped), ${valuesConverted} ProductAttribute values converted.`
  );
}

main()
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
