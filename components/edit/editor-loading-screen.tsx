import { Loader2 } from 'lucide-react';
import { EditorBrandLockup } from '@/components/admin/workspace-shell.config';
import { cn } from '@/lib/utils';

type EditorLoadingScreenProps = {
  className?: string;
  message?: string;
};

export function EditorLoadingScreen({
  className,
  message = 'Preparing your editor — this takes a moment for content-rich pages.'
}: EditorLoadingScreenProps) {
  return (
    <div
      className={cn(
        'relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--vd-bg)] px-6 py-10',
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(80% 60% at 50% -10%, color-mix(in oklch, var(--vd-primary) 12%, transparent), transparent 70%)'
        }}
      />

      <div className="relative w-full max-w-2xl rounded-2xl border border-[var(--vd-border)] bg-[var(--vd-card)]/95 p-6 shadow-sm backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <EditorBrandLockup className="h-8 w-auto" />
            <span className="text-xs uppercase tracking-[0.16em] text-[var(--vd-muted-fg)]">Editor</span>
          </div>
          <Loader2 className="h-5 w-5 animate-spin text-[var(--vd-primary)]" />
        </div>

        <p className="mt-5 text-sm text-[var(--vd-muted-fg)]">{message}</p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--vd-muted)]">
          <div className="vd-editor-loader-bar h-full w-2/5 rounded-full bg-[var(--vd-primary)]" />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3" aria-hidden="true">
          <div className="h-20 animate-pulse rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/50" />
          <div className="h-20 animate-pulse rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/50 [animation-delay:120ms]" />
          <div className="h-20 animate-pulse rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/50 [animation-delay:240ms]" />
        </div>
      </div>
    </div>
  );
}
