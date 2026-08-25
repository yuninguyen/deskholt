import type { OfferDisplayState } from '@/lib/products/productStructuredData';

export interface PriceTableRow {
  id: string;
  network: string;
  price?: number;
  availability: OfferDisplayState;
  observedAt?: Date;
  isBestCurrentOffer: boolean;
  goHref: string;
}

export interface PriceTableProps {
  rows: PriceTableRow[];
}

function formatObservedAt(observedAt: Date | undefined): string | undefined {
  if (!observedAt || !Number.isFinite(observedAt.getTime())) return undefined;
  return observedAt.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, ' UTC');
}

export default function PriceTable({ rows }: PriceTableProps) {
  return (
    <table className="w-full overflow-hidden rounded-md border border-line-strong bg-card">
      <thead>
        <tr>
          <th className="bg-paper-alt px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Store
          </th>
          <th className="bg-paper-alt px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Price
          </th>
          <th className="bg-paper-alt px-4 py-3 text-left font-mono text-[11px] font-medium uppercase tracking-wide text-ink-faint">
            Status
          </th>
          <th className="bg-paper-alt px-4 py-3" />
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const displayPrice =
            typeof row.price === 'number' && Number.isFinite(row.price) && row.price > 0
              ? `$${row.price.toFixed(2)}`
              : '—';
          const observedAt = formatObservedAt(row.observedAt);
          const isCurrent = row.availability === 'current-in-stock';
          const isOutOfStock = row.availability === 'out-of-stock';

          return (
            <tr key={row.id} className={row.isBestCurrentOffer ? 'bg-sage-soft' : undefined}>
              <td className="border-t border-line px-4 py-3 font-display font-semibold text-ink">{row.network}</td>
              <td className="border-t border-line px-4 py-3 font-mono font-semibold text-ink">
                {displayPrice}
                {observedAt && (
                  <span className="mt-1 block font-sans text-[10px] font-normal text-ink-faint">
                    Last checked {observedAt}
                  </span>
                )}
              </td>
              <td className="border-t border-line px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
                    isCurrent
                      ? 'bg-blueprint-soft text-blueprint-deep'
                      : isOutOfStock
                        ? 'bg-paper-alt text-ink-faint'
                        : 'bg-amber-soft text-amber'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {isCurrent ? 'In Stock' : isOutOfStock ? 'Out of Stock' : 'Check retailer'}
                </span>
              </td>
              <td className="border-t border-line px-4 py-3 text-right">
                {isOutOfStock ? (
                  <span className="inline-block cursor-not-allowed rounded-sm bg-paper-alt px-3.5 py-1.5 font-display text-xs font-semibold text-ink-faint">
                    Go →
                  </span>
                ) : (
                  <a
                    href={row.goHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-sm bg-blueprint px-3.5 py-1.5 font-display text-xs font-semibold text-white transition-colors hover:bg-blueprint-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
                  >
                    {isCurrent ? 'Go →' : 'Check price →'}
                  </a>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
