import { NextResponse, type NextRequest } from 'next/server';
import type { Data } from '@puckeditor/core';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { convertLegacyPageTemplateToBlocks } from '@/lib/page-legacy-conversion';
import { serializePageOwnership, type PageOwnershipInput } from '@/lib/page-ownership';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';
import { LEGACY_PAGE_TYPES } from '@/lib/puck/legacy-types';

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
}

const ASAP_LEGACY_TYPE_SET = new Set<string>(LEGACY_PAGE_TYPES);

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
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
    const payload = await request.json().catch(() => ({}));
    const publishConverted = parseBoolean(
      (payload as { publishConverted?: unknown }).publishConverted
    );
    const sessionUserId =
      (session as { user?: { id?: string } | null } | null)?.user?.id || 'unknown-user';
    const result = await convertLegacyPageTemplateToBlocks(slug, sessionUserId, {
      publishConverted
    });
    if (!result.page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (!result.converted) {
      if (!result.legacyTemplateTypes.length) {
        return NextResponse.json({ error: 'Page already uses composable blocks.' }, { status: 409 });
      }
      const unsupportedLegacyTypes = result.legacyTemplateTypes.filter(
        (type) => !ASAP_LEGACY_TYPE_SET.has(type)
      );
      return NextResponse.json(
        {
          error:
            unsupportedLegacyTypes.length > 0
              ? `Unsupported legacy page types: ${unsupportedLegacyTypes.join(', ')}`
              : `Legacy page could not be converted: ${result.legacyTemplateTypes.join(', ')}`,
          legacyTemplateTypes: result.legacyTemplateTypes,
          supportedLegacyTypes: LEGACY_PAGE_TYPES
        },
        { status: 409 }
      );
    }

    const published = result.page.publishedData ?? result.page.data ?? null;
    const ownership = serializePageOwnership(result.page as PageOwnershipInput);
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));

    return NextResponse.json({
      slug,
      converted: true,
      snapshotStored: result.snapshotStored,
      snapshotId: result.snapshotId,
      fromType: result.fromType,
      toBlockCount: result.toBlockCount,
      publishedUpdated: result.publishedUpdated,
      legacyTemplateTypes: result.legacyTemplateTypes,
      draftData: result.page.draftData ? sanitizeMaybe(result.page.draftData) : null,
      publishedData: published ? sanitizeMaybe(published) : null,
      publishedAt: result.page.publishedAt ?? null,
      draftUpdatedAt: result.page.draftUpdatedAt ?? null,
      updatedAt: result.page.updatedAt ?? null,
      primaryChapterSlug: ownership.primaryChapterSlug,
      chapterSlugs: ownership.chapterSlugs,
      primaryChapterName: ownership.primaryChapterName
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Legacy conversion failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
