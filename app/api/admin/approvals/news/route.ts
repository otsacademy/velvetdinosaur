import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { newsTags } from '@/lib/cache-tags';
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters';
import { connectDB } from '@/lib/db';
import { rewriteInlineMediaForStorage } from '@/lib/inline-media.server';
import { saveNewsArticleSnapshot } from '@/lib/news-article-history.server';
import { requireAdmin } from '@/lib/roles';
import { cleanString } from '@/lib/string-sanitizer';
import { NewsArticle } from '@/models/NewsArticle';

function normalizeSlug(value: unknown) {
  if (typeof value !== 'string') return '';
  try {
    return cleanString(decodeURIComponent(value)).toLowerCase();
  } catch {
    return cleanString(value).toLowerCase();
  }
}

function normalizeAction(value: unknown) {
  return value === 'reject' ? 'reject' : 'approve';
}

function normalizeReason(value: unknown) {
  const trimmed = cleanString(value);
  return trimmed ? trimmed.slice(0, 1000) : null;
}

function parseRevision(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) {
    return Math.floor(value);
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
      return parsed;
    }
  }
  return null;
}

function readDate(value: unknown) {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function hasPendingRequest(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const request = value as { requestedAt?: Date | string | null };
  return Boolean(readDate(request.requestedAt) || (typeof request.requestedAt === 'string' && request.requestedAt.trim()));
}

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;

  if (!session || !(await requireAdmin(userId, user?.email || null))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const payload = body as {
    slug?: unknown;
    action?: unknown;
    requestId?: unknown;
    baseRevision?: unknown;
    rejectionReason?: unknown;
  };
  const slug = normalizeSlug(payload.slug);
  const action = normalizeAction(payload.action);
  const requestedRequestId = cleanString(payload.requestId) || null;
  const requestedBaseRevision = parseRevision(payload.baseRevision);
  const rejectionReason = normalizeReason(payload.rejectionReason);

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const existing = (await NewsArticle.findOne({ slug })
    .select({
      slug: 1,
      title: 1,
      revision: 1,
      status: 1,
      author: 1,
      img: 1,
      content: 1,
      sections: 1,
      photoUrls: 1,
      openGraphImage: 1,
      twitterImage: 1,
      primaryChapterSlug: 1,
      chapterSlugs: 1,
      publishAt: 1,
      publishedAt: 1,
      pendingPublishRequest: 1
    })
    .lean()) as
    | {
        _id?: unknown;
        slug?: string;
        title?: string;
        revision?: number;
        status?: 'draft' | 'scheduled' | 'published';
        author?: { name?: string; img?: string };
        img?: string;
        content?: unknown;
        sections?: unknown;
        photoUrls?: string[];
        openGraphImage?: string;
        twitterImage?: string;
        primaryChapterSlug?: string | null;
        chapterSlugs?: string[] | null;
        publishAt?: Date | string | null;
        publishedAt?: Date | string | null;
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
      }
    | null;

  if (!existing || Array.isArray(existing)) {
    return NextResponse.json({ error: 'Article not found' }, { status: 404 });
  }

  if (!hasPendingRequest(existing.pendingPublishRequest)) {
    return NextResponse.json({ error: 'No pending approval request' }, { status: 409 });
  }

  const expectedRequestId =
    requestedRequestId ||
    (typeof existing.pendingPublishRequest?.requestId === 'string'
      ? existing.pendingPublishRequest.requestId
      : null);
  const expectedBaseRevision =
    requestedBaseRevision ??
    (typeof existing.pendingPublishRequest?.baseRevision === 'number'
      ? existing.pendingPublishRequest.baseRevision
      : null) ??
    (typeof existing.revision === 'number' ? existing.revision : null) ??
    1;

  if (action === 'reject') {
    const query: Record<string, unknown> = {
      slug,
      revision: expectedBaseRevision === 1 ? { $in: [1, null] } : expectedBaseRevision
    };
    if (expectedRequestId) {
      query['pendingPublishRequest.requestId'] = expectedRequestId;
      query['pendingPublishRequest.baseRevision'] = expectedBaseRevision;
    } else {
      query['pendingPublishRequest.requestedAt'] = { $ne: null };
    }

    const result = await NewsArticle.updateOne(query, {
      $set: {
        pendingPublishRequest: null,
        lastRejection: {
          reason: rejectionReason,
          rejectedAt: new Date(),
          rejectedByUserId: userId,
          rejectedByEmail: user?.email || null,
          rejectedByName: null
        }
      },
      $inc: { revision: 1 }
    });
    if (!result.modifiedCount) {
      return NextResponse.json({ error: 'Approval request is stale. Refresh the queue and try again.' }, { status: 409 });
    }

    await logAudit({
      action: 'news.article.publish.reject',
      actorUserId: userId,
      metadata: {
        slug,
        title: existing.title || null,
        requestId: expectedRequestId,
        baseRevision: expectedBaseRevision,
        rejectionReason
      }
    });

    return NextResponse.json({ ok: true, slug, action: 'rejected', rejectionReason });
  }

  const requestedMode = existing.pendingPublishRequest?.requestedMode === 'scheduled' ? 'scheduled' : 'publish';
  const requestedPublishAt = readDate(existing.pendingPublishRequest?.requestedPublishAt);
  const existingPublishedAt = readDate(existing.publishedAt);

  let status: 'scheduled' | 'published' = 'published';
  let publishAt: Date | null = null;
  let publishedAt: Date | null =
    existing.status === 'published' && existingPublishedAt ? existingPublishedAt : new Date();

  if (requestedMode === 'scheduled' && requestedPublishAt && requestedPublishAt.getTime() > Date.now()) {
    status = 'scheduled';
    publishAt = requestedPublishAt;
    if (!publishedAt) {
      publishedAt = new Date();
    }
  }

  const authorName = cleanString(existing.author?.name) || 'ASAP Editorial';
  let authorImage = cleanString(existing.author?.img) || '/images/asap-logo-trimmed.webp';
  const primaryChapterSlug = normalizeChapterSlug(existing.primaryChapterSlug);
  const chapterSlugs = normalizeChapterSlugs(existing.chapterSlugs, primaryChapterSlug);
  let mediaPatch: Record<string, unknown> = {};

  try {
    const media = await rewriteInlineMediaForStorage(
      {
        img: existing.img,
        authorImage,
        content: existing.content,
        sections: existing.sections,
        photoUrls: existing.photoUrls,
        openGraphImage: existing.openGraphImage,
        twitterImage: existing.twitterImage,
      },
      {
        folder: 'news',
        label: `news:${slug}`,
      },
    );
    authorImage = media.value.authorImage;
    mediaPatch = {
      img: media.value.img,
      author: {
        ...(existing.author || {}),
        img: authorImage,
      },
      content: media.value.content,
      sections: media.value.sections,
      photoUrls: media.value.photoUrls,
      openGraphImage: media.value.openGraphImage,
      twitterImage: media.value.twitterImage,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to process inline media';
    const status =
      typeof error === 'object' &&
      error !== null &&
      typeof (error as { status?: unknown }).status === 'number'
        ? (error as { status: number }).status
        : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const updated = (await NewsArticle.findOneAndUpdate(
    {
      slug,
      revision: expectedBaseRevision === 1 ? { $in: [1, null] } : expectedBaseRevision,
      ...(expectedRequestId
        ? {
            'pendingPublishRequest.requestId': expectedRequestId,
            'pendingPublishRequest.baseRevision': expectedBaseRevision
          }
        : { 'pendingPublishRequest.requestedAt': { $ne: null } })
    },
    {
      $set: {
        status,
        publishAt,
        publishedAt,
        ...mediaPatch,
        pendingPublishRequest: null,
        lastRejection: null,
        authorSnapshot: {
          name: authorName,
          img: authorImage,
          capturedAt: new Date()
        },
        chapterSnapshot: {
          primaryChapterSlug,
          chapterSlugs,
          capturedAt: new Date()
        }
      },
      $inc: { revision: 1 }
    },
    { new: true }
  ).lean()) as {
    _id: string;
    slug: string;
    title: string;
    status: 'draft' | 'scheduled' | 'published';
    desc: string;
    tag: string;
    img: string;
    date: string;
    readTime: string;
    imageCaption?: string;
    author?: { name: string; img: string };
    sections?: unknown[];
    content?: unknown;
    publishedAt: Date | null;
    publishAt: Date | null;
    openGraphTitle?: string;
    openGraphDescription?: string;
    openGraphImage?: string;
    twitterTitle?: string;
    twitterDescription?: string;
    twitterImage?: string;
  } | null;

  if (!updated) {
    return NextResponse.json({ error: 'Approval request is stale. Refresh the queue and try again.' }, { status: 409 });
  }

  await saveNewsArticleSnapshot({ article: updated, actorUserId: userId });

  await logAudit({
    action: 'news.article.publish.approve',
    actorUserId: userId,
    metadata: {
      slug,
      title: updated.title || null,
      requestId: expectedRequestId,
      baseRevision: expectedBaseRevision,
      requestedMode,
      publishMode: status
    }
  });

  revalidatePath('/');
  revalidatePath('/news');
  revalidatePath(`/news/${slug}`);
  revalidateTag(newsTags.content);
  revalidateTag(newsTags.list);
  revalidateTag(newsTags.cards);
  revalidateTag(newsTags.article(slug));

  return NextResponse.json({
    ok: true,
    slug,
    action: 'approved',
    status,
    publishAt: publishAt ? publishAt.toISOString() : null,
    publishedAt: publishedAt ? publishedAt.toISOString() : null
  });
}
