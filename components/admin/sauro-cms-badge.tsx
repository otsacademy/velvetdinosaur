'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

type SauroCmsBadgeProps = {
  className?: string;
  compact?: boolean;
};

export function SauroCmsBadge({ className, compact = false }: SauroCmsBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-[var(--vd-border)] bg-[var(--vd-card)] px-2.5 py-1 text-xs font-medium text-[var(--vd-fg)]',
        compact ? 'px-2 py-0.5 text-[11px]' : '',
        className
      )}
    >
      <Avatar
        className={compact ? 'h-[1.3rem] w-[1.3rem] border border-[var(--vd-border)]/80' : 'h-[1.625rem] w-[1.625rem] border border-[var(--vd-border)]/80'}
      >
        <AvatarImage src="/logo.webp" alt="Velvet Dinosaur logo" className="object-cover" />
        <AvatarFallback className={compact ? 'text-[9px] font-semibold' : 'text-[10px] font-semibold'}>VD</AvatarFallback>
      </Avatar>
      <span>Sauro CMS</span>
    </div>
  );
}
