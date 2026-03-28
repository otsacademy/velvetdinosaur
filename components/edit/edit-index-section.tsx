import type { CSSProperties, ReactNode } from 'react';
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
  mode?: 'live' | 'demo';
  animationIndex?: number;
  testId: string;
};

export function EditIndexSection({
  title,
  count,
  open,
  onOpenChange,
  children,
  mode = 'live',
  animationIndex = 0,
  testId
}: EditIndexSectionProps) {
  const isDemo = mode === 'demo';

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className={cn(
        'rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)]',
        isDemo && 'vd-demo-section'
      )}
      style={
        isDemo
          ? ({
              '--vd-demo-delay': `${40 + animationIndex * 70}ms`
            } as CSSProperties)
          : undefined
      }
      data-testid={testId}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-3 border-b border-[var(--vd-border)] px-5 py-4',
          isDemo && 'vd-demo-section-header'
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className={cn(
              'group inline-flex items-center gap-3 text-left text-sm font-semibold text-[var(--vd-fg)]',
              isDemo && 'vd-demo-section-trigger'
            )}
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', open ? 'rotate-0' : '-rotate-90')} />
            <span>{title}</span>
          </button>
        </CollapsibleTrigger>
        <Badge className={cn('text-[11px]', isDemo && 'vd-demo-count-badge')}>{count} pages</Badge>
      </div>
      <CollapsibleContent className={cn('px-5 pb-5 pt-4', isDemo && 'vd-demo-section-content')}>
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
