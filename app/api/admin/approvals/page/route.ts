import { NextResponse } from 'next/server';
import { revalidatePathSafe, revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getPageRecordFresh, publishDraftPageData } from '@/lib/pages';
import { requireAdmin } from '@/lib/roles';
import { pageTags } from '@/lib/cache-tags';
import { slugToPathname } from '@/lib/site-pages';
import { Page } from '@/models/Page';

function normalizeSlug(value: unknown) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeAction(value: unknown) {
  return value === 'reject' ? 'reject' : 'approve';
}

function normalizeReason(value: unknown) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
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

function hasPendingRequest(value: unknown) {
  if (!value || typeof value !== 'object') return false;
  const request = value as { requestedAt?: Date | string | null };
  if (request.requestedAt instanceof Date) {
    return !Number.isNaN(request.requestedAt.getTime());
  }
  if (typeof request.requestedAt === 'string') {
    return request.requestedAt.trim().length > 0;
  }
  return false;
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
  const requestedRequestId = typeof payload.requestId === 'string' && payload.requestId.trim() ? payload.requestId.trim() : null;
  const requestedBaseRevision = parseRevision(payload.baseRevision);
  const rejectionReason = normalizeReason(payload.rejectionReason);

  if (!slug) {
    return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
  }

  const page = await getPageRecordFresh(slug);
  if (!page) {
    return NextResponse.json({ error: 'Page not found' }, { status: 404 });
  }

  if (!hasPendingRequest(page.pendingPublishRequest)) {
    return NextResponse.json({ error: 'No pending approval request' }, { status: 409 });
  }

  if (action === 'reject') {
    const expectedRequestId =
      requestedRequestId ||
      (typeof page.pendingPublishRequest?.requestId === 'string' ? page.pendingPublishRequest.requestId : null);
    const expectedBaseRevision =
      requestedBaseRevision ??
      (typeof page.pendingPublishRequest?.baseRevision === 'number' ? page.pendingPublishRequest.baseRevision : null) ??
      (typeof page.revision === 'number' ? page.revision : null) ??
      1;

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

    const result = await Page.updateOne(
      query,
      {
        $set: {
          pendingPublishRequest: null,
          lastRejection: {
            reason: rejectionReason,
            rejectedAt: new Date(),
            rejectedByUserId: userId,
            rejectedByEmail: user?.email || null,
            rejectedByName: null
          },
          ...(userId ? { updatedByUserId: userId } : {})
        }
      }
    );
    if (!result.modifiedCount) {
      return NextResponse.json({ error: 'Approval request is stale. Refresh the queue and try again.' }, { status: 409 });
    }

    await logAudit({
      action: 'page.publish.reject',
      actorUserId: userId,
      metadata: {
        slug,
        requestId: expectedRequestId,
        baseRevision: expectedBaseRevision,
        rejectionReason
      }
    });

    revalidateTag(pageTags.draft(slug));
    revalidateTag(pageTags.record(slug));
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));

    return NextResponse.json({ ok: true, slug, action: 'rejected', rejectionReason });
  }

  const expectedRequestId =
    requestedRequestId ||
    (typeof page.pendingPublishRequest?.requestId === 'string' ? page.pendingPublishRequest.requestId : null);
  const expectedBaseRevision =
    requestedBaseRevision ??
    (typeof page.pendingPublishRequest?.baseRevision === 'number' ? page.pendingPublishRequest.baseRevision : null) ??
    (typeof page.revision === 'number' ? page.revision : null) ??
    1;

  let published;
  try {
    published = await publishDraftPageData(slug, userId, {
      expectedRequestId,
      expectedBaseRevision
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    if (message === 'Page approval request is stale') {
      return NextResponse.json({ error: 'Approval request is stale. Refresh the queue and try again.' }, { status: 409 });
    }
    if (message === 'No draft to publish') {
      return NextResponse.json({ error: message }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }

  await logAudit({
    action: 'page.publish.approve',
    actorUserId: userId,
    metadata: {
      slug,
      requestId: expectedRequestId,
      baseRevision: expectedBaseRevision
    }
  });

  revalidateTag(pageTags.content);
  revalidateTag(pageTags.published(slug));
  revalidateTag(pageTags.draft(slug));
  revalidateTag(pageTags.record(slug));
  revalidateTag(pageTags.list());
  revalidateTag(pageTags.list(true));

  const livePath = slugToPathname(slug) || (slug === 'home' ? '/' : `/${slug}`);
  revalidatePathSafe('/', 'layout');
  revalidatePathSafe(livePath, 'page');

  return NextResponse.json({
    ok: true,
    slug,
    action: 'approved',
    publishedAt: published?.publishedAt ?? null,
    revision: typeof published?.revision === 'number' ? published.revision : null
  });
}
