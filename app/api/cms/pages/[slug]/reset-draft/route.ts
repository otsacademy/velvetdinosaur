import { NextResponse, type NextRequest } from 'next/server';
import type { Data } from '@measured/puck';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { resetDraftPageData } from '@/lib/pages';
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
    const page = await resetDraftPageData(slug);
    if (!page) {
      return NextResponse.json({ error: 'No draft to reset' }, { status: 409 });
    }
    const published = page?.publishedData ?? page?.data ?? null;
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    return NextResponse.json({
      slug,
      draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
      publishedData: published ? sanitizeMaybe(published) : null,
      publishedAt: page?.publishedAt ?? null,
      updatedAt: page?.updatedAt ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Reset failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
