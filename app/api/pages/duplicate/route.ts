import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Data } from '@puckeditor/core';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { serializePageOwnership } from '@/lib/page-ownership';
import { isAdminOnly } from '@/lib/site-config';
import { getPageRecordFresh, saveDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { Page } from '@/models/Page';
import { PageRedirect } from '@/models/PageRedirect';
import { pageTags } from '@/lib/cache-tags';
import { normalizePath, slugFromPath, slugifySegment } from '@/lib/page-paths';
import { isSitePathBlocked } from '@/lib/site-reserved-paths';
import { sitePageHref } from '@/lib/page-locations';

const DuplicateSchema = z.object({
  sourceSlug: z.string().min(1),
  slug: z.string().min(1).optional(),
  path: z.string().optional(),
  title: z.string().optional()
});

function applyTitle(data: Data, title?: string) {
  if (!title) return data;
  if (data.root?.props && typeof data.root.props === 'object') {
    (data.root.props as Record<string, unknown>).title = title;
  }
  return data;
}

async function isPathTaken(path: string) {
  if (await Page.exists({ path })) return true;
  if (!path.includes('/') && (await Page.exists({ slug: path, path: { $exists: false } }))) {
    return true;
  }
  return false;
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
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;

  try {
    const payload = DuplicateSchema.parse(await request.json().catch(() => ({})));
    const sourceSlug = slugifySegment(payload.sourceSlug);

    let path: string | null = null;
    if (typeof payload.path === 'string' && payload.path.trim()) {
      path = normalizePath(payload.path);
      if (!path) {
        return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
      }
      if (isSitePathBlocked(path)) {
        return NextResponse.json({ error: 'That location is reserved' }, { status: 400 });
      }
    }

    const slug = slugifySegment(payload.slug || '') || (path ? slugFromPath(path) : '');
    if (!sourceSlug || !slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }
    if (sourceSlug === slug) {
      return NextResponse.json({ error: 'Slug must be different from source' }, { status: 400 });
    }
    if (!path && isSitePathBlocked(slug)) {
      return NextResponse.json({ error: 'That location is reserved' }, { status: 400 });
    }

    const source = await getPageRecordFresh(sourceSlug);
    const data = (source?.draftData ?? source?.publishedData ?? source?.data ?? null) as Data | null;
    if (!data) {
      return NextResponse.json({ error: 'Source page not found' }, { status: 404 });
    }

    const existing = await Page.exists({ slug });
    if (existing) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }
    if (path && (await isPathTaken(path))) {
      return NextResponse.json({ error: 'URL already in use' }, { status: 409 });
    }
    await PageRedirect.deleteOne({ fromPath: path ?? slug });

    const nextData = sanitizeData(applyTitle(data, payload.title?.trim()));
    const page = await saveDraftPageData(slug, nextData, userId, serializePageOwnership(source));
    if (payload.title?.trim()) {
      page.title = payload.title.trim();
    }
    if (path) {
      page.path = path;
    }
    if ((payload.title?.trim() || path) && typeof page.save === 'function') {
      await page.save();
    }

    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    revalidateTag(pageTags.redirects);

    return NextResponse.json({ ok: true, slug, path, href: sitePageHref({ slug, path }) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Duplicate failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
