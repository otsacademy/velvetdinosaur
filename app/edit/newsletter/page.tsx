import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { NewsletterWorkspace } from '@/components/edit/newsletter-workspace';
import { Toaster } from '@/components/ui/sonner';

export default async function EditNewsletterPage() {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  const userEmail = user?.email || null;

  if (!session) {
    redirect('/sign-in?next=/edit/newsletter');
  }

  if (!(await requireAdmin(userId, userEmail))) {
    return <AccessNotice workspace="the Newsletter workspace" />;
  }

  return (
    <AdminWorkspaceShell>
      <NewsletterWorkspace />
      <Toaster />
    </AdminWorkspaceShell>
  );
}
