// ============================================================================
// DESKHOLT — SHARED VALIDATOR: ProductAttribute / MerchantProduct
//
// MỤC ĐÍCH: đây là "cổng gác" duy nhất kiểm tra dữ liệu trước khi ghi vào
// ProductAttribute hoặc MerchantProduct. Cả Admin UI (khi editor nhập tay)
// VÀ CSV Import (khi nhập hàng loạt) đều PHẢI gọi qua các hàm ở file này —
// không được viết logic kiểm tra riêng ở 2 nơi, vì rất dễ 2 chỗ lệch nhau
// theo thời gian.
//
// File này KHÔNG tự ghi vào database — chỉ trả về kết quả kiểm tra
// { valid, errors }. Người gọi (Admin server action / CSV import script) tự
// quyết định làm gì tiếp (chặn lưu, hiển thị lỗi cho editor, bỏ qua dòng CSV
// lỗi, v.v).
//
// Lý do cần file này (nhắc lại quyết định đã chốt):
// 1. Database không tự kiểm tra được "variant này có thuộc đúng product
//    không" — Prisma/PostgreSQL không chặn được việc gắn nhầm Variant của
//    sản phẩm A vào ProductAttribute của sản phẩm B.
// 2. Database cũng không tự kiểm tra được "đúng scope chưa" (VARIANT-scope
//    attribute mà không có variantId là sai) hay "đúng kiểu dữ liệu chưa"
//    (ENUM mà giá trị không nằm trong allowedValues là sai).
// 3. Database không tự biết AttributeDefinition đó có thực sự thuộc schema
//    Category của Product hiện tại hay không — validator phải kiểm tra qua
//    CategoryAttribute.
// 4. Giá trị số từ CSV/UI phải là số hữu hạn; NaN/Infinity bị từ chối.
//// ============================================================================

import { PrismaClient, AttributeDataType } from "@prisma/client";

// ----------------------------------------------------------------------
// Kết quả validate — dùng chung cho mọi hàm trong file này.
// ----------------------------------------------------------------------
export type ValidationResult = {
  valid: boolean;
  errors: string[]; // rỗng nếu valid = true
};

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ============================================================================
// PHẦN 1 — Validate ProductAttribute
// ============================================================================

// Input thô — giống hệt field sẽ ghi vào ProductAttribute, nhưng đây chỉ là
// object JS thường (chưa chắc đã đúng type), vì dữ liệu từ CSV import luôn
// là string trước khi được convert.
export type ProductAttributeInput = {
  productId: number;
  variantId?: number | null;
  attributeDefinitionId: number;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
};

/**
 * Kiểm tra 1 giá trị ProductAttribute có hợp lệ để lưu hay không.
 * Cần truyền `prisma` vào vì hàm này phải tra cứu AttributeDefinition
 * (để biết scope/dataType/allowedValues) và ProductVariant (để biết
 * variant đó thuộc product nào).
 */
export async function validateProductAttributeInput(
  prisma: PrismaClient,
  input: ProductAttributeInput
): Promise<ValidationResult> {
  const errors: string[] = [];

  // --- Bước 1: AttributeDefinition có tồn tại không? ---------------------
  const definition = await prisma.attributeDefinition.findUnique({
    where: { id: input.attributeDefinitionId },
  });

  if (!definition) {
    // Không tra cứu tiếp được nữa nếu attribute không tồn tại — dừng sớm.
    return fail(`attributeDefinitionId=${input.attributeDefinitionId} không tồn tại.`);
  }

  // --- Bước 1b: Attribute này có thuộc schema Category của Product không? ---
  // ProductAttribute chỉ có FK tới Product + AttributeDefinition, nên DB không
  // tự ngăn được việc gắn attribute của Category khác vào Product hiện tại.
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: {
      id: true,
      categoryId: true,
      category: {
        select: {
          slug: true,
          name: true,
        },
      },
    },
  });

  if (!product) {
    return fail(`productId=${input.productId} không tồn tại.`);
  }

  const categoryAttribute = await prisma.categoryAttribute.findUnique({
    where: {
      categoryId_attributeDefinitionId: {
        categoryId: product.categoryId,
        attributeDefinitionId: input.attributeDefinitionId,
      },
    },
    select: { id: true },
  });

  if (!categoryAttribute) {
    return fail(
      `Attribute "${definition.key}" không thuộc schema của category ` +
        `"${product.category.name}" (${product.category.slug}).`
    );
  }

  // --- Bước 2: Đúng scope chưa? -------------------------------------------
  // PRODUCT   → variantId phải để trống (null/undefined)
  // VARIANT   → variantId bắt buộc phải có
  // DERIVED   → linh hoạt, có hoặc không variantId đều được (tùy attribute
  //             derived đó áp dụng cho cả sản phẩm hay riêng từng biến thể)
  const hasVariant = input.variantId !== null && input.variantId !== undefined;

  if (definition.scope === "PRODUCT" && hasVariant) {
    errors.push(
      `Attribute "${definition.key}" có scope=PRODUCT nhưng lại được gán variantId. ` +
        `Attribute cấp Product không được gắn vào 1 Variant cụ thể.`
    );
  }

  if (definition.scope === "VARIANT" && !hasVariant) {
    errors.push(
      `Attribute "${definition.key}" có scope=VARIANT nên bắt buộc phải có variantId — ` +
        `không được nhập ở cấp Product chung chung.`
    );
  }

  // --- Bước 3: Nếu có variantId, variant đó có đúng thuộc product này không? ---
  if (hasVariant) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId! },
      select: { id: true, productId: true },
    });

    if (!variant) {
      errors.push(`variantId=${input.variantId} không tồn tại.`);
    } else if (variant.productId !== input.productId) {
      errors.push(
        `variantId=${input.variantId} thuộc productId=${variant.productId}, ` +
          `không phải productId=${input.productId} mà bạn đang nhập. ` +
          `Có thể bạn đang gán nhầm variant của sản phẩm khác.`
      );
    }
  }

  // --- Bước 4: Đúng đúng MỘT cột giá trị được điền, đúng kiểu dữ liệu ------
  const valueCheck = validateValueForDataType(definition.dataType, definition.allowedValues, {
    valueString: input.valueString ?? null,
    valueNumber: input.valueNumber ?? null,
    valueBoolean: input.valueBoolean ?? null,
  });

  if (!valueCheck.valid) {
    errors.push(...valueCheck.errors.map((e) => `[${definition.key}] ${e}`));
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

/**
 * Kiểm tra: đúng 1 trong 3 cột (valueString/valueNumber/valueBoolean) được
 * điền, đúng theo dataType, và nếu là ENUM thì giá trị phải nằm trong
 * allowedValues.
 */
function validateValueForDataType(
  dataType: AttributeDataType,
  allowedValues: unknown,
  values: { valueString: string | null; valueNumber: number | null; valueBoolean: boolean | null }
): ValidationResult {
  const filledColumns = [
    values.valueString !== null,
    values.valueNumber !== null,
    values.valueBoolean !== null,
  ].filter(Boolean).length;

  if (filledColumns === 0) {
    return fail("Chưa có giá trị nào được điền (valueString/valueNumber/valueBoolean đều trống).");
  }
  if (filledColumns > 1) {
    return fail(
      "Chỉ được điền đúng 1 trong 3 cột giá trị (valueString/valueNumber/valueBoolean), " +
        "hiện đang điền nhiều hơn 1 cột."
    );
  }

  switch (dataType) {
    case "DECIMAL":
      if (values.valueNumber === null) {
        return fail("dataType=DECIMAL nhưng valueNumber trống — phải điền số vào valueNumber.");
      }
      if (!Number.isFinite(values.valueNumber)) {
        return fail(
          `dataType=DECIMAL nhưng giá trị ${values.valueNumber} không phải số hữu hạn hợp lệ.`
        );
      }
      return ok();

    case "INTEGER":
      if (values.valueNumber === null) {
        return fail("dataType=INTEGER nhưng valueNumber trống — phải điền số vào valueNumber.");
      }
      if (!Number.isFinite(values.valueNumber)) {
        return fail(
          `dataType=INTEGER nhưng giá trị ${values.valueNumber} không phải số hữu hạn hợp lệ.`
        );
      }
      if (!Number.isInteger(values.valueNumber)) {
        return fail(`dataType=INTEGER nhưng giá trị ${values.valueNumber} không phải số nguyên.`);
      }
      return ok();

    case "BOOLEAN":
      if (values.valueBoolean === null) {
        return fail("dataType=BOOLEAN nhưng valueBoolean trống.");
      }
      return ok();

    case "STRING":
      if (values.valueString === null || values.valueString.trim() === "") {
        return fail("dataType=STRING nhưng valueString trống.");
      }
      return ok();

    case "ENUM": {
      if (values.valueString === null) {
        return fail("dataType=ENUM nhưng valueString trống.");
      }
      const allowed = Array.isArray(allowedValues) ? (allowedValues as string[]) : [];
      if (!allowed.includes(values.valueString)) {
        return fail(
          `dataType=ENUM nhưng giá trị "${values.valueString}" không nằm trong allowedValues ` +
            `[${allowed.join(", ")}].`
        );
      }
      return ok();
    }

    default:
      // Không nên xảy ra vì AttributeDataType là enum kín, nhưng giữ lại để
      // TypeScript và runtime đều an toàn nếu sau này thêm dataType mới mà
      // quên cập nhật hàm này.
      return fail(`dataType không xác định: ${dataType}`);
  }
}

// ============================================================================
// PHẦN 2 — Validate MerchantProduct (Product <-> Variant consistency)
// ============================================================================
// Đây là cùng 1 loại kiểm tra "variant có đúng thuộc product không" như ở
// ProductAttribute, nhưng áp dụng cho MerchantProduct — tách hàm riêng để
// dùng độc lập (Admin phần Offers không cần đụng tới AttributeDefinition).

export type MerchantProductInput = {
  productId: number;
  variantId?: number | null;
};

export async function validateMerchantProductInput(
  prisma: PrismaClient,
  input: MerchantProductInput
): Promise<ValidationResult> {
  if (input.variantId === null || input.variantId === undefined) {
    // Không gắn variant cụ thể — hợp lệ, MerchantProduct có thể match ở
    // cấp Product chung (vd merchant chỉ bán 1 size duy nhất).
    return ok();
  }

  const variant = await prisma.productVariant.findUnique({
    where: { id: input.variantId },
    select: { id: true, productId: true },
  });

  if (!variant) {
    return fail(`variantId=${input.variantId} không tồn tại.`);
  }

  if (variant.productId !== input.productId) {
    return fail(
      `variantId=${input.variantId} thuộc productId=${variant.productId}, ` +
        `không phải productId=${input.productId}.`
    );
  }

  return ok();
}

// ============================================================================
// PHẦN 3 — Tiện ích: gộp nhiều lỗi từ nhiều dòng (dùng cho CSV Import)
// ============================================================================
// Khi import CSV hàng loạt, mỗi dòng có thể lỗi độc lập. Hàm này giúp gom lại
// thành 1 báo cáo duy nhất thay vì dừng ngay ở dòng lỗi đầu tiên — để editor
// thấy hết lỗi 1 lần, sửa 1 lần, thay vì sửa từng dòng rồi import lại nhiều lần.
export type RowValidationReport = {
  rowIndex: number; // số dòng trong file CSV (để editor dễ tìm)
  result: ValidationResult;
};

export function summarizeRowErrors(reports: RowValidationReport[]): string[] {
  return reports
    .filter((r) => !r.result.valid)
    .flatMap((r) => r.result.errors.map((e) => `Dòng ${r.rowIndex}: ${e}`));
}
