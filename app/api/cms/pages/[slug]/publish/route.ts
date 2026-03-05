import { NextResponse, type NextRequest } from 'next/server';
import type { Data } from '@measured/puck';
import { revalidatePathSafe, revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { publishDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const page = await publishDraftPageData(slug);
    const published = page?.publishedData ?? page?.data ?? null;
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.published(slug));
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    // Ensure the actual route HTML is regenerated immediately (home is served at `/`).
    revalidatePathSafe('/', 'layout');
    revalidatePathSafe(slug === 'home' ? '/' : `/${slug}`, 'page');
    return NextResponse.json({
      slug,
      draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
      publishedData: published ? sanitizeMaybe(published) : null,
      publishedAt: page?.publishedAt ?? null,
      updatedAt: page?.updatedAt ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    const status = message === 'Page not found' ? 404 : message === 'No draft to publish' ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
