import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { saveDraftPageData } from '@/lib/pages';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function POST(request: Request) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const slugRaw = body?.slug as string | undefined;
  const titleRaw = body?.title as string | undefined;
  const slug = normalizeSlug(slugRaw || '');
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

  try {
    const data = defaultData(slug);
    if (title && data?.root?.props && typeof data.root.props === 'object') {
      (data.root.props as Record<string, unknown>).title = title;
    }
    const page = await saveDraftPageData(slug, sanitizeData(data));
    if (title) {
      page.title = title;
      await page.save();
    }
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
