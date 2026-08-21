import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import type { Metadata } from 'next';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { SupportWorkspace } from '@/components/edit/support-workspace';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Customer Portal'
};

type EditSupportPageProps = {
  searchParams?: Promise<{ ticketId?: string | string[] }>;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function EditSupportPage({ searchParams }: EditSupportPageProps) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  const userEmail = user?.email || null;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const ticketIdParam = resolvedSearchParams?.ticketId;
  const initialTicketId = clean(Array.isArray(ticketIdParam) ? ticketIdParam[0] : ticketIdParam);

  if (!session) {
    const nextPath = initialTicketId
      ? `/edit/support?ticketId=${encodeURIComponent(initialTicketId)}`
      : '/edit/support';
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }

  if (!(await requireAdmin(userId, userEmail))) {
    return <AccessNotice workspace="the Customer Portal" />;
  }

  return (
    <AdminWorkspaceShell>
      <SupportWorkspace initialTicketId={initialTicketId} />
      <Toaster />
    </AdminWorkspaceShell>
  );
}
