import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { listPages } from '@/lib/pages';
import { isAdminOnly } from '@/lib/site-config';

export async function GET(request: Request) {
  unstable_noStore();
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const includeEmpty = url.searchParams.get('includeEmpty') === 'true';
  const pages = await listPages({ includeEmpty });
  return NextResponse.json({ pages });
}
