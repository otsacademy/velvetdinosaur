import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'border border-[var(--vd-border)] bg-[var(--vd-muted)] text-[var(--vd-fg)]',
        secondary: 'bg-[var(--vd-secondary)] text-[var(--vd-secondary-fg)]',
        outline: 'border border-[var(--vd-border)] text-[var(--vd-fg)]',
        destructive: 'bg-[var(--vd-destructive)] text-[var(--vd-destructive-fg)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, className }))}
      {...props}
    />
  );
}
