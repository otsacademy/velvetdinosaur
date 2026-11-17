import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { getAuth } from '@/lib/auth';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';

const noCacheHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

export async function GET(request: Request) {
  unstable_noStore();
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: noCacheHeaders });
  }
  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session && !isEditorSmokeRequest(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noCacheHeaders });
  }
  const url = new URL(request.url);
  const slug = url.searchParams.get('slug') || 'home';
  const data = await getDraftPageData(slug);
  return NextResponse.json({ data: sanitizeData(data) }, { headers: noCacheHeaders });
}
