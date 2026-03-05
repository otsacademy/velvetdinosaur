import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { saveDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

function isSmokeRequest(request: Request) {
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  if (!smokeToken) return false;
  return request.headers.get('x-vd-editor-smoke') === smokeToken;
}

export async function POST(request: Request) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const slug = body?.slug || 'home';
  const data = body?.data;
  if (!data) {
    return NextResponse.json({ error: 'Missing data' }, { status: 400 });
  }

  await saveDraftPageData(slug, sanitizeData(data));
  revalidateTag(pageTags.content);
  revalidateTag(pageTags.draft(slug));
  revalidateTag(pageTags.record(slug));
  revalidateTag(pageTags.list());
  revalidateTag(pageTags.list(true));
  return NextResponse.json({ ok: true });
}
