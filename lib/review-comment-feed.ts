import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/review-comment-feed.ts');

import type { PipelineStage } from 'mongoose';
import { connectDB } from '@/lib/db';
import { previewSlugToPathname } from '@/lib/review/pathname-slug';
import { ReviewAnnotation } from '@/models/ReviewAnnotation';

export type ReviewCommentFeedScope = 'all' | 'mine';

export type ReviewCommentFeedEntry = {
  annotationId: string;
  slug: string;
  pathname: string | null;
  reviewTokenId: string;
  status: 'open' | 'resolved';
  authorName: string;
  authorUserId: string | null;
  authorEmail: string | null;
  body: string;
  screenshotUrl: string | null;
  createdAt: Date;
};

type ViewerIdentity = {
  userId?: string | null;
  email?: string | null;
  displayName?: string | null;
};

type RawFeedRow = {
  annotationId?: { toString?: () => string } | string;
  slug?: string;
  reviewTokenId?: string;
  status?: string;
  authorName?: string;
  authorUserId?: string | null;
  authorEmail?: string | null;
  body?: string;
  screenshotUrl?: string | null;
  createdAt?: Date | string;
};

const MAX_LIMIT = 1000;

function normalizeEmail(value: string | null | undefined) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized || null;
}

function normalizeUserId(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function normalizeName(value: string | null | undefined) {
  const normalized = String(value || '').trim();
  return normalized || null;
}

function toDisplayNameFromEmail(email: string | null | undefined) {
  const local = String(email || '').split('@')[0] || '';
  if (!local) return null;
  const normalized = local
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((part) => (part ? `${part.charAt(0).toUpperCase()}${part.slice(1)}` : ''))
    .join(' ')
    .trim();
  return normalized || null;
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeDate(value: Date | string | undefined) {
  const parsed = value instanceof Date ? value : new Date(String(value || ''));
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function normalizeLimit(limit: number | undefined) {
  if (typeof limit !== 'number' || Number.isNaN(limit)) return 200;
  const rounded = Math.round(limit);
  if (rounded < 1) return 1;
  if (rounded > MAX_LIMIT) return MAX_LIMIT;
  return rounded;
}

function buildMineThreadMatch(viewer: ViewerIdentity | undefined) {
  const userId = normalizeUserId(viewer?.userId);
  const email = normalizeEmail(viewer?.email);
  const names = new Set<string>();
  const explicitName = normalizeName(viewer?.displayName);
  if (explicitName) names.add(explicitName);
  const derivedName = toDisplayNameFromEmail(email);
  if (derivedName) names.add(derivedName);

  const clauses: Array<Record<string, unknown>> = [];
  if (userId) {
    clauses.push({ 'thread.authorUserId': userId });
  }
  if (email) {
    clauses.push({ 'thread.authorEmail': email });
  }
  for (const name of names) {
    clauses.push({ 'thread.authorName': { $regex: `^${escapeRegex(name)}$`, $options: 'i' } });
  }
  if (!clauses.length) return null;
  return { $or: clauses };
}

export async function listReviewCommentFeed(options: {
  scope: ReviewCommentFeedScope;
  viewer?: ViewerIdentity;
  limit?: number;
}) {
  await connectDB();
  const limit = normalizeLimit(options.limit);
  const scope = options.scope === 'all' ? 'all' : 'mine';
  const threadMatch = scope === 'all' ? null : buildMineThreadMatch(options.viewer);
  if (scope === 'mine' && !threadMatch) {
    return [] as ReviewCommentFeedEntry[];
  }

  const pipeline: PipelineStage[] = [{ $unwind: '$thread' }];
  if (threadMatch) {
    pipeline.push({ $match: threadMatch });
  }
  pipeline.push(
    {
      $project: {
        annotationId: '$_id',
        slug: '$slug',
        reviewTokenId: '$reviewTokenId',
        status: { $ifNull: ['$status', 'open'] },
        authorName: '$thread.authorName',
        authorUserId: '$thread.authorUserId',
        authorEmail: '$thread.authorEmail',
        body: '$thread.body',
        screenshotUrl: '$thread.screenshotUrl',
        createdAt: '$thread.createdAt'
      }
    },
    { $sort: { createdAt: -1 } },
    { $limit: limit }
  );

  const rows = (await ReviewAnnotation.aggregate(pipeline)) as RawFeedRow[];

  return rows
    .map((row) => ({
      annotationId:
        typeof row.annotationId === 'string'
          ? row.annotationId
          : row.annotationId?.toString?.() || '',
      slug: row.slug || '',
      pathname: row.slug ? previewSlugToPathname(row.slug) : null,
      reviewTokenId: row.reviewTokenId || '',
      status: row.status === 'resolved' ? 'resolved' : 'open',
      authorName: row.authorName || 'Reviewer',
      authorUserId: normalizeUserId(row.authorUserId),
      authorEmail: normalizeEmail(row.authorEmail),
      body: String(row.body || ''),
      screenshotUrl: row.screenshotUrl || null,
      createdAt: normalizeDate(row.createdAt)
    }))
    .filter((row) => Boolean(row.annotationId && row.slug && row.reviewTokenId));
}
