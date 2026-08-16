export interface PriceTableRow {
  network: string;
  price: number;
  inStock: boolean;
  goHref: string;
}

export interface PriceTableProps {
  rows: PriceTableRow[];
}

export default function PriceTable({ rows }: PriceTableProps) {
  const lowestInStockPrice = rows
    .filter((r) => r.inStock)
    .reduce<number | null>((min, r) => (min === null || r.price < min ? r.price : min), null);

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
          const isBest = row.inStock && row.price === lowestInStockPrice;
          return (
            <tr key={row.network} className={isBest ? 'bg-sage-soft' : undefined}>
              <td className="border-t border-line px-4 py-3 font-display font-semibold text-ink">{row.network}</td>
              <td className="border-t border-line px-4 py-3 font-mono font-semibold text-ink">
                ${row.price.toFixed(2)}
              </td>
              <td className="border-t border-line px-4 py-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${
                    row.inStock ? 'bg-blueprint-soft text-blueprint-deep' : 'bg-paper-alt text-ink-faint'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {row.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </td>
              <td className="border-t border-line px-4 py-3 text-right">
                {row.inStock ? (
                  <a
                    href={row.goHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-sm bg-blueprint px-3.5 py-1.5 font-display text-xs font-semibold text-white transition-colors hover:bg-blueprint-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
                  >
                    Go →
                  </a>
                ) : (
                  <span className="inline-block cursor-not-allowed rounded-sm bg-paper-alt px-3.5 py-1.5 font-display text-xs font-semibold text-ink-faint">
                    Go →
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
