import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

function denied(status: 401 | 403) {
  return new NextResponse(status === 401 ? 'Unauthorized' : 'Forbidden', {
    status,
    headers: noCacheHeaders
  });
}

async function handleAuth(request: Request) {
  const result = await requireInstallerAdmin(request.headers);
  if (!result.ok) {
    return denied(result.status === 403 ? 403 : 401);
  }

  const user = (result.session as { user?: { id?: string | null; email?: string | null; name?: string | null } })
    ?.user;
  const headers = new Headers(noCacheHeaders);
  headers.set('X-Auth-User', user?.id ?? '');
  headers.set('X-Auth-Email', user?.email ?? '');
  headers.set('X-Auth-Name', user?.name ?? '');

  return new NextResponse('OK', { status: 200, headers });
}

export async function GET(request: Request) {
  return handleAuth(request);
}

export async function POST(request: Request) {
  return handleAuth(request);
}

export async function HEAD(request: Request) {
  return handleAuth(request);
}
