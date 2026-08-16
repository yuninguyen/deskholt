-- DESKHOLT V1-ALPHA R2
-- Manual PostgreSQL additions after Prisma generates the migration.
-- Keep these statements inside the relevant prisma/migrations/.../migration.sql.

-- One product-level value per Product + Attribute.
CREATE UNIQUE INDEX "ProductAttribute_product_attribute_unique"
ON "ProductAttribute" ("productId", "attributeDefinitionId")
WHERE "variantId" IS NULL;

-- One variant-level value per Variant + Attribute.
CREATE UNIQUE INDEX "ProductAttribute_variant_attribute_unique"
ON "ProductAttribute" ("variantId", "attributeDefinitionId")
WHERE "variantId" IS NOT NULL;
