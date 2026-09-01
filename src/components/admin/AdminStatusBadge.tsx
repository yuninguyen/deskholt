import type { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = {
  success: 'border-[rgba(63,145,66,0.18)] bg-[rgba(63,145,66,0.08)] text-[#3F6B3F] dark:border-[rgba(94,196,98,0.18)] dark:bg-[rgba(94,196,98,0.10)] dark:text-[#8FCB8F]',
  brand: 'border-[rgba(68,82,99,0.18)] bg-[rgba(68,82,99,0.08)] text-[#445263] dark:border-[rgba(124,147,172,0.18)] dark:bg-[rgba(124,147,172,0.10)] dark:text-[#B8C9DA]',
  warning: 'border-[rgba(169,118,46,0.18)] bg-[rgba(169,118,46,0.08)] text-[#80551C] dark:border-[rgba(221,171,91,0.18)] dark:bg-[rgba(221,171,91,0.10)] dark:text-[#E5C084]',
  destructive: 'border-[rgba(168,67,43,0.18)] bg-[rgba(168,67,43,0.08)] text-[#8B3827] dark:border-[rgba(225,111,87,0.18)] dark:bg-[rgba(225,111,87,0.10)] dark:text-[#F0A08D]',
  neutral: 'border-[rgba(140,129,104,0.18)] bg-[rgba(140,129,104,0.08)] text-[#655D4D] dark:border-[rgba(169,156,130,0.18)] dark:bg-[rgba(169,156,130,0.10)] dark:text-[#C9BFA8]',
  outline: 'border-[rgba(140,129,104,0.18)] bg-[rgba(140,129,104,0.08)] text-[#655D4D] dark:border-[rgba(169,156,130,0.18)] dark:bg-[rgba(169,156,130,0.10)] dark:text-[#C9BFA8]',
} as const;

const dotVariants = {
  success: 'bg-[#3F9142] dark:bg-[#5EC462]',
  brand: 'bg-[#445263] dark:bg-[#7C93AC]',
  warning: 'bg-[#A9762E] dark:bg-[#DDAB5B]',
  destructive: 'bg-[#A8432B] dark:bg-[#E16F57]',
  neutral: 'bg-[#8C8168] dark:bg-[#A99C82]',
  outline: 'bg-[#8C8168] dark:bg-[#A99C82]',
} as const;

export type AdminStatusBadgeVariant = keyof typeof badgeVariants;

type AdminStatusBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant: AdminStatusBadgeVariant;
};

export function AdminStatusBadge({ className, variant, children, ...props }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-[6px] whitespace-nowrap rounded-[5px] border px-[9px] py-[3px] pl-[7px] text-[11.5px] font-semibold',
        badgeVariants[variant],
        className,
      )}
      {...props}
    >
      <span aria-hidden className={cn('h-[6px] w-[6px] shrink-0 rounded-full', dotVariants[variant])} />
      {children}
    </span>
  );
}
