import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { UsersManager } from '@/components/admin/users/users-manager';

export default async function UsersPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;

  if (!session) {
    redirect('/sign-in?next=/admin/users');
  }

  if (!(await requireAdmin(userId, user?.email || null))) {
    return <AccessNotice workspace="Users & Invitations" />;
  }

  return (
    <main className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Users & Invitations</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Manage active users, update roles, and control invitation links from one admin workspace.
        </p>
      </div>
      <UsersManager />
    </main>
  );
}
