# Implementation Plan: Admin Product Specifications (V1-alpha)

**Spec**: [spec.md](./spec.md) | **Constitution**: `.specify/memory/constitution.md`

## Technical Context

- **Stack**: Next.js App Router, TypeScript, Prisma, PostgreSQL (moved from SQLite this
  feature — Postgres 18 installed locally, `deskholt_user`/`deskholt_db` created, `.env`
  `DATABASE_URL` now connects successfully).
- **Existing tables kept untouched**: `Product` (String cuid id, flat `category` string),
  `AffiliateLink`, `Click`, `Conversion`.
- **New tables (additive)**: `Category`, `Brand`, `ProductVariant`, `AttributeDefinition`,
  `CategoryAttribute`, `ProductAttribute`. `ProductVariant.productId` and
  `ProductAttribute.productId` are `String` FKs to the existing `Product.id` — no change
  to `Product`'s primary key type. `Brand` is optional and unused by seed data for now
  (existing products don't reference a brand table).
- **Partial unique indexes**: added via raw SQL after `prisma db push`/`migrate`, per
  `v1-alpha-r2-partial-indexes.sql`, adapted to reference `Product`'s String id.
- **Admin auth**: minimal cookie/session gate on `/admin/*` (single shared password via
  env var + signed cookie) — flat, no roles, per Constitution Principle III. Explicitly
  marked as a placeholder to replace with real auth later; not a full auth system.
- **Save flow**: Server Action + `redirect()` after save, per Constitution Principle IV.

## Architecture Decisions

1. **Additive schema, not a rewrite.** Confirmed in spec.md Assumptions. This is the
   single biggest deviation from the pasted reference schema (`schema-v1-alpha-r3.prisma`
   uses Int ids and drops `Product.category`). Rationale: Constitution Principle I
   (`Product`/`AffiliateLink`/`Click`/`Conversion` MUST NOT be lost or corrupted) and
   CLAUDE.md's surgical-changes rule outweigh matching the reference schema byte-for-byte.
2. **One new `Category` row** ("Standing Desks", slug `standing-desks`) is created and
   used only by the new Attribute Engine tables. Existing `Product.category` (string)
   stays as the source of truth for public pages; a product is "in" the new Category by
   having its id referenced from a `ProductVariant`/`ProductAttribute`, matched at seed
   time by `category === "standing-desks"` (or equivalent existing slug).
3. **Validator module** (`src/lib/products/productAttributeValidator.ts`) ports
   `productAttributeValidator-r2.ts` almost as-is, with `productId`/`variantId` typed as
   `string` instead of `number` to match the existing `Product.id`/new `ProductVariant.id`
   types (ProductVariant gets a new String cuid id, for consistency with Product).
4. **Writes use find-then-update-or-create in a transaction**, never `upsert`, because the
   uniqueness rule is two partial indexes Prisma can't express as a composite unique.
5. **Admin UI scope**: single page, single Server Action, all attribute rows submitted
   together. No autosave, no per-row AJAX (Constitution Principle IV).

## Data Model Changes (Prisma)

Add to `prisma/schema.prisma`, keep everything existing unchanged:

```
enum AttributeScope { PRODUCT VARIANT DERIVED }
enum AttributeDataType { DECIMAL INTEGER STRING BOOLEAN ENUM }
enum SourceType { MANUFACTURER MANUAL RETAILER CERTIFICATION OTHER }
enum Confidence { VERIFIED LIKELY UNVERIFIED }

model Category { id, slug, name, description?, isActive, ... ; categoryAttributes[] }
model Brand { id, slug, name, ... } // unused by seed, reserved
model ProductVariant {
  id String @id @default(cuid())
  productId String
  product Product @relation(fields: [productId], references: [id])
  sku?, size?, color?, material?, isActive Boolean @default(true)
  productAttributes ProductAttribute[]
}
model AttributeDefinition { id, key @unique, label, scope, dataType, unit?, allowedValues Json?, ... }
model CategoryAttribute { id, categoryId, attributeDefinitionId, isRequired, displayOrder, @@unique([categoryId, attributeDefinitionId]) }
model ProductAttribute {
  id Int @id @default(autoincrement())
  productId String
  variantId String?
  attributeDefinitionId Int
  valueString?, valueNumber? Decimal, valueBoolean?
  sourceUrl?, sourceType?, confidence Confidence @default(UNVERIFIED), verifiedAt?
  product Product @relation(fields: [productId], references: [id])
  variant ProductVariant? @relation(fields: [variantId], references: [id])
  attributeDefinition AttributeDefinition @relation(fields: [attributeDefinitionId], references: [id])
}
```

Add `variants ProductVariant[]` and `productAttributes ProductAttribute[]` back-relations
to the existing `Product` model (additive fields only, no existing field touched).

Raw SQL after push (String-id adapted):

```sql
CREATE UNIQUE INDEX "ProductAttribute_product_attribute_unique"
ON "ProductAttribute" ("productId", "attributeDefinitionId") WHERE "variantId" IS NULL;

CREATE UNIQUE INDEX "ProductAttribute_variant_attribute_unique"
ON "ProductAttribute" ("variantId", "attributeDefinitionId") WHERE "variantId" IS NOT NULL;
```

## File Plan

```
prisma/schema.prisma                                          (edit, additive)
prisma/seed-standing-desk-attributes.ts                        (new — 35-attribute seed)
prisma/partial-indexes.sql                                     (new — manual index SQL)
src/lib/products/productAttributeValidator.ts                  (new — shared validator)
src/lib/admin/auth.ts                                          (new — minimal session gate)
src/middleware.ts                                               (edit or new — gate /admin/*)
src/app/(admin)/admin/login/page.tsx                            (new)
src/app/(admin)/admin/login/actions.ts                          (new)
src/app/(admin)/admin/products/page.tsx                         (new — minimal list/link)
src/app/(admin)/admin/products/[id]/specifications/page.tsx     (new)
src/app/(admin)/admin/products/[id]/specifications/actions.ts   (new — Server Action)
src/components/admin/products/ProductSpecificationsForm.tsx     (new)
```

## Out of Scope (explicit, per spec.md)

Evidence engine, Score, Best-For, Merchant/MerchantProduct/Offer, CSV import UI, autosave,
full admin design system, role-based permissions.
