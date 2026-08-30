import Link from 'next/link';
import Image from 'next/image';
import Badge, { type BadgeProps } from './Badge';

export interface ProductCardProps {
  name: string;
  slug: string;
  category: string;
  imageUrl: string;
  lowestPrice?: number;
  linkCount: number;
  badges?: BadgeProps[];
  dimension?: { value: string; label: string };
}

export default function ProductCard({
  name,
  slug,
  category,
  imageUrl,
  lowestPrice,
  linkCount,
  badges = [],
  dimension,
}: ProductCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-line-strong bg-card">
      <div className="relative h-40 w-full bg-gradient-to-br from-walnut-soft to-paper-alt">
        <Image src={imageUrl} alt={name} fill sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw" className="object-cover" />
        {dimension && (
          <div className="dim-line absolute bottom-2 left-3 right-3 rounded bg-card/80 px-1.5 py-1 backdrop-blur-sm">
            <span className="dim-val">{dimension.value}</span>
            <svg viewBox="0 0 100 10" className="text-walnut">
              <line x1="2" y1="5" x2="98" y2="5" stroke="currentColor" strokeWidth="1" />
            </svg>
            <span className="dim-val">{dimension.label}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{category.replace('-', ' ')}</div>
          <h3 className="mt-1 font-display text-base font-semibold text-ink">
            <Link href={`/products/${slug}`}>{name}</Link>
          </h3>
        </div>
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map((b) => (
              <Badge key={b.variant} variant={b.variant} label={b.label} />
            ))}
          </div>
        )}
        {linkCount === 0 ? (
          <div className="font-mono text-xl font-semibold text-ink">Price coming soon</div>
        ) : (
          <div>
            <span className="block font-body text-[11px] text-ink-faint">Best price from</span>
            <span className="font-mono text-xl font-semibold text-ink">
              {lowestPrice ? `$${lowestPrice.toFixed(2)}` : 'N/A'}
            </span>
          </div>
        )}
        <Link
          href={`/products/${slug}`}
          className="mt-auto flex items-center justify-center gap-2 rounded-sm bg-blueprint px-4 py-2.5 font-display text-sm font-semibold text-white transition-colors hover:bg-blueprint-deep focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blueprint"
        >
          {linkCount === 0 ? 'View product →' : `Compare ${linkCount} stores →`}
        </Link>
      </div>
    </div>
  );
}
