import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getChapterName, normalizeChapterSlug } from '@/lib/chapters';
import { connectDB } from '@/lib/db';
import { requireAdmin } from '@/lib/roles';
import { NewsArticle } from '@/models/NewsArticle';
import { Page } from '@/models/Page';

function toIso(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed || null;
  }
  return null;
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  if (!session || !(await requireAdmin(userId, user?.email || null))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const [pageRows, newsRows] = await Promise.all([
    Page.find({ 'pendingPublishRequest.requestedAt': { $ne: null } })
      .sort({ 'pendingPublishRequest.requestedAt': 1 })
      .select({
        slug: 1,
        title: 1,
        revision: 1,
        draftUpdatedAt: 1,
        publishedAt: 1,
        pendingPublishRequest: 1
      })
      .lean(),
    NewsArticle.find({ 'pendingPublishRequest.requestedAt': { $ne: null } })
      .sort({ 'pendingPublishRequest.requestedAt': 1 })
      .select({
        slug: 1,
        title: 1,
        tag: 1,
        primaryChapterSlug: 1,
        revision: 1,
        status: 1,
        date: 1,
        updatedAt: 1,
        pendingPublishRequest: 1
      })
      .lean()
  ]);

  const pages = pageRows.map((row) => {
    const typed = row as {
      slug?: string;
      title?: string;
      revision?: number;
      draftUpdatedAt?: Date | string | null;
      publishedAt?: Date | string | null;
      pendingPublishRequest?: {
        requestId?: string | null;
        baseRevision?: number | null;
        requestedAt?: Date | string | null;
        requestedByUserId?: string | null;
        requestedByEmail?: string | null;
        requestedByName?: string | null;
      } | null;
    };

    return {
      slug: typed.slug || '',
      title: typed.title || typed.slug || 'Untitled page',
      revision: typeof typed.revision === 'number' ? typed.revision : null,
      draftUpdatedAt: toIso(typed.draftUpdatedAt),
      publishedAt: toIso(typed.publishedAt),
      requestId: typed.pendingPublishRequest?.requestId || null,
      baseRevision:
        typeof typed.pendingPublishRequest?.baseRevision === 'number'
          ? typed.pendingPublishRequest.baseRevision
          : typeof typed.revision === 'number'
            ? typed.revision
            : null,
      requestedAt: toIso(typed.pendingPublishRequest?.requestedAt),
      requestedByUserId: typed.pendingPublishRequest?.requestedByUserId || null,
      requestedByEmail: typed.pendingPublishRequest?.requestedByEmail || null,
      requestedByName: typed.pendingPublishRequest?.requestedByName || null
    };
  });

  const news = newsRows.map((row) => {
    const typed = row as {
      slug?: string;
      title?: string;
      tag?: string;
      primaryChapterSlug?: string;
      revision?: number;
      status?: 'draft' | 'scheduled' | 'published';
      date?: string;
      updatedAt?: Date | string | null;
      pendingPublishRequest?: {
        requestId?: string | null;
        baseRevision?: number | null;
        requestedAt?: Date | string | null;
        requestedByUserId?: string | null;
        requestedByEmail?: string | null;
        requestedByName?: string | null;
        requestedMode?: 'publish' | 'scheduled';
        requestedPublishAt?: Date | string | null;
      } | null;
    };

    return {
      slug: typed.slug || '',
      title: typed.title || typed.slug || 'Untitled article',
      tag: typed.tag || 'Announcements',
      primaryChapterName: getChapterName(normalizeChapterSlug(typed.primaryChapterSlug)),
      revision: typeof typed.revision === 'number' ? typed.revision : null,
      status: typed.status || 'draft',
      date: typed.date || 'Date TBA',
      updatedAt: toIso(typed.updatedAt),
      requestId: typed.pendingPublishRequest?.requestId || null,
      baseRevision:
        typeof typed.pendingPublishRequest?.baseRevision === 'number'
          ? typed.pendingPublishRequest.baseRevision
          : typeof typed.revision === 'number'
            ? typed.revision
            : null,
      requestedAt: toIso(typed.pendingPublishRequest?.requestedAt),
      requestedByUserId: typed.pendingPublishRequest?.requestedByUserId || null,
      requestedByEmail: typed.pendingPublishRequest?.requestedByEmail || null,
      requestedByName: typed.pendingPublishRequest?.requestedByName || null,
      requestedMode: typed.pendingPublishRequest?.requestedMode || 'publish',
      requestedPublishAt: toIso(typed.pendingPublishRequest?.requestedPublishAt)
    };
  });

  return NextResponse.json({ pages, news });
}
