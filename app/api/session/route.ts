import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { isAdminOnly } from '@/lib/site-config';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

export type PublicSession = {
  user: {
    id: string | null;
    name?: string | null;
    email?: string | null;
  } | null;
  roles?: string[];
  expiresAt?: string | null;
};

export function pickPublicSession(session: unknown): PublicSession {
  const typed = session as {
    user?: { id?: string; name?: string; email?: string; roles?: string[] };
    roles?: string[];
    expiresAt?: string | Date;
    session?: { expiresAt?: string | Date };
  };
  const user = typed?.user;
  const roles = Array.isArray(typed?.roles)
    ? typed.roles
    : Array.isArray(user?.roles)
      ? user.roles
      : undefined;
  const rawExpires = typed?.expiresAt ?? typed?.session?.expiresAt;
  const expiresAt =
    typeof rawExpires === 'string'
      ? rawExpires
      : rawExpires instanceof Date
        ? rawExpires.toISOString()
        : null;

  return {
    user: user
      ? {
          id: user.id ?? null,
          name: user.name ?? null,
          email: user.email ?? null
        }
      : null,
    roles,
    expiresAt
  };
}

export async function GET(request: Request) {
  unstable_noStore();
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noCacheHeaders });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ session: null }, { headers: noCacheHeaders });
  }
  return NextResponse.json({ session: pickPublicSession(session) }, { headers: noCacheHeaders });
}
