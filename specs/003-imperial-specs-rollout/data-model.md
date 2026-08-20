# Phase 1 Data Model: Imperial Canonical Specs + Public Specs Rollout

No new tables/fields. This feature changes *values* in two existing tables and adds no schema migration.

## AttributeDefinition (existing — Prisma model, unchanged shape)

10 rows affected (all in category `standing-desks`). `key` and `unit` change; `id`, `scope`, `data_type` unchanged.

| Old key | New key | Old unit | New unit |
|---|---|---|---|
| `min_height_mm` | `min_height_in` | mm | in |
| `max_height_mm` | `max_height_in` | mm | in |
| `max_load_kg` | `max_load_lb` | kg | lb |
| `product_weight_kg` | `product_weight_lb` | kg | lb |
| `desktop_width_mm` | `desktop_width_in` | mm | in |
| `desktop_depth_mm` | `desktop_depth_in` | mm | in |
| `desktop_thickness_mm` | `desktop_thickness_in` | mm | in |
| `lifting_speed_mm_s` | `lifting_speed_in_s` | mm/s | in/s |
| `frame_width_min_mm` | `frame_width_min_in` | mm | in |
| `frame_width_max_mm` | `frame_width_max_in` | mm | in |

All other `AttributeDefinition` rows (25 of 35) are untouched — non-length/weight/speed units (dB, months, minutes, counts, enums, booleans).

## ProductAttribute (existing — Prisma model, unchanged shape)

8 existing rows (across 2 products) whose `attribute_definition_id` points to one of the 10 rows above have their `value_number` converted in place:

- length/speed rows: `new_value = old_value / 25.4` (mm → in)
- weight rows: `new_value = old_value * 2.20462` (kg → lb)
- rounded to 1 decimal place on write, matching the precision editors will use going forward.

All other `ProductAttribute` rows (15 of 23) are untouched.

## Product.specs (existing — Prisma field, unchanged)

Legacy JSON/text field. Not modified, not deleted. Remains the render source for any product whose `loadSpecificationData(productId)` call returns zero populated rows.

## Runtime shape consumed by the public page (new usage of existing type)

`SpecificationData.rows: SpecRow[]` from `src/lib/products/specificationRows.ts` (already defined, unchanged):

```ts
type SpecRow = {
  key: string;           // e.g. "desktop_width_in"
  label: string;          // e.g. "Desktop Width"
  unit: string | null;    // e.g. "in"
  scope: 'PRODUCT' | 'VARIANT' | 'DERIVED';
  existing: { valueNumber: number | null; valueString: string | null; valueBoolean: boolean | null; ... } | null;
};
```

Public page filters this to: `scope === 'PRODUCT'` rows, plus `scope === 'VARIANT'` rows for the product's default/first active variant, where `existing !== null` and at least one value field is non-null. If the resulting filtered list is empty, render the legacy `specsObj` block unchanged (current behavior, untouched).
