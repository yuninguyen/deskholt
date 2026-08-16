import type { SpecificationData, SpecRow } from '@/lib/products/specificationRows';

const SOURCE_TYPES = ['MANUFACTURER', 'MANUAL', 'RETAILER', 'CERTIFICATION', 'OTHER'] as const;
const CONFIDENCES = ['VERIFIED', 'LIKELY', 'UNVERIFIED'] as const;

function SpecRowFields({ row }: { row: SpecRow }) {
  const existing = row.existing;

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
            defaultValue={existing?.valueBoolean === null || existing?.valueBoolean === undefined ? '' : String(existing.valueBoolean)}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            <option value="">—</option>
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        ) : row.dataType === 'ENUM' ? (
          <select
            name={`value__${row.rowKey}`}
            defaultValue={existing?.valueString ?? ''}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          >
            <option value="">—</option>
            {(row.allowedValues ?? []).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        ) : row.dataType === 'DECIMAL' || row.dataType === 'INTEGER' ? (
          <input
            type="number"
            step={row.dataType === 'INTEGER' ? '1' : 'any'}
            name={`value__${row.rowKey}`}
            defaultValue={existing?.valueNumber ?? ''}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          />
        ) : (
          <input
            type="text"
            name={`value__${row.rowKey}`}
            defaultValue={existing?.valueString ?? ''}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
          />
        )}
      </div>

      <div className="sm:col-span-4">
        <input
          type="text"
          name={`sourceUrl__${row.rowKey}`}
          placeholder="Source URL"
          defaultValue={existing?.sourceUrl ?? ''}
          className="w-full rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-white"
        />
      </div>

      <div className="sm:col-span-2">
        <select
          name={`sourceType__${row.rowKey}`}
          defaultValue={existing?.sourceType ?? ''}
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
          defaultValue={existing?.confidence ?? 'UNVERIFIED'}
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
  action,
}: {
  data: SpecificationData;
  action: (formData: FormData) => void | Promise<void>;
}) {
  const productRows = data.rows.filter((r) => r.variantId === null);
  const activeVariants = data.variants.filter((v) => v.isActive);
  const hasVariantScopedRows = data.rows.some((r) => r.variantId !== null);

  return (
    <form action={action} className="space-y-8">
      <input type="hidden" name="productId" value={data.product.id} />
      <section>
        <h2 className="text-sm font-bold text-white uppercase tracking-wide mb-2">Product-level</h2>
        <div className="rounded-xl border border-gray-800 px-4">
          {productRows.map((row) => (
            <SpecRowFields key={row.rowKey} row={row} />
          ))}
          {productRows.length === 0 && (
            <div className="py-6 text-center text-sm text-gray-500">Không có attribute product-level nào.</div>
          )}
        </div>
      </section>

      {activeVariants.length === 0 && hasVariantScopedRows === false && data.variants.length === 0 && (
        <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3 text-sm text-amber-300">
          Sản phẩm này chưa có Variant. Hãy tạo Variant trước để nhập specs cấp Variant.
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
                <SpecRowFields key={row.rowKey} row={row} />
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
