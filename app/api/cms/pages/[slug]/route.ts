import { unstable_noStore } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Data } from '@puckeditor/core';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { serializePageOwnership } from '@/lib/page-ownership';
import { getPageRecordFresh, saveDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke';

const OwnershipSchema = z.object({
  primaryChapterSlug: z.string().optional(),
  chapterSlugs: z.array(z.string()).optional()
});

const DraftSchema = z.object({
  data: z.unknown(),
  pageOwnership: OwnershipSchema.optional()
});

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  unstable_noStore();
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isEditorSmokeRequest(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const page = await getPageRecordFresh(slug);

  const published = page?.publishedData ?? page?.data ?? null;
  const ownership = serializePageOwnership(page);

  return NextResponse.json({
    slug,
    draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
    publishedData: published ? sanitizeMaybe(published) : null,
    publishedAt: page?.publishedAt ?? null,
    revision: typeof page?.revision === 'number' ? page.revision : null,
    draftUpdatedAt: page?.draftUpdatedAt ?? null,
    updatedAt: page?.updatedAt ?? null,
    primaryChapterSlug: ownership.primaryChapterSlug,
    chapterSlugs: ownership.chapterSlugs,
    primaryChapterName: ownership.primaryChapterName,
    pendingPublishRequest: serializePendingPublishRequest(page?.pendingPublishRequest)
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isEditorSmokeRequest(request.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;

  const resolvedParams = await params;
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const payload = DraftSchema.parse(await request.json().catch(() => ({})));
    const sanitized = sanitizeMaybe(payload.data);
    const page = await saveDraftPageData(slug, sanitized, userId, payload.pageOwnership);
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
      draftUpdatedAt: page?.draftUpdatedAt ?? null,
      updatedAt: page?.updatedAt ?? null,
      primaryChapterSlug: ownership.primaryChapterSlug,
      chapterSlugs: ownership.chapterSlugs,
      primaryChapterName: ownership.primaryChapterName,
      pendingPublishRequest: serializePendingPublishRequest(page?.pendingPublishRequest)
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    const status =
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
