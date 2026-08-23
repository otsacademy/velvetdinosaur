import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { getAuth } from '@/lib/auth';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';
import { requireAdmin } from '@/lib/roles';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { BookingsWorkspace } from '@/components/edit/bookings-workspace';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';

export const metadata: Metadata = {
  title: 'Bookings'
};

export default async function EditBookingsPage() {
  unstable_noStore();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }

  const auth = getAuth();
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  const isSmoke = isEditorSmokeRequest(requestHeaders);
  if (!session && !isSmoke) {
    redirect('/sign-in?next=/edit/bookings');
  }
  if (session && !isSmoke) {
    const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
    const allowed = user?.id ? await requireAdmin(user.id, user.email ?? '') : false;
    if (!allowed) {
      redirect(adminHomePath);
    }
  }

  return (
    <AdminWorkspaceShell>
      <BookingsWorkspace />
    </AdminWorkspaceShell>
  );
}
