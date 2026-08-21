import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared in-shell state for role-gated workspaces. Every gated page renders
 * this instead of silently redirecting or printing a bare sentence, so
 * "you can't see this" always looks and behaves the same way.
 */
export function AccessNotice({ workspace }: { workspace: string }) {
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-md rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-8 text-center shadow-sm">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[var(--vd-muted)]">
          <Lock className="h-5 w-5 text-[var(--vd-muted-fg)]" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-[var(--vd-fg)]">You need access to {workspace}</h1>
        <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
          Your account doesn&rsquo;t have the role this workspace requires. Ask a site administrator to grant it,
          then reload this page.
        </p>
        <Button variant="outline" asChild className="mt-5">
          <Link href="/edit">
            <ArrowLeft className="h-4 w-4" />
            Back to content
          </Link>
        </Button>
      </div>
    </main>
  );
}
