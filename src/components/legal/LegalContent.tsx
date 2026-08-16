export function LegalPlaceholder({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-sm bg-brick-soft px-1.5 py-0.5 font-mono text-[12px] text-brick">
      {children}
    </span>
  );
}

export function LegalPage({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl rounded-lg border border-line-strong bg-card p-8 md:p-12">
      <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-1 font-mono text-xs text-ink-faint">Last Updated: {lastUpdated}</p>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink-soft [&_a]:text-blueprint [&_a]:underline [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-5 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-ink [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-semibold [&_strong]:text-ink [&_table]:w-full [&_table]:border-collapse [&_td]:border-t [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_th]:border-b [&_th]:border-line-strong [&_th]:bg-paper-alt [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-mono [&_th]:text-[11px] [&_th]:uppercase [&_th]:text-ink-faint [&_ul]:space-y-1">
        {children}
      </div>
      <p className="mt-8 border-t border-line pt-4 font-mono text-xs text-ink-faint">
        Effective Date: {lastUpdated}
      </p>
    </div>
  );
}
