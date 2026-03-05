import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type EditIndexSectionProps = {
  title: string;
  count: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  testId: string;
};

export function EditIndexSection({
  title,
  count,
  open,
  onOpenChange,
  children,
  testId
}: EditIndexSectionProps) {
  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]"
      data-testid={testId}
    >
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[var(--vd-border)]">
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="group inline-flex items-center gap-3 text-left text-sm font-semibold text-[var(--vd-fg)]"
          >
            <ChevronDown
              className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')}
            />
            <span>{title}</span>
          </button>
        </CollapsibleTrigger>
        <Badge className="text-[11px]">{count} pages</Badge>
      </div>
      <CollapsibleContent className="px-5 pb-5 pt-4">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
