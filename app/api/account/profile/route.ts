import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getUserRole, roleIsAdmin } from '@/lib/roles';

/**
 * Minimal account profile endpoint backing the admin workspace shell
 * (admin-workspace-shell.client.tsx fetches it to decide nav visibility).
 * The full profile workspace arrives with the users/accounts adoption wave;
 * until then this site has no review-mode machinery, so canManageReviewMode
 * is always false.
 */
export async function GET(request: Request) {
  unstable_noStore();

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; name?: string | null; email?: string | null } } | null)?.user;
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(user.id, user.email ?? null);

  return NextResponse.json({
    userId: user.id,
    displayName: user.name ?? null,
    email: user.email ?? null,
    isAdmin: roleIsAdmin(role),
    canManageReviewMode: false
  });
}
