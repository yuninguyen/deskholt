import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAdminTranslations } from '@/lib/admin/i18n/server';
import type { Dictionary } from '@/lib/admin/i18n/en';
import type { SpecificationDraftRows } from '@/lib/products/specificationDraftStore';
import type { SpecificationData, SpecRow } from '@/lib/products/specificationRows';

const SOURCE_TYPES = ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'] as const;
const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;

type SpecificationsTranslations = Dictionary['specifications'];
type SpecificationsFormProps = {
  data: SpecificationData;
  draft?: SpecificationDraftRows;
  action: (formData: FormData) => void | Promise<void>;
};

function InspectionSelect({
  name,
  defaultValue,
  placeholder,
  children,
  invalid = false,
  describedBy,
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
  children: React.ReactNode;
  invalid?: boolean;
  describedBy?: string;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger aria-invalid={invalid} aria-describedby={describedBy}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function SpecRowFields({
  row,
  draft,
  translations,
}: {
  row: SpecRow;
  draft?: SpecificationDraftRows[string];
  translations: SpecificationsTranslations;
}) {
  const existing = row.existing;
  const existingValue =
    row.dataType === 'BOOLEAN'
      ? existing?.valueBoolean === null || existing?.valueBoolean === undefined
        ? ''
        : String(existing.valueBoolean)
      : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER'
        ? existing?.valueNumber ?? ''
        : existing?.valueString ?? '';
  const value = String(draft?.value ?? existingValue);
  const allowedEnumValues = row.allowedValues ?? [];
  const staleEnumValue =
    row.dataType === 'ENUM' && value !== '' && !allowedEnumValues.includes(value) ? value : null;
  const staleEnumHelpId = `${row.rowKey}-stale-enum`;
  const confidence = String(draft?.confidence ?? existing?.confidence ?? 'UNVERIFIED') as (typeof CONFIDENCES)[number];
  const confidenceVariant = {
    VERIFIED: 'success',
    LIKELY: 'warning',
    UNVERIFIED: 'neutral',
  } as const;

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-admin-border py-4 last:border-b-0 sm:grid-cols-12 sm:items-start">
      <div className="sm:col-span-3">
        <div className="text-sm font-medium text-admin-foreground">
          {row.label}
          {row.isRequired && row.scope !== 'DERIVED' && <span className="ml-1 text-admin-destructive">*</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {row.unit && <span className="font-mono text-xs text-admin-muted-foreground">{row.unit}</span>}
          {row.scope === 'DERIVED' && <Badge variant="warning">{translations.derived}</Badge>}
        </div>
      </div>

      <div className="sm:col-span-2">
        {row.dataType === 'BOOLEAN' ? (
          <InspectionSelect name={`value__${row.rowKey}`} defaultValue={value} placeholder={translations.emptyOption}>
            <SelectItem value="true">{translations.true}</SelectItem>
            <SelectItem value="false">{translations.false}</SelectItem>
          </InspectionSelect>
        ) : row.dataType === 'ENUM' ? (
          <div className="space-y-1">
            <InspectionSelect
              name={`value__${row.rowKey}`}
              defaultValue={value}
              placeholder={translations.emptyOption}
              invalid={staleEnumValue !== null}
              describedBy={staleEnumValue !== null ? staleEnumHelpId : undefined}
            >
                {staleEnumValue !== null && (
                <SelectItem value={staleEnumValue}>
                  {staleEnumValue} ({translations.staleEnumSuffix})
                </SelectItem>
              )}
              {allowedEnumValues.map((allowedValue) => (
                <SelectItem key={allowedValue} value={allowedValue}>
                  {allowedValue}
                </SelectItem>
              ))}
            </InspectionSelect>
            {staleEnumValue !== null && (
              <p id={staleEnumHelpId} role="alert" className="text-xs text-amber-700 dark:text-amber-300">
                {translations.errors.staleEnum}
              </p>
            )}
          </div>
        ) : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER' ? (
          <Input
            type="number"
            step={row.dataType === 'INTEGER' ? '1' : 'any'}
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className="tabular-nums"
          />
        ) : (
          <Input type="text" name={`value__${row.rowKey}`} defaultValue={value} />
        )}
        {(row.unit === 'in' || row.unit === 'lb') &&
          (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER') && (
            <div className="mt-2">
              <InspectionSelect
                name={`sourceUnit__${row.rowKey}`}
                defaultValue={
                  row.unit === 'in'
                    ? draft?.sourceUnit === 'cm'
                      ? 'cm'
                      : 'in'
                    : draft?.sourceUnit === 'kg'
                      ? 'kg'
                      : 'lb'
                }
                placeholder={row.unit}
              >
                {row.unit === 'in' ? (
                  <>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="lb">lb</SelectItem>
                    <SelectItem value="kg">kg</SelectItem>
                  </>
                )}
              </InspectionSelect>
            </div>
          )}
      </div>

      <div className="sm:col-span-4">
        <Input
          type="text"
          name={`sourceUrl__${row.rowKey}`}
          placeholder={translations.sourceUrl}
          defaultValue={draft?.sourceUrl ?? existing?.sourceUrl ?? ''}
        />
      </div>

      <div className="sm:col-span-2">
        <InspectionSelect
          name={`sourceType__${row.rowKey}`}
          defaultValue={String(draft?.sourceType ?? existing?.sourceType ?? '')}
          placeholder={translations.sourceType}
        >
          <SelectItem value="empty">{translations.sourceType}</SelectItem>
          {SOURCE_TYPES.map((sourceType) => (
            <SelectItem key={sourceType} value={sourceType}>
              {translations.sourceTypes[sourceType]}
            </SelectItem>
          ))}
        </InspectionSelect>
      </div>

      <div className="sm:col-span-1">
        <InspectionSelect name={`confidence__${row.rowKey}`} defaultValue={confidence} placeholder={translations.confidences.UNVERIFIED}>
          {CONFIDENCES.map((confidenceValue) => (
            <SelectItem key={confidenceValue} value={confidenceValue}>
              {translations.confidences[confidenceValue]}
            </SelectItem>
          ))}
        </InspectionSelect>
        <Badge variant={confidenceVariant[confidence]} className="mt-2 whitespace-nowrap">
          {translations.confidences[confidence]}
        </Badge>
      </div>
    </div>
  );
}

export default async function ProductSpecificationsForm({
  data,
  draft,
  action,
}: SpecificationsFormProps) {
  const translations = await getAdminTranslations();
  const productRows = data.rows.filter((row) => row.variantId === null);
  const activeVariants = data.variants.filter((variant) => variant.isActive);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="productId" value={data.product.id} />
      <section>
        <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-admin-muted-foreground">
          {translations.specifications.productLevel}
        </h2>
        <div className="border border-admin-border bg-admin-card px-4">
          {productRows.map((row) => (
            <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} translations={translations.specifications} />
          ))}
          {productRows.length === 0 && (
            <div className="py-6 text-center text-sm text-admin-muted-foreground">
              {translations.specifications.noProductAttributes}
            </div>
          )}
        </div>
      </section>

      {activeVariants.length === 0 && (
        <div className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {data.variants.length === 0 ? translations.specifications.noVariants : translations.specifications.noActiveVariants}
        </div>
      )}

      {activeVariants.map((variant) => {
        const rows = data.rows.filter((row) => row.variantId === variant.id);
        if (rows.length === 0) return null;
        return (
          <section key={variant.id}>
            <h2 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wide text-admin-muted-foreground">
              {translations.specifications.variant}: <span className="font-body normal-case text-admin-foreground">{variant.label}</span>
            </h2>
            <div className="border border-admin-border bg-admin-card px-4">
              {rows.map((row) => (
                <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} translations={translations.specifications} />
              ))}
            </div>
          </section>
        );
      })}

      <button
        type="submit"
        className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring"
      >
        {translations.specifications.submit}
      </button>
    </form>
  );
}
