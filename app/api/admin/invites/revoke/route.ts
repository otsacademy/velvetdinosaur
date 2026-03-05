import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { revokeInvite } from '@/lib/invites';
import { requireAdmin } from '@/lib/roles';

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  if (!session || !(await requireAdmin(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = body?.id as string | undefined;
  if (!id) {
    return NextResponse.json({ error: 'Invite id required' }, { status: 400 });
  }

  const revoked = await revokeInvite(id, userId);
  if (!revoked) {
    return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, invite: revoked });
}
