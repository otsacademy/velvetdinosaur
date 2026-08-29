import { NextResponse, type NextRequest } from 'next/server';
import type { Data } from '@puckeditor/core';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { rollbackLegacyPageTemplateConversion } from '@/lib/page-legacy-conversion';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const result = await rollbackLegacyPageTemplateConversion(slug);
    if (!result.page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }
    if (!result.restored) {
      return NextResponse.json({ error: 'No legacy conversion snapshot is available.' }, { status: 409 });
    }

    const published = result.page.publishedData ?? result.page.data ?? null;
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));

    return NextResponse.json({
      slug,
      restored: true,
      snapshotId: result.snapshotId,
      draftData: result.page.draftData ? sanitizeMaybe(result.page.draftData) : null,
      publishedData: published ? sanitizeMaybe(published) : null,
      publishedAt: result.page.publishedAt ?? null,
      draftUpdatedAt: result.page.draftUpdatedAt ?? null,
      updatedAt: result.page.updatedAt ?? null
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Legacy rollback failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
