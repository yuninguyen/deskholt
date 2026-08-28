// Shared row-enumeration logic for the Admin Specifications page and its
// Server Action. Both must agree on exactly which (attribute, variant)
// combinations are legitimate for a product — the action recomputes this
// from the database rather than trusting client-submitted ids, and reuses
// this module so the two stay in lock-step.

import { PrismaClient, AttributeScope, AttributeDataType, SourceType, Confidence } from '@prisma/client';

export type SpecRow = {
  rowKey: string;
  attributeDefinitionId: string;
  variantId: string | null;
  variantLabel: string | null;
  scope: AttributeScope;
  dataType: AttributeDataType;
  key: string;
  label: string;
  unit: string | null;
  allowedValues: string[] | null;
  isRequired: boolean;
  existing: {
    valueString: string | null;
    valueNumber: number | null;
    valueBoolean: boolean | null;
    sourceUrl: string | null;
    sourceType: SourceType | null;
    confidence: Confidence;
  } | null;
};

export function rowKeyOf(attributeDefinitionId: string, variantId: string | null): string {
  return `${attributeDefinitionId}__${variantId ?? 'p'}`;
}

export type SpecificationData = {
  product: { id: string; name: string; slug: string; category: string };
  categoryName: string;
  variants: { id: string; label: string; isActive: boolean }[];
  rows: SpecRow[];
  completeness: { met: number; total: number };
};

export async function loadSpecificationData(
  prisma: PrismaClient,
  productId: string
): Promise<SpecificationData | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      id: true,
      name: true,
      slug: true,
      category: true,
      category_id: true,
      category_ref: {
        include: {
          category_attributes: {
            include: { attribute_definition: true },
            orderBy: { display_order: 'asc' },
          },
        },
      },
    },
  });
  if (!product) return null;

  const category = product.category_id !== null
    ? product.category_ref
    : await prisma.category.findUnique({
        where: { slug: product.category },
        include: {
          category_attributes: {
            include: { attribute_definition: true },
            orderBy: { display_order: 'asc' },
          },
        },
      });
  if (!category) return null;

  const allVariants = await prisma.productVariant.findMany({
    where: { product_id: productId },
    orderBy: { created_at: 'asc' },
  });
  const activeVariants = allVariants.filter((v) => v.is_active);

  const existingAttributes = await prisma.productAttribute.findMany({
    where: { product_id: productId },
  });
  const existingByKey = new Map(
    existingAttributes.map((a) => [rowKeyOf(a.attribute_definition_id, a.variant_id), a])
  );

  const rows: SpecRow[] = [];
  let met = 0;
  let total = 0;

  for (const ca of category.category_attributes) {
    const def = ca.attribute_definition;
    const allowedValues = Array.isArray(def.allowed_values) ? (def.allowed_values as string[]) : null;

    const pushRow = (variantId: string | null, variantLabelText: string | null) => {
      const rowKey = rowKeyOf(def.id, variantId);
      const existing = existingByKey.get(rowKey);
      rows.push({
        rowKey,
        attributeDefinitionId: def.id,
        variantId,
        variantLabel: variantLabelText,
        scope: def.scope,
        dataType: def.data_type,
        key: def.key,
        label: def.label,
        unit: def.unit,
        allowedValues,
        isRequired: ca.is_required,
        existing: existing
          ? {
              valueString: existing.value_string,
              valueNumber: existing.value_number !== null ? Number(existing.value_number) : null,
              valueBoolean: existing.value_boolean,
              sourceUrl: existing.source_url,
              sourceType: existing.source_type,
              confidence: existing.confidence,
            }
          : null,
      });

      if (ca.is_required && def.scope !== 'DERIVED') {
        total += 1;
        if (existing) met += 1;
      }
    };

    if (def.scope === 'PRODUCT') {
      pushRow(null, null);
    } else if (def.scope === 'VARIANT') {
      for (const v of activeVariants) {
        pushRow(v.id, variantLabel(v));
      }
    } else {
      // DERIVED: one product-level row + one row per active variant.
      pushRow(null, null);
      for (const v of activeVariants) {
        pushRow(v.id, variantLabel(v));
      }
    }
  }

  return {
    product,
    categoryName: category.name,
    variants: allVariants.map((v) => ({ id: v.id, label: variantLabel(v), isActive: v.is_active })),
    rows,
    completeness: { met, total },
  };
}

function variantLabel(v: { sku: string | null; size: string | null; color: string | null; material: string | null }): string {
  return [v.size, v.color, v.material].filter(Boolean).join(' / ') || v.sku || 'Variant';
}

// Public product page display filter: keep only rows with a saved value, scoped to
// PRODUCT-level attributes plus VARIANT-level attributes for the given default variant.
// DERIVED rows are excluded (inferred judgments, not manufacturer facts — not shown publicly).
export function filterPublicDisplayRows(rows: SpecRow[], defaultVariantId: string | null): SpecRow[] {
  return rows.filter((row) => {
    if (row.existing === null) return false;
    const hasValue =
      row.existing.valueString !== null || row.existing.valueNumber !== null || row.existing.valueBoolean !== null;
    if (!hasValue) return false;
    if (row.scope === 'PRODUCT') return true;
    if (row.scope === 'VARIANT') return row.variantId === defaultVariantId;
    return false;
  });
}
