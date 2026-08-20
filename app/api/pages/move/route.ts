import { NextResponse } from 'next/server';
import { z } from 'zod';
import { revalidatePathSafe, revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { PageRedirect } from '@/models/PageRedirect';
import { isAdminOnly } from '@/lib/site-config';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { pageTags } from '@/lib/cache-tags';
import { normalizePath } from '@/lib/page-paths';
import { isSitePathBlocked, isStaticSitePathname } from '@/lib/site-reserved-paths';
import { getSitePageBySlug } from '@/lib/site-pages';
import { sitePageHref } from '@/lib/page-locations';
import { rewriteLinksToPage, updateInboundLinks } from '@/lib/page-link-rewrite';

const MoveSchema = z.object({
  slug: z.string().min(1),
  path: z.string().min(1)
});

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
    const payload = MoveSchema.parse(await request.json().catch(() => ({})));
    const slug = payload.slug.trim().toLowerCase();

    if (slug === 'home' || isSiteChromeSlug(slug)) {
      return NextResponse.json({ error: 'This page cannot be moved' }, { status: 400 });
    }
    if (slug.startsWith('stay-')) {
      return NextResponse.json({ error: 'Stay pages cannot be moved' }, { status: 400 });
    }
    const sitePage = getSitePageBySlug(slug);
    if (sitePage && isStaticSitePathname(sitePage.pathname)) {
      // Pages served by hardcoded routes keep their URLs until those routes are retired.
      return NextResponse.json({ error: 'This page has a fixed location' }, { status: 400 });
    }

    const path = normalizePath(payload.path);
    if (!path) {
      return NextResponse.json({ error: 'Invalid location' }, { status: 400 });
    }
    if (isSitePathBlocked(path)) {
      return NextResponse.json({ error: 'That location is reserved' }, { status: 400 });
    }

    const conn = await connectDB();
    if (!conn) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
    }

    const doc = await Page.findOne({ slug });
    if (!doc) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const oldHref = sitePageHref({ slug, path: doc.path });
    const newHref = `/${path}`;
    if (oldHref === newHref) {
      return NextResponse.json({ ok: true, unchanged: true, slug, path, href: newHref });
    }

    // Collision check against explicit paths and legacy slug-as-path pages.
    const pathCollision = await Page.exists({ path, _id: { $ne: doc._id } });
    const legacyCollision = !path.includes('/')
      ? await Page.exists({ slug: path, path: { $exists: false }, _id: { $ne: doc._id } })
      : null;
    if (pathCollision || legacyCollision) {
      return NextResponse.json({ error: 'URL already in use' }, { status: 409 });
    }

    // Order matters without transactions: page first (stays reachable), then
    // redirects, then inbound links. Worst case on mid-failure is stale links —
    // the same failure mode delete already accepts.
    await Page.updateOne(
      { slug },
      { $set: { path, ...(userId ? { updatedByUserId: userId } : {}) } }
    );

    const oldEffectivePath = doc.path ?? (oldHref === '/' ? 'home' : oldHref.slice(1));
    await PageRedirect.updateOne(
      { fromPath: oldEffectivePath },
      { $set: { toSlug: slug } },
      { upsert: true }
    );
    // The new URL is now a live page; no redirect may occupy it.
    await PageRedirect.deleteOne({ fromPath: path });

    await updateInboundLinks(slug, (data) =>
      rewriteLinksToPage(data, { slug, href: oldHref }, newHref)
    );

    await logAudit({
      action: 'page.move',
      actorUserId: userId,
      metadata: { slug, from: oldHref, to: newHref }
    });

    revalidateTag(pageTags.content);
    revalidateTag(pageTags.published(slug));
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
    revalidateTag(pageTags.redirects);
    revalidatePathSafe(oldHref, 'page');
    revalidatePathSafe(newHref, 'page');

    return NextResponse.json({ ok: true, slug, path, href: newHref });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Move failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
