import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/review-annotations.ts');

import { connectDB } from '@/lib/db';
import { ReviewAnnotation } from '@/models/ReviewAnnotation';

export type ReviewAnnotationStatus = 'open' | 'resolved';

type ReviewThreadEntry = {
  authorName: string;
  authorUserId?: string | null;
  authorEmail?: string | null;
  body: string;
  screenshotUrl?: string | null;
  createdAt?: Date;
};

type ReviewAnnotationDoc = {
  _id?: { toString?: () => string } | string;
  id?: string;
  slug: string;
  reviewTokenId: string;
  target?: {
    x?: number | null;
    y?: number | null;
    width?: number | null;
    height?: number | null;
    viewportWidth?: number | null;
    viewportHeight?: number | null;
    elementTag?: string | null;
    blockId?: string | null;
  };
  status?: ReviewAnnotationStatus;
  statusUpdatedAt?: Date;
  thread: ReviewThreadEntry[];
  createdAt?: Date;
  updatedAt?: Date;
};

export type ReviewAnnotationSummary = {
  id: string;
  slug: string;
  reviewTokenId: string;
  target: {
    x: number | null;
    y: number | null;
    width: number | null;
    height: number | null;
    viewportWidth: number | null;
    viewportHeight: number | null;
    elementTag: string | null;
    blockId: string | null;
  };
  status: ReviewAnnotationStatus;
  statusUpdatedAt: Date | null;
  thread: Array<{
    authorName: string;
    authorUserId: string | null;
    authorEmail: string | null;
    body: string;
    screenshotUrl: string | null;
    createdAt: Date;
  }>;
  createdAt: Date | null;
  updatedAt: Date | null;
};

function toId(value: { toString?: () => string } | string | undefined) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toString?.() || '';
}

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || null;
}

function mapAnnotation(doc: ReviewAnnotationDoc): ReviewAnnotationSummary {
  return {
    id: toId(doc.id || doc._id),
    slug: doc.slug,
    reviewTokenId: doc.reviewTokenId,
    target: {
      x: doc.target?.x ?? null,
      y: doc.target?.y ?? null,
      width: doc.target?.width ?? null,
      height: doc.target?.height ?? null,
      viewportWidth: doc.target?.viewportWidth ?? null,
      viewportHeight: doc.target?.viewportHeight ?? null,
      elementTag: doc.target?.elementTag ?? null,
      blockId: doc.target?.blockId ?? null
    },
    status: doc.status === 'resolved' ? 'resolved' : 'open',
    statusUpdatedAt: doc.statusUpdatedAt ? new Date(doc.statusUpdatedAt) : null,
    thread: (doc.thread || []).map((entry) => ({
      authorName: entry.authorName,
      authorUserId: entry.authorUserId ? String(entry.authorUserId) : null,
      authorEmail: normalizeEmail(entry.authorEmail),
      body: entry.body,
      screenshotUrl: entry.screenshotUrl || null,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(0)
    })),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt) : null
  };
}

export async function listReviewAnnotations(slug: string, reviewTokenId: string) {
  await connectDB();
  const docs = (await ReviewAnnotation.find({ slug, reviewTokenId })
    .sort({ createdAt: 1 })
    .lean()) as unknown as ReviewAnnotationDoc[];
  return docs.map((doc) => mapAnnotation(doc));
}

export async function listReviewAnnotationsByTokenId(reviewTokenId: string) {
  await connectDB();
  const docs = (await ReviewAnnotation.find({ reviewTokenId })
    .sort({ createdAt: 1 })
    .lean()) as unknown as ReviewAnnotationDoc[];
  return docs.map((doc) => mapAnnotation(doc));
}

export async function createReviewAnnotation(params: {
  slug: string;
  reviewTokenId: string;
  target?: {
    x?: number | null;
    y?: number | null;
    width?: number | null;
    height?: number | null;
    viewportWidth?: number | null;
    viewportHeight?: number | null;
    elementTag?: string | null;
    blockId?: string | null;
  };
  comment: {
    authorName: string;
    authorUserId?: string | null;
    authorEmail?: string | null;
    body: string;
    screenshotUrl?: string | null;
  };
}) {
  await connectDB();
  const now = new Date();
  const created = (await ReviewAnnotation.create({
    slug: params.slug,
    reviewTokenId: params.reviewTokenId,
    target: {
      x: params.target?.x ?? null,
      y: params.target?.y ?? null,
      width: params.target?.width ?? null,
      height: params.target?.height ?? null,
      viewportWidth: params.target?.viewportWidth ?? null,
      viewportHeight: params.target?.viewportHeight ?? null,
      elementTag: params.target?.elementTag ?? null,
      blockId: params.target?.blockId ?? null
    },
    status: 'open',
    statusUpdatedAt: now,
    thread: [
      {
        authorName: params.comment.authorName,
        authorUserId: params.comment.authorUserId || null,
        authorEmail: normalizeEmail(params.comment.authorEmail),
        body: params.comment.body,
        screenshotUrl: params.comment.screenshotUrl || null,
        createdAt: now
      }
    ]
  })) as ReviewAnnotationDoc;

  return mapAnnotation(created);
}

export async function addReviewAnnotationReply(params: {
  annotationId: string;
  slug: string;
  reviewTokenId: string;
  comment: {
    authorName: string;
    authorUserId?: string | null;
    authorEmail?: string | null;
    body: string;
    screenshotUrl?: string | null;
  };
}) {
  await connectDB();
  const now = new Date();
  const updated = (await ReviewAnnotation.findOneAndUpdate(
    {
      _id: params.annotationId,
      slug: params.slug,
      reviewTokenId: params.reviewTokenId
    },
    {
      $push: {
        thread: {
          authorName: params.comment.authorName,
          authorUserId: params.comment.authorUserId || null,
          authorEmail: normalizeEmail(params.comment.authorEmail),
          body: params.comment.body,
          screenshotUrl: params.comment.screenshotUrl || null,
          createdAt: now
        }
      }
    },
    { new: true }
  )) as ReviewAnnotationDoc | null;

  return updated ? mapAnnotation(updated) : null;
}

export async function setReviewAnnotationStatus(params: {
  annotationId: string;
  slug: string;
  reviewTokenId: string;
  status: ReviewAnnotationStatus;
}) {
  await connectDB();
  const now = new Date();
  const updated = (await ReviewAnnotation.findOneAndUpdate(
    {
      _id: params.annotationId,
      slug: params.slug,
      reviewTokenId: params.reviewTokenId
    },
    {
      $set: {
        status: params.status,
        statusUpdatedAt: now
      }
    },
    { new: true }
  )) as ReviewAnnotationDoc | null;

  return updated ? mapAnnotation(updated) : null;
}
