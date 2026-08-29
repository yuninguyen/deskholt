import type { SpecificationDraftRows } from '@/lib/products/specificationDraftStore';
import type { SpecificationData, SpecRow } from '@/lib/products/specificationRows';

const SOURCE_TYPES = ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'] as const;
const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;

function SpecRowFields({ row, draft }: { row: SpecRow; draft?: SpecificationDraftRows[string] }) {
  const existing = row.existing;
  const existingValue =
    row.dataType === 'BOOLEAN'
      ? existing?.valueBoolean === null || existing?.valueBoolean === undefined
        ? ''
        : String(existing.valueBoolean)
      : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER'
        ? existing?.valueNumber ?? ''
        : existing?.valueString ?? '';
  const value = draft?.value ?? existingValue;
  const allowedEnumValues = row.allowedValues ?? [];
  const staleEnumValue =
    row.dataType === 'ENUM' && value !== '' && !allowedEnumValues.includes(String(value))
      ? String(value)
      : null;
  const staleEnumHelpId = `${row.rowKey}-stale-enum`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-3 border-b border-gray-800 last:border-b-0">
      <div className="sm:col-span-3">
        <div className="text-sm font-medium text-white">
          {row.label}
          {row.isRequired && row.scope !== 'DERIVED' && <span className="text-red-400 ml-1">*</span>}
        </div>
        {row.unit && <div className="text-xs text-gray-500">{row.unit}</div>}
        {row.scope === 'DERIVED' && (
          <div className="text-[10px] uppercase tracking-wide text-amber-400 mt-0.5">Derived / suy luận</div>
        )}
      </div>

      <div className="sm:col-span-2">
        {row.dataType === 'BOOLEAN' ? (
          <select
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            <option value="">—</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : row.dataType === 'ENUM' ? (
          <div className="space-y-1">
            <select
              name={`value__${row.rowKey}`}
              defaultValue={value}
              aria-invalid={staleEnumValue !== null}
              aria-describedby={staleEnumValue !== null ? staleEnumHelpId : undefined}
              className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
            >
              <option value="">—</option>
              {staleEnumValue !== null && (
                <option value={staleEnumValue}>{staleEnumValue} (stored value — no longer allowed)</option>
              )}
              {allowedEnumValues.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
            {staleEnumValue !== null && (
              <p id={staleEnumHelpId} role="alert" className="text-xs text-amber-300">
                Giá trị ENUM đã lưu không còn nằm trong danh sách cho phép. Chọn giá trị mới trước khi lưu.
              </p>
            )}
          </div>
        ) : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER' ? (
          <input
            type="number"
            step={row.dataType === 'INTEGER' ? '1' : 'any'}
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          />
        ) : (
          <input
            type="text"
            name={`value__${row.rowKey}`}
            defaultValue={value}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          />
        )}
        {row.unit === 'in' && (row.dataType === 'DECIMAL' || row.dataType === 'INTEGER') && (
          <select
            name={`sourceUnit__${row.rowKey}`}
            defaultValue={draft?.sourceUnit === 'cm' ? 'cm' : 'in'}
            className="mt-2 w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        )}
      </div>

      <div className="sm:col-span-4">
        <input
          type="text"
          name={`sourceUrl__${row.rowKey}`}
          placeholder="Source URL"
          defaultValue={draft?.sourceUrl ?? existing?.sourceUrl ?? ''}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        />
      </div>

      <div className="sm:col-span-2">
        <select
          name={`sourceType__${row.rowKey}`}
          defaultValue={draft?.sourceType ?? existing?.sourceType ?? ''}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        >
          <option value="">Source type</option>
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-1">
        <select
          name={`confidence__${row.rowKey}`}
          defaultValue={draft?.confidence ?? existing?.confidence ?? 'UNVERIFIED'}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        >
          {CONFIDENCES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function ProductSpecificationsForm({
  data,
  draft,
  action,
}: {
  data: SpecificationData;
  draft?: SpecificationDraftRows;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const productRows = data.rows.filter((r) => r.variantId === null);
  const activeVariants = data.variants.filter((v) => v.isActive);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="productId" value={data.product.id} />
      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-2">Product-level</h2>
        <div className="rounded-xl border border-gray-800 px-4">
          {productRows.map((row) => (
            <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} />
          ))}
          {productRows.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">Không có attribute product-level nào.</div>
          )}
        </div>
      </section>

      {activeVariants.length === 0 && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          {data.variants.length === 0
            ? 'Sản phẩm này chưa có Variant. Hãy tạo Variant trước để nhập specs cấp Variant.'
            : 'Sản phẩm này không có Variant đang hoạt động. Hãy tạo hoặc kích hoạt Variant trước để nhập specs cấp Variant.'}
        </div>
      )}

      {activeVariants.map((variant) => {
        const rows = data.rows.filter((r) => r.variantId === variant.id);
        if (rows.length === 0) return null;
        return (
          <section key={variant.id}>
            <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-2">
              Variant: {variant.label}
            </h2>
            <div className="rounded-xl border border-gray-800 px-4">
              {rows.map((row) => (
                <SpecRowFields key={row.rowKey} row={row} draft={draft?.[row.rowKey]} />
              ))}
            </div>
          </section>
        );
      })}

      <button
        type="submit"
        className="rounded-md bg-blue-600 px-6 py-2.5 font-semibold text-white hover:bg-blue-500"
      >
        Lưu Specifications
      </button>
    </form>
  );
}
