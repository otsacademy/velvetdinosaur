import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

type PageSnapshot = {
  _id: unknown;
  draftData?: unknown;
  publishedData?: unknown;
  data?: unknown;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function shouldRemoveLinkItem(item: unknown, slug: string) {
  if (!isObject(item)) return false;
  const href = typeof item.href === 'string' ? item.href.trim() : null;
  const url = typeof item.url === 'string' ? item.url.trim() : null;
  const pageSlug = typeof item.pageSlug === 'string' ? item.pageSlug.trim() : null;
  const itemSlug = typeof item.slug === 'string' ? item.slug.trim() : null;
  const livePath = slug === 'home' ? '/' : `/${slug}`;

  if (href && (href === livePath || href === `/${slug}` || href === slug)) return true;
  if (url && (url === livePath || url === `/${slug}` || url === slug)) return true;
  if (pageSlug && pageSlug === slug) return true;
  if (itemSlug && itemSlug === slug) return true;
  return false;
}

function cleanupValue(value: unknown, slug: string): { value: unknown; changed: boolean } {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value
      .map((item) => {
        const result = cleanupValue(item, slug);
        if (result.changed) changed = true;
        return result.value;
      })
      .filter((item) => {
        if (shouldRemoveLinkItem(item, slug)) {
          changed = true;
          return false;
        }
        return true;
      });
    return { value: next, changed };
  }

  if (isObject(value)) {
    let changed = false;
    const next: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value)) {
      const result = cleanupValue(val, slug);
      if (result.changed) changed = true;
      next[key] = result.value;
    }
    return { value: next, changed };
  }

  return { value, changed: false };
}

function cleanupPageData(data: unknown, slug: string) {
  if (!data) return { value: data, changed: false };
  return cleanupValue(data, slug);
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

  await Page.deleteOne({ slug });

  const pages = await Page.find({ slug: { $ne: slug } })
    .select({ draftData: 1, publishedData: 1, data: 1 })
    .lean<PageSnapshot[]>();

  const updates = pages.map(async (page) => {
    const draft = cleanupPageData(page.draftData, slug);
    const published = cleanupPageData(page.publishedData, slug);
    const legacy = cleanupPageData(page.data, slug);

    if (!draft.changed && !published.changed && !legacy.changed) return;

    await Page.updateOne(
      { _id: page._id },
      {
        $set: {
          ...(draft.changed ? { draftData: draft.value } : {}),
          ...(published.changed ? { publishedData: published.value } : {}),
          ...(legacy.changed ? { data: legacy.value } : {})
        }
      }
    );
  });

  await Promise.all(updates);

  revalidateTag(pageTags.content);
  revalidateTag(pageTags.published(slug));
  revalidateTag(pageTags.draft(slug));
  revalidateTag(pageTags.record(slug));
  revalidateTag(pageTags.list());
  revalidateTag(pageTags.list(true));

  return NextResponse.json({ ok: true });
}
