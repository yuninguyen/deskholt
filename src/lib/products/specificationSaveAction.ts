import { Confidence, Prisma, SourceType } from '@prisma/client';
import {
  clearProductSpecificationDrafts,
  saveSpecificationDraft,
  type SpecificationDraftRows,
} from './specificationDraftStore';
import type { SpecificationData, SpecRow } from './specificationRows';
import { convertLengthToCanonicalInches, convertMassToCanonicalPounds } from './unitConversion';
import type {
  ProductAttributeInput,
  ValidationResult,
} from './productAttributeValidator';

type ParsedRow =
  | { kind: 'skip'; row: SpecRow }
  | { kind: 'delete'; row: SpecRow }
  | {
      kind: 'write';
      row: SpecRow;
      valueString: string | null;
      valueNumber: number | null;
      valueBoolean: boolean | null;
      sourceUrl: string | null;
      sourceType: SourceType | null;
      confidence: Confidence;
    };

export type SaveSpecificationsDependencies = {
  loadSpecificationData(productId: string): Promise<SpecificationData | null>;
  validateProductAttributeInput(input: ProductAttributeInput): Promise<ValidationResult>;
  transaction(callback: (tx: Prisma.TransactionClient) => Promise<void>): Promise<void>;
  now(): Date;
  saveDraft?(productId: string, rows: SpecificationDraftRows): string;
  clearProductDrafts?(productId: string): void;
  redirect(path: string): never;
};

export function createSaveSpecificationsAction(dependencies: SaveSpecificationsDependencies) {
  return async function saveSpecifications(formData: FormData): Promise<void> {
    const productId = String(formData.get('productId') ?? '');
    const data = await dependencies.loadSpecificationData(productId);
    if (!data) {
      throw new Error(`Product ${productId} không tồn tại hoặc chưa có Category schema.`);
    }

    const parsedRows: ParsedRow[] = [];
    const errors: string[] = [];
    const draftRows: SpecificationDraftRows = Object.fromEntries(
      data.rows.map((row) => [
        row.rowKey,
        {
          value: String(formData.get(`value__${row.rowKey}`) ?? ''),
          sourceUrl: String(formData.get(`sourceUrl__${row.rowKey}`) ?? ''),
          sourceType: String(formData.get(`sourceType__${row.rowKey}`) ?? ''),
          confidence: String(formData.get(`confidence__${row.rowKey}`) ?? ''),
          ...((row.unit === 'in' || row.unit === 'lb') && (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER') && String(formData.get(`value__${row.rowKey}`) ?? '').trim() !== '' && String(formData.get(`sourceUnit__${row.rowKey}`) ?? '').trim()
            ? { sourceUnit: String(formData.get(`sourceUnit__${row.rowKey}`)).trim() }
            : {}),
        },
      ])
    );

    for (const row of data.rows) {
      const rawValue = String(formData.get(`value__${row.rowKey}`) ?? '').trim();
      const rawSourceUrl = String(formData.get(`sourceUrl__${row.rowKey}`) ?? '').trim();
      const rawSourceType = String(formData.get(`sourceType__${row.rowKey}`) ?? '').trim();
      const rawConfidence = String(formData.get(`confidence__${row.rowKey}`) ?? 'UNVERIFIED').trim();
      const rawSourceUnit = String(formData.get(`sourceUnit__${row.rowKey}`) ?? '').trim();
      const rowLabel = row.variantLabel ? `${row.label} (${row.variantLabel})` : row.label;

      if (rawValue === '') {
        if (rawSourceUrl !== '' || rawSourceType !== '') {
          errors.push(`${rowLabel}: có Source URL/Type nhưng không có Value.`);
          continue;
        }
        parsedRows.push(row.existing ? { kind: 'delete', row } : { kind: 'skip', row });
        continue;
      }

      let valueString: string | null = null;
      let valueNumber: number | null = null;
      let valueBoolean: boolean | null = null;

      if (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER') {
        const numericValue = Number(rawValue);
        if (!Number.isFinite(numericValue)) {
          errors.push(`${rowLabel}: giá trị "${rawValue}" không phải số hợp lệ.`);
          continue;
        }
        if (row.unit === 'in' || row.unit === 'lb') {
          const sourceUnit = rawSourceUnit || row.unit;
          const validSourceUnits = row.unit === 'in' ? ['in', 'cm'] : ['lb', 'kg'];
          if (!validSourceUnits.includes(sourceUnit)) {
            errors.push(`${rowLabel}: đơn vị nguồn không hợp lệ.`);
            continue;
          }
          valueNumber = row.unit === 'in'
            ? convertLengthToCanonicalInches(numericValue, sourceUnit as 'in' | 'cm')
            : convertMassToCanonicalPounds(numericValue, sourceUnit as 'lb' | 'kg');
        } else {
          valueNumber = numericValue;
        }
      } else if (row.dataType === 'BOOLEAN') {
        if (rawValue !== 'true' && rawValue !== 'false') {
          errors.push(`${rowLabel}: giá trị boolean không hợp lệ.`);
          continue;
        }
        valueBoolean = rawValue === 'true';
      } else {
        valueString = rawValue;
      }

      const validation = await dependencies.validateProductAttributeInput({
        productId: data.product.id,
        variantId: row.variantId,
        attributeDefinitionId: row.attributeDefinitionId,
        valueString,
        valueNumber,
        valueBoolean,
      });

      if (!validation.valid) {
        errors.push(...validation.errors.map((error) => `${rowLabel}: ${error}`));
        continue;
      }

      const confidence: Confidence = ['VERIFIED', 'LIKELY', 'UNVERIFIED'].includes(rawConfidence)
        ? (rawConfidence as Confidence)
        : 'UNVERIFIED';
      const sourceType: SourceType | null =
        rawSourceType && ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'].includes(rawSourceType)
          ? (rawSourceType as SourceType)
          : null;
      const hasValidSourceUrl = URL.canParse(rawSourceUrl);

      if (confidence === 'VERIFIED' && (!hasValidSourceUrl || !sourceType)) {
        errors.push(`${rowLabel}: VERIFIED requires a valid source URL and source type.`);
        continue;
      }

      parsedRows.push({
        kind: 'write',
        row,
        valueString,
        valueNumber,
        valueBoolean,
        sourceUrl: rawSourceUrl || null,
        sourceType,
        confidence,
      });
    }

    if (errors.length > 0) {
      const summary = errors.slice(0, 5).join(' | ');
      const draftToken = (dependencies.saveDraft ?? saveSpecificationDraft)(productId, draftRows);
      dependencies.redirect(
        `/admin/products/${productId}/specifications?error=1&count=${errors.length}&detail=${encodeURIComponent(summary)}&draft=${encodeURIComponent(draftToken)}`
      );
    }

    const verifiedAt = dependencies.now();
    await dependencies.transaction(async (tx) => {
      for (const parsed of parsedRows) {
        if (parsed.kind === 'skip') continue;

        const where = {
          product_id: data.product.id,
          attribute_definition_id: parsed.row.attributeDefinitionId,
          variant_id: parsed.row.variantId,
        };
        const existing = await tx.productAttribute.findFirst({ where });

        if (parsed.kind === 'delete') {
          if (existing) await tx.productAttribute.delete({ where: { id: existing.id } });
          continue;
        }

        const writeData = {
          value_string: parsed.valueString,
          value_number: parsed.valueNumber,
          value_boolean: parsed.valueBoolean,
          source_url: parsed.sourceUrl,
          source_type: parsed.sourceType,
          confidence: parsed.confidence,
          verified_at: parsed.confidence === 'VERIFIED' ? verifiedAt : null,
        };

        if (existing) {
          await tx.productAttribute.update({ where: { id: existing.id }, data: writeData });
        } else {
          await tx.productAttribute.create({
            data: {
              product_id: data.product.id,
              variant_id: parsed.row.variantId,
              attribute_definition_id: parsed.row.attributeDefinitionId,
              ...writeData,
            },
          });
        }
      }
    });

    (dependencies.clearProductDrafts ?? clearProductSpecificationDrafts)(productId);
    dependencies.redirect(`/admin/products/${productId}/specifications?saved=1`);
  };
}
