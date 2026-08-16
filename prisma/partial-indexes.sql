-- Deskholt V1-alpha Attribute Engine — manual PostgreSQL partial unique indexes.
-- Prisma cannot express "unique per (product_id, attribute_definition_id) when
-- variant_id IS NULL, unique per (variant_id, attribute_definition_id) when NOT NULL"
-- as a single composite @@unique, so these are applied by hand after `prisma db push`.
-- Re-run via: npx prisma db execute --file prisma/partial-indexes.sql --schema prisma/schema.prisma

CREATE UNIQUE INDEX IF NOT EXISTS "product_attributes_product_attribute_unique"
ON "product_attributes" ("product_id", "attribute_definition_id")
WHERE "variant_id" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "product_attributes_variant_attribute_unique"
ON "product_attributes" ("variant_id", "attribute_definition_id")
WHERE "variant_id" IS NOT NULL;
