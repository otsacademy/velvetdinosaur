import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { PageRedirect } from '@/models/PageRedirect';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';
import { sitePageHref } from '@/lib/page-locations';
import { removeLinksToPage } from '@/lib/page-link-rewrite';

type PageSnapshot = {
  _id: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  data?: unknown;
};

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
  const slug = body?.slug as string | undefined;
  if (!slug) {
    return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
  }
  if (slug === 'home') {
    return NextResponse.json({ error: 'Cannot delete home' }, { status: 400 });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const doc = (await Page.findOne({ slug }).select({ slug: 1, path: 1 }).lean()) as {
    slug: string;
    path?: string;
  } | null;

  await Page.deleteOne({ slug });

  const target = { slug, href: sitePageHref(doc ?? { slug }) };
  const cleanup = (data: unknown) =>
    data ? removeLinksToPage(data, target) : { value: data, changed: false };

  const pages = await Page.find({ slug: { $ne: slug } })
    .select({ draftData: 1, publishedData: 1, data: 1 })
    .lean<PageSnapshot[]>();

  const updates = pages.map(async (page) => {
    const draft = cleanup(page.draftData);
    const published = cleanup(page.publishedData);
    const legacy = cleanup(page.data);

    if (!draft.changed && !published.changed && !legacy.changed) return;

    await Page.updateOne(
      { _id: page._id },
      {
        $set: {
          ...(draft.changed ? { draftData: draft.value } : {}),
          ...(published.changed ? { publishedData: published.value } : {}),
          ...(legacy.changed ? { data: legacy.value } : {}),
          ...(userId ? { updatedByUserId: userId } : {})
        }
      }
    );
  });

  await Promise.all(updates);

  // Drop redirects pointing at the deleted page and any record occupying its URL.
  const effectivePath = doc?.path ?? slug;
  await PageRedirect.deleteMany({ $or: [{ toSlug: slug }, { fromPath: effectivePath }] });

  await logAudit({
    action: 'page.delete',
    actorUserId: userId,
    metadata: { slug }
  });

  revalidateTag(pageTags.content);
  revalidateTag(pageTags.published(slug));
  revalidateTag(pageTags.draft(slug));
  revalidateTag(pageTags.record(slug));
  revalidateTag(pageTags.list());
  revalidateTag(pageTags.list(true));
  revalidateTag(pageTags.redirects);

  return NextResponse.json({ ok: true });
}
