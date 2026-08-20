import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { canManageReviewMode } from '@/lib/review/review-mode-access';
import { requireAdmin } from '@/lib/roles';
import { setReviewLinkOverrideLock } from '@/lib/security/review-links';

async function requireAdminSession(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  if (!session || !(await requireAdmin(userId, user?.email || null)) || !canManageReviewMode(user?.email || null, request.url)) {
    return false;
  }
  return true;
}

export async function POST(request: Request) {
  const ok = await requireAdminSession(request);
  if (!ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const id = typeof body?.id === 'string' ? body.id.trim() : '';
  const overrideLock = body?.overrideLock === true;
  if (!id) {
    return NextResponse.json({ error: 'Review link id is required' }, { status: 400 });
  }

  const updated = await setReviewLinkOverrideLock(id, overrideLock);
  if (!updated) {
    return NextResponse.json({ error: 'Review link not found' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, link: updated });
}
