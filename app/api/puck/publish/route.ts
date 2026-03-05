import { NextResponse } from 'next/server';
import { revalidatePathSafe, revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { publishDraftPageData } from '@/lib/pages';
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

  const body = await request.json().catch(() => ({}));
  const slug = body?.slug || 'home';

  try {
    await publishDraftPageData(slug);
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.published(slug));
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    revalidatePathSafe('/', 'layout');
    revalidatePathSafe(slug === 'home' ? '/' : `/${slug}`, 'page');
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
