import { unstable_noStore } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import type { Data } from '@measured/puck';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { getPageRecordFresh, saveDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

const DraftSchema = z.object({
  data: z.unknown()
});

function sanitizeMaybe(data: unknown) {
  if (!data || typeof data !== 'object') return data;
  return sanitizeData(data as Data);
}

function isSmokeRequest(request: NextRequest) {
  const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN;
  if (!smokeToken) return false;
  return request.headers.get('x-vd-editor-smoke') === smokeToken;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  unstable_noStore();
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const page = await getPageRecordFresh(slug);
  const published = page?.publishedData ?? page?.data ?? null;

  return NextResponse.json({
    slug,
    draftData: page?.draftData ? sanitizeMaybe(page.draftData) : null,
    publishedData: published ? sanitizeMaybe(published) : null,
    publishedAt: page?.publishedAt ?? null,
    draftUpdatedAt: page?.draftUpdatedAt ?? null,
    updatedAt: page?.updatedAt ?? null
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } | Promise<{ slug: string }> }
) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session && !isSmokeRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams.slug?.trim();
  if (!slug) {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  try {
    const payload = DraftSchema.parse(await request.json().catch(() => ({})));
    const sanitized = sanitizeMaybe(payload.data);
    const page = await saveDraftPageData(slug, sanitized);
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
      draftUpdatedAt: page?.draftUpdatedAt ?? null,
      updatedAt: page?.updatedAt ?? null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
