'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { PatternPayload } from '@/lib/puck/patterns';

type PatternLibraryProps = {
  disabled: boolean;
  onInsert: (pattern: PatternPayload) => void;
  patterns: PatternPayload[];
  onRequestUnlock?: () => void;
  showGlobalLock?: boolean;
};

export function PatternLibrary({
  disabled,
  onInsert,
  patterns,
  onRequestUnlock,
  showGlobalLock
}: PatternLibraryProps) {
  if (!patterns.length) return null;

  return (
    <div className="space-y-2 pb-4">
      <div className="px-4 pt-2">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
          Patterns
        </h2>
      </div>
      <div className="space-y-2 px-4">
        {patterns.map((pattern) => (
          <Button
            key={pattern.id}
            type="button"
            variant="outline"
            className="h-auto w-full justify-start gap-1 px-3 py-2 text-left"
            onClick={() => onInsert(pattern)}
            disabled={disabled}
          >
            <span className="text-sm font-medium text-[var(--vd-fg)]">{pattern.name}</span>
            <span className="mt-1 block text-xs text-[var(--vd-muted-fg)]">{pattern.description}</span>
          </Button>
        ))}
      </div>
      {showGlobalLock ? (
        <div className="px-4">
          <Separator className="mb-2" />
          <p className="mb-2 text-xs text-[var(--vd-muted-fg)]">
            Changes here apply to every page. Unlock global editing to add patterns.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRequestUnlock}
            disabled={!onRequestUnlock || disabled}
          >
            Unlock global editing
          </Button>
        </div>
      ) : null}
    </div>
  );
}
