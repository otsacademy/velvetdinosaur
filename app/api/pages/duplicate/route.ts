import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { Data } from '@measured/puck';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { isAdminOnly } from '@/lib/site-config';
import { getPageRecordFresh, saveDraftPageData } from '@/lib/pages';
import { sanitizeData } from '@/puck/validate';
import { Page } from '@/models/Page';
import { pageTags } from '@/lib/cache-tags';

const DuplicateSchema = z.object({
  sourceSlug: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().optional()
});

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function applyTitle(data: Data, title?: string) {
  if (!title) return data;
  if (data.root?.props && typeof data.root.props === 'object') {
    (data.root.props as Record<string, unknown>).title = title;
  }
  return data;
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

  try {
    const payload = DuplicateSchema.parse(await request.json().catch(() => ({})));
    const sourceSlug = normalizeSlug(payload.sourceSlug);
    const slug = normalizeSlug(payload.slug);
    if (!sourceSlug || !slug) {
      return NextResponse.json({ error: 'Missing slug' }, { status: 400 });
    }
    if (sourceSlug === slug) {
      return NextResponse.json({ error: 'Slug must be different from source' }, { status: 400 });
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

    const nextData = sanitizeData(applyTitle(data, payload.title?.trim()));
    const page = await saveDraftPageData(slug, nextData);
    if (payload.title?.trim()) {
      page.title = payload.title.trim();
      await page.save();
    }

    revalidateTag(pageTags.content);
    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));

    return NextResponse.json({ ok: true, slug });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.flatten() }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Duplicate failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
