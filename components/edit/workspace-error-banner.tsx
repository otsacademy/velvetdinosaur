'use client';

import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared inline error banner for workspace load failures. Gives rare states
 * the same design attention as happy paths: icon, humane copy, one action.
 */
export function WorkspaceErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const friendly =
    message === 'Database unavailable'
      ? 'The database is unreachable right now, so live data cannot load.'
      : message;
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-[var(--vd-radius)] border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700"
    >
      <span className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        {friendly}
      </span>
      {onRetry ? (
        <Button size="sm" variant="outline" className="shrink-0 border-red-200 text-red-700 hover:bg-red-100" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}
