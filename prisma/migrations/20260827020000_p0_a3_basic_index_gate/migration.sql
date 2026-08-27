BEGIN;

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'ACTIVE', 'BLOCKED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "products"
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
  ALTER COLUMN "is_indexed" SET DEFAULT false;

-- Deterministic legacy normalization. Do not touch updated_at or other fields.
UPDATE "products"
SET "status" = 'ACTIVE',
    "is_indexed" = false;

COMMIT;
