'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';

export function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root data-slot="tabs" className={cn('flex flex-col gap-2', className)} {...props} />
  );
}

type TabsListProps = React.ComponentProps<typeof TabsPrimitive.List> & {
  variant?: 'segmented' | 'underline' | 'bare';
  fullWidth?: boolean;
};

export function TabsList({
  className,
  variant,
  fullWidth,
  ...props
}: TabsListProps) {
  const cls = typeof className === 'string' ? className : '';
  const fallbackBare = /(^|\s)(bg-transparent|rounded-none|p-0|h-auto)(\s|$)/.test(cls);
  const resolvedVariant = variant ?? (fallbackBare ? 'bare' : 'segmented');
  const isFull = fullWidth ?? cls.split(/\s+/).includes('w-full');

  const baseClass =
    resolvedVariant === 'underline'
      ? 'flex items-center gap-4 border-b border-[var(--vd-border)] text-[var(--vd-muted-fg)]'
      : resolvedVariant === 'bare'
        ? 'inline-flex items-center gap-2'
        : 'inline-flex h-9 items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-muted)] p-[3px] text-[var(--vd-muted-fg)]';

  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={resolvedVariant}
      className={cn(baseClass, isFull ? 'w-full' : 'w-fit', className)}
      {...props}
    />
  );
}

type TabsTriggerProps = React.ComponentProps<typeof TabsPrimitive.Trigger> & {
  variant?: 'segmented' | 'underline' | 'bare';
};

export function TabsTrigger({
  className,
  variant,
  ...props
}: TabsTriggerProps) {
  const cls = typeof className === 'string' ? className : '';
  const fallbackBare = /(^|\s)(border-0|rounded-none|bg-transparent)(\s|$)/.test(cls);
  const resolvedVariant = variant ?? (fallbackBare ? 'bare' : 'segmented');

  const baseClass =
    resolvedVariant === 'underline'
      ? 'relative inline-flex items-center gap-1.5 px-2 py-1 text-sm font-medium text-[var(--vd-muted-fg)] transition-colors after:absolute after:bottom-[-1px] after:left-0 after:h-0.5 after:w-0 after:bg-[var(--vd-fg)] after:transition-all data-[state=active]:text-[var(--vd-fg)] data-[state=active]:after:w-full'
      : resolvedVariant === 'bare'
        ? 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 px-2 py-1 text-sm font-medium text-[var(--vd-fg)] transition-colors disabled:pointer-events-none disabled:opacity-50'
        : 'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-[var(--vd-radius)] border border-transparent px-2 py-1 text-sm font-medium text-[var(--vd-fg)] transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vd-ring)] disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-[var(--vd-bg)] data-[state=active]:shadow-sm';

  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant={resolvedVariant}
      className={cn(baseClass, className)}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content data-slot="tabs-content" className={cn('flex-1 outline-none', className)} {...props} />
  );
}
