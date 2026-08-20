import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { EventRegistrationsWorkspace } from '@/components/edit/event-registrations-workspace';
import { Toaster } from '@/components/ui/sonner';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';

export default async function EditEventRegistrationsPage() {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  const userEmail = user?.email || null;

  if (!session) {
    redirect('/sign-in?next=/edit/event-registrations');
  }

  if (!(await requireAdmin(userId, userEmail))) {
    redirect('/edit');
  }

  return (
    <AdminWorkspaceShell>
      <EventRegistrationsWorkspace />
      <Toaster />
    </AdminWorkspaceShell>
  );
}
