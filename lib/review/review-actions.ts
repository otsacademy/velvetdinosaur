'use server';

import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';
import { isInternalReviewPath, reviewSlugToPathname } from '@/lib/review/pathname-slug';
import {
  addReviewAnnotationReply,
  createReviewAnnotation,
  setReviewAnnotationStatus,
  type ReviewAnnotationStatus
} from '@/lib/review-annotations';
import { validateReviewToken } from '@/lib/security/review-links';
import { saveScreenshot } from '@/lib/storage/review-screenshots';

type ReviewTargetPayload = {
  x?: number | null;
  y?: number | null;
  width?: number | null;
  height?: number | null;
  viewportWidth?: number | null;
  viewportHeight?: number | null;
  elementTag?: string | null;
  blockId?: string | null;
};

type CreateReviewCommentPayload = {
  slug: string;
  reviewToken: string;
  authorName: string;
  body: string;
  screenshotDataUrl?: string | null;
  target?: ReviewTargetPayload | null;
};

type ReplyReviewCommentPayload = {
  slug: string;
  reviewToken: string;
  annotationId: string;
  authorName: string;
  body: string;
};

type UpdateReviewStatusPayload = {
  slug: string;
  reviewToken: string;
  annotationId: string;
  status: ReviewAnnotationStatus;
};

const ANNOTATION_ID_PATTERN = /^[a-f\d]{24}$/i;

type ParsedScreenshot = {
  buffer: Buffer;
  mimeType: 'image/webp' | 'image/png' | 'image/jpeg';
};

function parseScreenshotDataUrl(dataUrl: string): ParsedScreenshot {
  const normalized = (dataUrl || '').trim();
  const match = /^data:(image\/(?:webp|png|jpeg));base64,(.+)$/i.exec(normalized);
  if (!match) {
    throw new Error('Screenshot must be image/webp, image/png, or image/jpeg');
  }
  const mimeType = match[1].toLowerCase() as ParsedScreenshot['mimeType'];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.byteLength) {
    throw new Error('Screenshot payload is empty');
  }
  return { buffer, mimeType };
}

function sanitizeAuthorName(input: string) {
  const value = (input || '').trim();
  return value.slice(0, 80);
}

function sanitizeEmail(input: string | null | undefined) {
  const value = String(input || '').trim().toLowerCase();
  return value || null;
}

function sanitizeUserId(input: string | null | undefined) {
  const value = String(input || '').trim();
  return value ? value.slice(0, 120) : null;
}

function sanitizeBody(input: string) {
  return (input || '').trim().slice(0, 5000);
}

function sanitizeNumber(input: unknown) {
  if (typeof input !== 'number' || Number.isNaN(input)) return null;
  return Math.round(input * 100) / 100;
}

function sanitizeAnnotationId(input: string) {
  const value = (input || '').trim();
  if (!ANNOTATION_ID_PATTERN.test(value)) {
    return null;
  }
  return value;
}

function sanitizeSlug(input: string) {
  const slug = (input || '').trim().toLowerCase();
  if (!slug) return null;
  if (slug.startsWith('review-path-') && /^[a-z0-9-]+$/.test(slug)) {
    return slug;
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return null;
  }
  return slug;
}

function sanitizeBlockId(input: unknown) {
  if (typeof input !== 'string') return null;
  const value = input.trim();
  if (!value) return null;
  return value.slice(0, 120);
}

async function getCurrentAuthorIdentity() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string | null; email?: string | null } } | null)?.user;
  return {
    authorUserId: sanitizeUserId(user?.id),
    authorEmail: sanitizeEmail(user?.email)
  };
}

async function validateWritableToken(rawToken: string, slug: string) {
  const pathname = reviewSlugToPathname(slug);
  if (!pathname) {
    return { ok: false as const, error: 'Invalid review target' };
  }

  if (isInternalReviewPath(pathname)) {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return { ok: false as const, error: 'Sign in is required to review internal pages' };
    }
  }

  const validatedToken = await validateReviewToken(rawToken || '', { slug });
  if (validatedToken.ok) return validatedToken;

  const message =
    validatedToken.reason === 'expired'
      ? 'Review period is closed'
      : validatedToken.reason === 'not_started'
        ? 'Review period has not opened yet'
        : validatedToken.reason === 'revoked'
          ? 'Review link has been revoked'
          : 'Invalid review token';
  return { ok: false as const, error: message };
}

export async function createReviewCommentAction(payload: CreateReviewCommentPayload) {
  const slug = sanitizeSlug(payload?.slug || '');
  if (!slug) {
    return { ok: false, error: 'Invalid slug' } as const;
  }

  const validatedToken = await validateWritableToken(payload?.reviewToken || '', slug);
  if (!validatedToken.ok) {
    return validatedToken;
  }

  const body = sanitizeBody(payload?.body || '');
  if (!body) {
    return { ok: false, error: 'Comment body is required' } as const;
  }
  const authorName = sanitizeAuthorName(payload?.authorName || '');
  if (!authorName) {
    return { ok: false, error: 'Author name is required' } as const;
  }
  const identity = await getCurrentAuthorIdentity();

  let screenshotUrl: string | null = null;
  if (payload?.screenshotDataUrl) {
    try {
      const screenshot = parseScreenshotDataUrl(payload.screenshotDataUrl);
      screenshotUrl = await saveScreenshot(screenshot.buffer, screenshot.mimeType);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Unable to process screenshot'
      } as const;
    }
  }

  const created = await createReviewAnnotation({
    slug,
    reviewTokenId: validatedToken.record.tokenId,
    target: payload?.target
      ? {
          x: sanitizeNumber(payload.target.x),
          y: sanitizeNumber(payload.target.y),
          width: sanitizeNumber(payload.target.width),
          height: sanitizeNumber(payload.target.height),
          viewportWidth: sanitizeNumber(payload.target.viewportWidth),
          viewportHeight: sanitizeNumber(payload.target.viewportHeight),
          elementTag: typeof payload.target.elementTag === 'string' ? payload.target.elementTag : null,
          blockId: sanitizeBlockId(payload.target.blockId)
        }
      : undefined,
    comment: {
      authorName,
      authorUserId: identity.authorUserId,
      authorEmail: identity.authorEmail,
      body,
      screenshotUrl
    }
  });

  return { ok: true, annotation: created } as const;
}

export async function addReviewReplyAction(payload: ReplyReviewCommentPayload) {
  const slug = sanitizeSlug(payload?.slug || '');
  if (!slug) {
    return { ok: false, error: 'Invalid slug' } as const;
  }

  const annotationId = sanitizeAnnotationId(payload?.annotationId || '');
  if (!annotationId) {
    return { ok: false, error: 'Invalid annotation id' } as const;
  }

  const validatedToken = await validateWritableToken(payload?.reviewToken || '', slug);
  if (!validatedToken.ok) {
    return validatedToken;
  }

  const body = sanitizeBody(payload?.body || '');
  if (!body) {
    return { ok: false, error: 'Reply body is required' } as const;
  }
  const authorName = sanitizeAuthorName(payload?.authorName || '');
  if (!authorName) {
    return { ok: false, error: 'Author name is required' } as const;
  }
  const identity = await getCurrentAuthorIdentity();

  const updated = await addReviewAnnotationReply({
    annotationId,
    slug,
    reviewTokenId: validatedToken.record.tokenId,
    comment: {
      authorName,
      authorUserId: identity.authorUserId,
      authorEmail: identity.authorEmail,
      body
    }
  });

  if (!updated) {
    return { ok: false, error: 'Annotation not found' } as const;
  }

  return { ok: true, annotation: updated } as const;
}

export async function setReviewAnnotationStatusAction(payload: UpdateReviewStatusPayload) {
  const slug = sanitizeSlug(payload?.slug || '');
  if (!slug) {
    return { ok: false, error: 'Invalid slug' } as const;
  }

  const annotationId = sanitizeAnnotationId(payload?.annotationId || '');
  if (!annotationId) {
    return { ok: false, error: 'Invalid annotation id' } as const;
  }

  const status = payload?.status === 'resolved' ? 'resolved' : payload?.status === 'open' ? 'open' : null;
  if (!status) {
    return { ok: false, error: 'Invalid annotation status' } as const;
  }

  const validatedToken = await validateWritableToken(payload?.reviewToken || '', slug);
  if (!validatedToken.ok) {
    return validatedToken;
  }

  const updated = await setReviewAnnotationStatus({
    annotationId,
    slug,
    reviewTokenId: validatedToken.record.tokenId,
    status
  });

  if (!updated) {
    return { ok: false, error: 'Annotation not found' } as const;
  }

  return { ok: true, annotation: updated } as const;
}
