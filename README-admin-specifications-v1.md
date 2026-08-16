# Deskholt — Admin Specifications V1 Minimal

Mục tiêu duy nhất của module này: **để editor nhập 10 Standing Desks thật càng sớm càng tốt**.

Nó dựa trên các quyết định V1 đã khóa:

- `AttributeScope = PRODUCT | VARIANT | DERIVED`.
- `PRODUCT` không có `variantId`.
- `VARIANT` bắt buộc có `variantId`.
- `DERIVED` cho phép Product-level hoặc Variant-level.
- `ProductAttribute` dùng shared validator.
- Uniqueness thật do 2 PostgreSQL partial unique indexes đảm nhiệm.
- Không có Evidence/Score/Best-For/UseCase trong V1.
- Required là completeness concern, không chặn save Product draft.

## Files

```text
src/
├── app/(admin)/admin/products/[id]/specifications/
│   ├── page.tsx
│   └── actions.ts
├── components/admin/products/
│   └── ProductSpecificationsForm.tsx
└── lib/products/
    └── productAttributeValidator.ts  ← dùng file r2 đã chốt
```

## Cài vào repo

1. Copy `productAttributeValidator-r2.ts` đã chốt vào:

```text
src/lib/products/productAttributeValidator.ts
```

2. Copy 3 files trong bundle vào đúng paths ở trên.

3. Đảm bảo repo đã có Prisma singleton:

```text
src/lib/prisma.ts
```

và import alias `@/*` trỏ vào `src/*`.

4. Schema đang dùng phải là r3 và seed phải có 35 Standing Desk attributes.

5. Trước migration:

```bash
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate dev --name v1_alpha_product_intelligence
```

6. Review `migration.sql`, đảm bảo có 2 partial unique indexes:

```sql
CREATE UNIQUE INDEX "ProductAttribute_product_attribute_unique"
ON "ProductAttribute" ("productId", "attributeDefinitionId")
WHERE "variantId" IS NULL;

CREATE UNIQUE INDEX "ProductAttribute_variant_attribute_unique"
ON "ProductAttribute" ("variantId", "attributeDefinitionId")
WHERE "variantId" IS NOT NULL;
```

7. Seed:

```bash
npx prisma db seed
```

8. Tạo Product + ít nhất một Variant rồi mở:

```text
/admin/products/{id}/specifications
```

## Behavior

### PRODUCT

Render đúng 1 row / attribute.

### VARIANT

Render 1 row / active Variant / attribute.

Nếu Product chưa có Variant, UI cảnh báo tạo Variant trước.

### DERIVED

Render:

- 1 Product-level row;
- thêm 1 row cho mỗi active Variant.

Điều này cố ý để ontology test xác định Derived nên nằm ở đâu.

## Save behavior

Single form save toàn trang.

Mỗi row:

```text
Value
Source URL
Source Type
Confidence
```

- Blank hoàn toàn: không tạo record.
- Clear một row đã tồn tại: delete record.
- Có source nhưng không value: lỗi.
- `VERIFIED`: `verifiedAt = now()`.
- `LIKELY/UNVERIFIED`: `verifiedAt = null`.

Server action gọi `validateProductAttributeInput()` cho từng row có value trước khi ghi DB.

## Vì sao không dùng Prisma upsert ProductAttribute?

Hai uniqueness rules của `ProductAttribute` là PostgreSQL partial unique indexes:

```text
Product-level:
(productId, attributeDefinitionId) WHERE variantId IS NULL

Variant-level:
(variantId, attributeDefinitionId) WHERE variantId IS NOT NULL
```

Prisma không expose chúng như composite unique selector, nên action dùng:

```text
findFirst existing
→ update nếu có
→ create nếu chưa
```

trong một transaction.

Database vẫn là lớp cuối chặn duplicate bằng partial indexes.

## Completeness V1

UI tính đúng required targets hiện có:

- PRODUCT required = 1 target / attribute.
- VARIANT required = 1 target / active variant / attribute.
- DERIVED hiện không required.

Đây chỉ là V1 completeness, **không phải Deskholt Score hay Intelligence Health**.

## Không thêm trước Product #1

Không build thêm:

- Evidence engine.
- Score.
- Best-For.
- advanced filters.
- queue automation.
- beautiful dashboard.
- CSV Import UI.
- autosave.

Việc tiếp theo sau khi module chạy là **nhập Product #1**, không phải mở rộng Admin.
