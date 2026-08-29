import { Suspense } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { getAuth } from '@/lib/auth';
import { SupportSubmitPortal } from '@/components/account/support-submit-portal.client';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Support portal'
};

async function AccountSupportPageContent() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect('/sign-in?next=/account/support');
  }

  return (
    <AdminWorkspaceShell>
      <SupportSubmitPortal />
      <Toaster />
    </AdminWorkspaceShell>
  );
}

export default function AccountSupportPage() {
  return (
    <Suspense
      fallback={
        <AdminWorkspaceShell>
          <main className="container py-10 text-sm text-[var(--vd-muted-fg)]">Loading support portal…</main>
        </AdminWorkspaceShell>
      }
    >
      <AccountSupportPageContent />
    </Suspense>
  );
}
