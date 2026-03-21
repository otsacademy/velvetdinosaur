import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[140px] w-full rounded-lg border-[1.5px] border-[var(--vd-border)] bg-[var(--vd-bg)] px-3.5 py-2.5 text-[0.9375rem] text-[var(--vd-fg)] placeholder:text-[var(--vd-placeholder)] shadow-none focus-visible:border-[var(--vd-primary)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[0_0_0_3px_color-mix(in_oklch,var(--vd-primary)_12%,transparent)]',
        className
      )}
      {...props}
    />
  )
);

Textarea.displayName = 'Textarea';
