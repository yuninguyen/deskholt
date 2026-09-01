import { AdminStatusBadge } from '@/components/admin/AdminStatusBadge';
import SpecificationConfidenceSelect from './SpecificationConfidenceSelect';
import SpecificationSourceTypeSelect from './SpecificationSourceTypeSelect';
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

type Confidence = 'VERIFIED' | 'LIKELY' | 'UNVERIFIED';
const NATIVE_SELECT_CLASS =
  'h-8 w-full rounded-md border border-admin-input bg-transparent px-2.5 py-1 text-sm text-admin-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring';

const ENUM_LABEL_ACRONYMS = new Set(['MDF']);

function humanizeEnumLabel(value: string): string {
  return value
    .split('_')
    .map((word) =>
      ENUM_LABEL_ACRONYMS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(' ');
}

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
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select name={name} defaultValue={defaultValue}>
      <SelectTrigger>
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
  const confidence = String(draft?.confidence ?? existing?.confidence ?? 'UNVERIFIED') as Confidence;

  return (
    <div className="grid grid-cols-1 gap-3 border-b border-admin-border py-4 last:border-b-0 sm:grid-cols-12 sm:items-start">
      <div className="sm:col-span-3">
        <div className="text-sm font-medium text-admin-foreground">
          {row.label}
          {row.isRequired && row.scope !== 'DERIVED' && <span className="ml-1 text-admin-destructive">*</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {row.unit &&
            !(
              (row.unit === 'in' || row.unit === 'lb') &&
              (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER')
            ) && <span className="font-mono text-xs text-admin-muted-foreground">{row.unit}</span>}
          {row.scope === 'DERIVED' && <AdminStatusBadge variant="warning">{translations.derived}</AdminStatusBadge>}
        </div>
      </div>

      <div className="sm:col-span-2">
        {row.dataType === 'BOOLEAN' ? (
          <select name={`value__${row.rowKey}`} defaultValue={value} className={NATIVE_SELECT_CLASS}>
            <option value="">{translations.emptyOption}</option>
            <option value="true">{translations.true}</option>
            <option value="false">{translations.false}</option>
          </select>
        ) : row.dataType === 'ENUM' ? (
          <div className="space-y-1">
            <select
              name={`value__${row.rowKey}`}
              defaultValue={value}
              aria-invalid={staleEnumValue ? true : undefined}
              aria-describedby={staleEnumValue ? staleEnumHelpId : undefined}
              className={NATIVE_SELECT_CLASS}
            >
              <option value="">{translations.emptyOption}</option>
              {staleEnumValue !== null && (
                <option value={staleEnumValue}>
                  {humanizeEnumLabel(staleEnumValue)} ({translations.staleEnumSuffix})
                </option>
              )}
              {allowedEnumValues.map((allowedValue) => (
                <option key={allowedValue} value={allowedValue}>
                  {humanizeEnumLabel(allowedValue)}
                </option>
              ))}
            </select>
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

      <div className="sm:col-span-3">
        <Input
          type="text"
          name={`sourceUrl__${row.rowKey}`}
          placeholder={translations.sourceUrl}
          defaultValue={draft?.sourceUrl ?? existing?.sourceUrl ?? ''}
        />
      </div>

      <div className="sm:col-span-2">
        <SpecificationSourceTypeSelect
          name={`sourceType__${row.rowKey}`}
          defaultValue={String(draft?.sourceType ?? existing?.sourceType ?? '')}
          placeholder={translations.sourceType}
          labels={translations.sourceTypes}
        />
      </div>

      <div className="sm:col-span-2">
        <SpecificationConfidenceSelect
          name={`confidence__${row.rowKey}`}
          defaultValue={confidence}
          labels={translations.confidences}
        />
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
        className="rounded-lg bg-admin-primary px-6 py-2.5 text-sm font-semibold text-admin-primary-foreground hover:bg-admin-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring"
      >
        {translations.specifications.submit}
      </button>
    </form>
  );
}
