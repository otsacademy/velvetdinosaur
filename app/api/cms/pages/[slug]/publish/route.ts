import { NextResponse, type NextRequest } from 'next/server';
import type { Data } from '@puckeditor/core';
import { revalidatePathSafe, revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { serializePageOwnership } from '@/lib/page-ownership';
import { getPageRecordFresh, publishDraftPageData, requestPagePublishApproval } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';
import { sitePageHref } from '@/lib/page-locations';
import { listLegacyPageComponents } from '@/lib/puck/legacy-page-components';
import { getUserRole } from '@/lib/roles';

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
}

function serializePendingPublishRequest(value: unknown) {
  if (!value || typeof value !== 'object') return null;
  const request = value as {
    requestId?: string | null;
    baseRevision?: number | null;
    requestedAt?: Date | string | null;
    requestedByUserId?: string | null;
    requestedByEmail?: string | null;
    requestedByName?: string | null;
  };
  const requestedAt =
    request.requestedAt instanceof Date
      ? request.requestedAt.toISOString()
      : typeof request.requestedAt === 'string'
        ? request.requestedAt
        : null;

  if (!requestedAt) return null;
  return {
    requestId: request.requestId ?? null,
    baseRevision: typeof request.baseRevision === 'number' ? request.baseRevision : null,
    requestedAt,
    requestedByUserId: request.requestedByUserId ?? null,
    requestedByEmail: request.requestedByEmail ?? null,
    requestedByName: request.requestedByName ?? null
  };
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
  const user = (session as { user?: { id?: string; email?: string; name?: string } } | null)?.user;
  const userId = user?.id || null;
  const userRole = await getUserRole(userId, user?.email || null);
  const isAdminUser = userRole === 'admin';

  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const payload = await request.json().catch(() => ({}));
    const forceLegacyReplacement = parseBoolean(
      (payload as { forceLegacyReplacement?: unknown }).forceLegacyReplacement
    );
    const existing = await getPageRecordFresh(slug);
    if (!isAdminUser) {
      const page = await requestPagePublishApproval(slug, {
        userId,
        email: user?.email || null,
        name: user?.name || null
      });
      const published = page?.publishedData ?? page?.data ?? null;
      const ownership = serializePageOwnership(page);
      revalidateTag(pageTags.draft(slug));
      revalidateTag(pageTags.record(slug));
      revalidateTag(pageTags.list());
      revalidateTag(pageTags.list(true));
      return NextResponse.json({
        slug,
        draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
        publishedData: published ? sanitizeMaybe(published) : null,
        publishedAt: page?.publishedAt ?? null,
        revision: typeof page?.revision === 'number' ? page.revision : null,
        updatedAt: page?.updatedAt ?? null,
        primaryChapterSlug: ownership.primaryChapterSlug,
        chapterSlugs: ownership.chapterSlugs,
        primaryChapterName: ownership.primaryChapterName,
        pendingApproval: true,
        pendingPublishRequest: serializePendingPublishRequest(page?.pendingPublishRequest)
      });
    }

    const draftData = existing?.draftData ?? existing?.publishedData ?? existing?.data ?? null;
    const publishedData = existing?.publishedData ?? existing?.data ?? null;
    const draftLegacyTypes = listLegacyPageComponents(draftData);
    const publishedLegacyTypes = listLegacyPageComponents(publishedData);
    const convertedDraftReplacingLegacy =
      publishedLegacyTypes.length > 0 && draftLegacyTypes.length === 0;

    if (convertedDraftReplacingLegacy && !forceLegacyReplacement) {
      return NextResponse.json(
        {
          error:
            'Publishing this draft will replace a legacy live page with converted blocks. Set forceLegacyReplacement=true to continue.',
          requiresForceLegacyReplacement: true,
          publishedLegacyTypes,
          draftLegacyTypes
        },
        { status: 409 }
      );
    }

    const page = await publishDraftPageData(slug, userId);
    const published = page?.publishedData ?? page?.data ?? null;
    const ownership = serializePageOwnership(page);
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.published(slug));
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    // Ensure the actual route HTML is regenerated immediately (home is served at `/`).
    const livePath = sitePageHref({ slug, path: page?.path });
    revalidatePathSafe('/', 'layout');
    revalidatePathSafe(livePath, 'page');
    return NextResponse.json({
      slug,
      draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
      publishedData: published ? sanitizeMaybe(published) : null,
      publishedAt: page?.publishedAt ?? null,
      revision: typeof page?.revision === 'number' ? page.revision : null,
      updatedAt: page?.updatedAt ?? null,
      primaryChapterSlug: ownership.primaryChapterSlug,
      chapterSlugs: ownership.chapterSlugs,
      primaryChapterName: ownership.primaryChapterName,
      pendingApproval: false,
      pendingPublishRequest: serializePendingPublishRequest(page?.pendingPublishRequest)
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    const status = message === 'Page not found' ? 404 : message === 'No draft to publish' ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
