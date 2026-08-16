// Shared validator for ProductAttribute writes. Admin UI and future CSV import
// must both go through this module so scope/type/category rules never drift
// between the two entry points (see specs/001-admin-product-specifications).
//
// Does NOT write to the database — callers decide what to do with the result
// (block the save, show per-row errors, skip a bad CSV row, etc).

import { PrismaClient, AttributeDataType } from '@prisma/client';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
};

function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

export type ProductAttributeInput = {
  productId: string;
  variantId?: string | null;
  attributeDefinitionId: string;
  valueString?: string | null;
  valueNumber?: number | null;
  valueBoolean?: boolean | null;
};

export async function validateProductAttributeInput(
  prisma: PrismaClient,
  input: ProductAttributeInput
): Promise<ValidationResult> {
  const errors: string[] = [];

  const definition = await prisma.attributeDefinition.findUnique({
    where: { id: input.attributeDefinitionId },
  });

  if (!definition) {
    return fail(`attributeDefinitionId=${input.attributeDefinitionId} không tồn tại.`);
  }

  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    select: { id: true, category: true },
  });

  if (!product) {
    return fail(`productId=${input.productId} không tồn tại.`);
  }

  const category = await prisma.category.findUnique({
    where: { slug: product.category },
    select: { id: true, name: true },
  });

  if (!category) {
    return fail(`Category "${product.category}" chưa được khai báo trong Attribute Engine.`);
  }

  const categoryAttribute = await prisma.categoryAttribute.findUnique({
    where: {
      category_id_attribute_definition_id: {
        category_id: category.id,
        attribute_definition_id: input.attributeDefinitionId,
      },
    },
    select: { id: true },
  });

  if (!categoryAttribute) {
    return fail(
      `Attribute "${definition.key}" không thuộc schema của category "${category.name}" (${product.category}).`
    );
  }

  const hasVariant = input.variantId !== null && input.variantId !== undefined;

  if (definition.scope === 'PRODUCT' && hasVariant) {
    errors.push(
      `Attribute "${definition.key}" có scope=PRODUCT nhưng lại được gán variantId. ` +
        `Attribute cấp Product không được gắn vào 1 Variant cụ thể.`
    );
  }

  if (definition.scope === 'VARIANT' && !hasVariant) {
    errors.push(
      `Attribute "${definition.key}" có scope=VARIANT nên bắt buộc phải có variantId — ` +
        `không được nhập ở cấp Product chung chung.`
    );
  }

  if (hasVariant) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: input.variantId! },
      select: { id: true, product_id: true },
    });

    if (!variant) {
      errors.push(`variantId=${input.variantId} không tồn tại.`);
    } else if (variant.product_id !== input.productId) {
      errors.push(
        `variantId=${input.variantId} thuộc productId=${variant.product_id}, ` +
          `không phải productId=${input.productId} mà bạn đang nhập. ` +
          `Có thể bạn đang gán nhầm variant của sản phẩm khác.`
      );
    }
  }

  const valueCheck = validateValueForDataType(definition.data_type, definition.allowed_values, {
    valueString: input.valueString ?? null,
    valueNumber: input.valueNumber ?? null,
    valueBoolean: input.valueBoolean ?? null,
  });

  if (!valueCheck.valid) {
    errors.push(...valueCheck.errors.map((e) => `[${definition.key}] ${e}`));
  }

  return errors.length > 0 ? fail(...errors) : ok();
}

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
    return fail('Chưa có giá trị nào được điền (valueString/valueNumber/valueBoolean đều trống).');
  }
  if (filledColumns > 1) {
    return fail(
      'Chỉ được điền đúng 1 trong 3 cột giá trị (valueString/valueNumber/valueBoolean), ' +
        'hiện đang điền nhiều hơn 1 cột.'
    );
  }

  switch (dataType) {
    case 'DECIMAL':
      if (values.valueNumber === null) {
        return fail('dataType=DECIMAL nhưng valueNumber trống — phải điền số vào valueNumber.');
      }
      if (!Number.isFinite(values.valueNumber)) {
        return fail(`dataType=DECIMAL nhưng giá trị ${values.valueNumber} không phải số hữu hạn hợp lệ.`);
      }
      return ok();

    case 'INTEGER':
      if (values.valueNumber === null) {
        return fail('dataType=INTEGER nhưng valueNumber trống — phải điền số vào valueNumber.');
      }
      if (!Number.isFinite(values.valueNumber)) {
        return fail(`dataType=INTEGER nhưng giá trị ${values.valueNumber} không phải số hữu hạn hợp lệ.`);
      }
      if (!Number.isInteger(values.valueNumber)) {
        return fail(`dataType=INTEGER nhưng giá trị ${values.valueNumber} không phải số nguyên.`);
      }
      return ok();

    case 'BOOLEAN':
      if (values.valueBoolean === null) {
        return fail('dataType=BOOLEAN nhưng valueBoolean trống.');
      }
      return ok();

    case 'STRING':
      if (values.valueString === null || values.valueString.trim() === '') {
        return fail('dataType=STRING nhưng valueString trống.');
      }
      return ok();

    case 'ENUM': {
      if (values.valueString === null) {
        return fail('dataType=ENUM nhưng valueString trống.');
      }
      const allowed = Array.isArray(allowedValues) ? (allowedValues as string[]) : [];
      if (!allowed.includes(values.valueString)) {
        return fail(
          `dataType=ENUM nhưng giá trị "${values.valueString}" không nằm trong allowedValues [${allowed.join(', ')}].`
        );
      }
      return ok();
    }

    default:
      return fail(`dataType không xác định: ${dataType}`);
  }
}
