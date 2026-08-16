const VARIANT_CLASSES = {
  eco: 'bg-sage-soft text-sage',
  instock: 'bg-blueprint-soft text-blueprint-deep',
  outstock: 'bg-paper-alt text-ink-faint',
  best: 'bg-amber-soft text-amber',
  drop: 'bg-brick-soft text-brick',
} as const;

export type BadgeVariant = keyof typeof VARIANT_CLASSES;

export interface BadgeProps {
  variant: BadgeVariant;
  label: string;
}

export default function Badge({ variant, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${VARIANT_CLASSES[variant]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
