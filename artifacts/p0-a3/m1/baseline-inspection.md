# P0-A3 M1 Baseline Inspection

Date: 2026-08-27

## Artifact

```text
migration: prisma/migrations/20260827014500_baseline_existing_schema/migration.sql
SHA-256: 03d3378b0acb2ecde7d797b8061e485159c114ed64504f4f9ad0fa877565103f
lock: prisma/migrations/migration_lock.toml
provider: postgresql
```

## Inspection result

```text
pre-feature tables:                 10
pre-feature enums:                   4
approved ProductAttribute partial indexes: 2
ProductStatus enum:                 absent
products.status column:             absent
products.is_indexed default false:  absent
destructive SQL:                    absent
_prisma_migrations SQL:             absent
```

The baseline contains all current pre-P0-A3 tables, enums, constraints, ordinary indexes, foreign keys, and the two exact database-only partial unique indexes:

```sql
CREATE UNIQUE INDEX "product_attributes_product_attribute_unique"
ON "product_attributes" ("product_id", "attribute_definition_id")
WHERE "variant_id" IS NULL;

CREATE UNIQUE INDEX "product_attributes_variant_attribute_unique"
ON "product_attributes" ("variant_id", "attribute_definition_id")
WHERE "variant_id" IS NOT NULL;
```

The first inspection command used an overly broad text check that matched the existing `conversions.status` field and partial-index `false` predicate. The precise Product-table-scoped inspection was rerun and passed; no P0-A3 lifecycle field/default or backfill exists in the baseline.
