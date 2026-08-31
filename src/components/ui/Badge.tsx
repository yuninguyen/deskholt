import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import { cn } from '@/lib/utils';

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

export default function PublicBadge({ variant, label }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${VARIANT_CLASSES[variant]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}

const badgeVariants = cva(
  'inline-flex items-center rounded-full border border-transparent px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-ring',
  {
    variants: {
      variant: {
        default: 'bg-admin-primary text-admin-primary-foreground',
        secondary: 'bg-admin-secondary text-admin-secondary-foreground',
        destructive: 'bg-admin-destructive text-admin-primary-foreground',
        outline: 'border-admin-border text-admin-foreground',
        success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        brand: 'border-brand-500/30 bg-brand-500/10 text-brand-700 dark:text-brand-300',
        warning: 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300',
        neutral: 'border-admin-border bg-admin-muted text-admin-muted-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return <Comp className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
