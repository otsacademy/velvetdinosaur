import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { isInternalReviewPath, previewSlugToPathname } from '@/lib/review/pathname-slug';
import { listReviewAnnotations } from '@/lib/review-annotations';
import { validateReviewToken } from '@/lib/security/review-links';

function sanitizeSlug(input: string) {
  const slug = (input || '').trim().toLowerCase();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  return slug;
}

async function hasSession(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  return session;
}

function toDisplayNameFromEmail(email: string) {
  const local = (email || '').split('@')[0] || '';
  if (!local) return '';
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : ''))
    .join(' ')
    .trim();
}

function resolveViewerName(session: unknown) {
  const user = (session as { user?: { name?: string | null; email?: string | null } } | null)?.user;
  const named = (user?.name || '').trim();
  if (named) return named.slice(0, 80);
  const derived = toDisplayNameFromEmail((user?.email || '').trim());
  return derived ? derived.slice(0, 80) : null;
}

function serializeAnnotationsForClient(
  annotations: Awaited<ReturnType<typeof listReviewAnnotations>>
) {
  return annotations.map((annotation) => ({
    id: annotation.id,
    target: annotation.target,
    status: annotation.status,
    statusUpdatedAt: annotation.statusUpdatedAt ? annotation.statusUpdatedAt.toISOString() : null,
    createdAt: annotation.createdAt ? annotation.createdAt.toISOString() : null,
    thread: annotation.thread.map((entry) => ({
      authorName: entry.authorName,
      body: entry.body,
      screenshotUrl: entry.screenshotUrl,
      createdAt: entry.createdAt.toISOString()
    }))
  }));
}

function tokenErrorMessage(reason: 'invalid' | 'revoked' | 'expired' | 'not_started') {
  if (reason === 'not_started') return 'This review link is scheduled and has not opened yet.';
  if (reason === 'revoked') return 'This review link has been revoked.';
  if (reason === 'expired') return 'This review link expired at its configured deadline.';
  return 'This review link is invalid.';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const reviewToken = (searchParams.get('review') || '').trim();
  const slug = sanitizeSlug(searchParams.get('slug') || '');

  if (!reviewToken || !slug) {
    return NextResponse.json(
      { ok: false, error: 'Missing review token or page identifier.' },
      { status: 400 }
    );
  }

  const pathname = previewSlugToPathname(slug);
  if (!pathname) {
    return NextResponse.json({ ok: false, error: 'Invalid review page identifier.' }, { status: 400 });
  }
  const session = await hasSession(request);
  if (isInternalReviewPath(pathname)) {
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Sign in is required to review internal pages.' },
        { status: 401 }
      );
    }
  }

  const validated = await validateReviewToken(reviewToken, { slug, allowExpired: true });
  if (!validated.ok) {
    return NextResponse.json(
      { ok: false, error: tokenErrorMessage(validated.reason) },
      { status: 403 }
    );
  }

  const annotations = await listReviewAnnotations(slug, validated.record.tokenId);

  return NextResponse.json({
    ok: true,
    context: {
      startsAtIso: validated.record.startsAt.toISOString(),
      deadlineAtIso: validated.record.deadlineAt.toISOString(),
      overrideLock: validated.record.overrideLock,
      initialAnnotations: serializeAnnotationsForClient(annotations),
      viewerName: resolveViewerName(session)
    }
  });
}
