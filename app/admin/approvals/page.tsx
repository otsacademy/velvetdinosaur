import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { ApprovalsManager } from '@/components/admin/approvals/approvals-manager';

export default async function ApprovalsPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;

  if (!session) {
    redirect('/sign-in?next=/admin/approvals');
  }

  if (!(await requireAdmin(userId, user?.email || null))) {
    return <AccessNotice workspace="Publish Approvals" />;
  }

  return (
    <main className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Publish Approvals</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Review pending page and news publish requests from non-admin users.
        </p>
      </div>
      <ApprovalsManager />
    </main>
  );
}
