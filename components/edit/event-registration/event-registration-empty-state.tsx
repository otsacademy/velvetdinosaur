import { type ReactNode } from 'react';
import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type EventRegistrationEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
};

export function EventRegistrationEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className
}: EventRegistrationEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex min-h-[220px] flex-col items-center justify-center rounded-lg border border-dashed border-[var(--vd-border)] bg-[var(--vd-muted)]/15 px-5 py-8 text-center',
        className
      )}
    >
      <div className="rounded-full bg-[var(--vd-muted)] p-3 text-[var(--vd-fg)]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-[var(--vd-fg)]">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[var(--vd-muted-fg)]">{description}</p>
      {action ? <div className="mt-4 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </div>
  );
}
