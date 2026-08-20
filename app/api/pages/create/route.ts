import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { saveDraftPageData } from '@/lib/pages';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';
import { normalizePath, slugFromPath, slugifySegment } from '@/lib/page-paths';
import { isSitePathBlocked } from '@/lib/site-reserved-paths';
import { sitePageHref } from '@/lib/page-locations';
import { Page } from '@/models/Page';
import { PageRedirect } from '@/models/PageRedirect';

// Rejects when the public URL is already taken — by an explicit path or by a
// legacy page whose slug doubles as its path.
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

  const body = await request.json().catch(() => ({}));
  const slugRaw = body?.slug as string | undefined;
  const titleRaw = body?.title as string | undefined;
  const pathRaw = body?.path as string | undefined;

  let path: string | null = null;
  if (typeof pathRaw === 'string' && pathRaw.trim()) {
    path = normalizePath(pathRaw);
    if (!path) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    if (isSitePathBlocked(path)) {
      return NextResponse.json({ error: 'That location is reserved' }, { status: 400 });
    }
  }

  const slug = slugifySegment(slugRaw || '') || (path ? slugFromPath(path) : '');
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }
  if (!path && isSitePathBlocked(slug)) {
    return NextResponse.json({ error: 'That location is reserved' }, { status: 400 });
  }
  const title = typeof titleRaw === 'string' ? titleRaw.trim() : '';

  try {
    const conn = await connectDB();
    if (conn) {
      if (await Page.exists({ slug })) {
        return NextResponse.json({ error: 'Page already exists' }, { status: 409 });
      }
      if (path && (await isPathTaken(path))) {
        return NextResponse.json({ error: 'URL already in use' }, { status: 409 });
      }
      // A new page at this URL supersedes any redirect that pointed away from it.
      await PageRedirect.deleteOne({ fromPath: path ?? slug });
    }

    const data = defaultData(slug);
    if (title && data?.root?.props && typeof data.root.props === 'object') {
      (data.root.props as Record<string, unknown>).title = title;
    }
    const page = await saveDraftPageData(slug, sanitizeData(data), userId);
    if (title) {
      page.title = title;
    }
    if (path) {
      page.path = path;
    }
    if ((title || path) && typeof page.save === 'function') {
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
    const message = error instanceof Error ? error.message : 'Create failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
