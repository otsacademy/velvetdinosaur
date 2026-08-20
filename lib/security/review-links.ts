import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/security/review-links.ts');

import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { isReviewExpired } from '@/lib/security/review-deadlines';
import { ReviewLink } from '@/models/ReviewLink';

type ReviewLinkDoc = {
  _id?: { toString?: () => string } | string;
  id?: string;
  tokenId: string;
  tokenHash: string;
  slug: string;
  recipientEmail?: string | null;
  startsAt?: Date;
  deadlineAt: Date;
  createdAt?: Date;
  revokedAt?: Date | null;
  reminderSentAt?: Date | null;
  overrideLock?: boolean | null;
  createdByUserId?: string | null;
  lastSentAt?: Date | null;
};

export type ReviewLinkSummary = {
  id: string;
  tokenId: string;
  slug: string;
  recipientEmail: string | null;
  startsAt: Date;
  deadlineAt: Date;
  createdAt: Date | null;
  revokedAt: Date | null;
  reminderSentAt: Date | null;
  overrideLock: boolean;
  createdByUserId: string | null;
  lastSentAt: Date | null;
  expired: boolean;
};

export type ReviewTokenValidation =
  | { ok: true; record: ReviewLinkSummary }
  | { ok: false; reason: 'invalid' | 'revoked' | 'expired' | 'not_started' };

export type ReviewReminderCandidate = {
  tokenId: string;
  tokenHash: string;
  slug: string;
  recipientEmail: string;
  startsAt: Date;
  deadlineAt: Date;
  reminderSentAt: Date | null;
  revokedAt: Date | null;
  overrideLock: boolean;
};

const TOKEN_ID_BYTES = 12;
const TOKEN_SECRET_BYTES = 32;

function toId(value: { toString?: () => string } | string | undefined) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toString?.() || '';
}

function toSummary(doc: ReviewLinkDoc): ReviewLinkSummary {
  const overrideLock = doc.overrideLock === true;
  const startsAt = doc.startsAt ? new Date(doc.startsAt) : doc.createdAt ? new Date(doc.createdAt) : new Date();
  return {
    id: toId(doc.id || doc._id),
    tokenId: doc.tokenId,
    slug: doc.slug,
    recipientEmail: doc.recipientEmail || null,
    startsAt,
    deadlineAt: new Date(doc.deadlineAt),
    createdAt: doc.createdAt ? new Date(doc.createdAt) : null,
    revokedAt: doc.revokedAt ? new Date(doc.revokedAt) : null,
    reminderSentAt: doc.reminderSentAt ? new Date(doc.reminderSentAt) : null,
    overrideLock,
    createdByUserId: doc.createdByUserId || null,
    lastSentAt: doc.lastSentAt ? new Date(doc.lastSentAt) : null,
    expired: isReviewExpired(doc.deadlineAt, { overrideLock })
  };
}

function toHexHash(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function secureHashEquals(expectedHex: string, candidateHex: string) {
  const expected = Buffer.from(expectedHex, 'hex');
  const candidate = Buffer.from(candidateHex, 'hex');
  if (expected.length !== candidate.length) {
    const max = Math.max(expected.length, candidate.length);
    const paddedExpected = Buffer.alloc(max);
    const paddedCandidate = Buffer.alloc(max);
    expected.copy(paddedExpected);
    candidate.copy(paddedCandidate);
    crypto.timingSafeEqual(paddedExpected, paddedCandidate);
    return false;
  }
  return crypto.timingSafeEqual(expected, candidate);
}

function getReminderSigningSecret() {
  return (
    process.env.REVIEW_LINK_REMINDER_SECRET ||
    process.env.CRON_SECRET ||
    process.env.BETTERAUTH_SECRET ||
    ''
  ).trim();
}

function createReminderTokenSecret(tokenId: string, tokenHash: string) {
  const signingSecret = getReminderSigningSecret();
  if (!signingSecret) return null;
  return crypto.createHmac('sha256', signingSecret).update(`${tokenId}.${tokenHash}`).digest('hex');
}

function generateReviewToken() {
  const tokenId = crypto.randomBytes(TOKEN_ID_BYTES).toString('hex');
  const secret = crypto.randomBytes(TOKEN_SECRET_BYTES).toString('hex');
  return { tokenId, secret, tokenHash: toHexHash(secret), token: `${tokenId}.${secret}` };
}

function parseReviewToken(rawToken: string) {
  const token = (rawToken || '').trim();
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [tokenId, secret] = parts;
  if (!tokenId || !secret) return null;
  if (!/^[a-f0-9]+$/i.test(tokenId) || !/^[a-f0-9]+$/i.test(secret)) return null;
  return { tokenId, secret };
}

export function buildReviewUrl(baseUrl: string, _slug: string, rawToken: string) {
  const normalizedBase = (baseUrl || '').replace(/\/+$/, '');
  return `${normalizedBase}/review/${encodeURIComponent(rawToken)}`;
}

export function buildReminderReviewToken(token: Pick<ReviewReminderCandidate, 'tokenId' | 'tokenHash'>) {
  const secret = createReminderTokenSecret(token.tokenId, token.tokenHash);
  if (!secret) return null;
  return `${token.tokenId}.${secret}`;
}

export function buildReminderReviewUrl(
  token: Pick<ReviewReminderCandidate, 'tokenId' | 'tokenHash' | 'slug'>,
  baseUrl: string
) {
  const reminderToken = buildReminderReviewToken(token);
  if (!reminderToken) return null;
  return buildReviewUrl(baseUrl, token.slug, reminderToken);
}

export async function getExistingSessionReviewToken(params: { slug: string }) {
  await connectDB();
  const now = new Date();
  const existing = (await ReviewLink.findOne({
    slug: params.slug,
    revokedAt: null,
    $and: [
      {
        $or: [{ startsAt: { $lte: now } }, { startsAt: { $exists: false } }]
      },
      {
        $or: [{ overrideLock: true }, { deadlineAt: { $gt: now } }]
      }
    ]
  })
    .sort({ createdAt: -1 })
    .lean()) as ReviewLinkDoc | null;

  if (existing) {
    const reminderToken = buildReminderReviewToken({
      tokenId: existing.tokenId,
      tokenHash: existing.tokenHash
    });
    if (reminderToken) {
      return { token: reminderToken, record: toSummary(existing) };
    }
  }

  return null;
}

export async function createReviewLink(params: {
  slug: string;
  startsAt?: Date;
  deadlineAt: Date;
  recipientEmail?: string | null;
  createdByUserId?: string | null;
}) {
  await connectDB();
  const generated = generateReviewToken();
  const startsAt = params.startsAt ? new Date(params.startsAt) : new Date();
  const created = (await ReviewLink.create({
    tokenId: generated.tokenId,
    tokenHash: generated.tokenHash,
    slug: params.slug,
    recipientEmail: params.recipientEmail || null,
    startsAt,
    deadlineAt: params.deadlineAt,
    createdByUserId: params.createdByUserId || null,
    reminderSentAt: null,
    overrideLock: false
  })) as ReviewLinkDoc;

  return { record: toSummary(created), token: generated.token };
}

export async function listReviewLinks(limit = 100) {
  await connectDB();
  const docs = (await ReviewLink.find({}).sort({ createdAt: -1 }).limit(limit).lean()) as unknown as ReviewLinkDoc[];
  return docs.map((doc) => toSummary(doc));
}

export async function listReviewLinksNeedingReminder(options?: {
  now?: Date;
  horizonHours?: number;
  limit?: number;
}) {
  await connectDB();
  const now = options?.now || new Date();
  const horizonHours = options?.horizonHours ?? 48;
  const deadlineUpperBound = new Date(now.getTime() + horizonHours * 60 * 60 * 1000);
  const limit = options?.limit ?? 200;

  const docs = (await ReviewLink.find({
    revokedAt: null,
    reminderSentAt: null,
    $or: [{ startsAt: { $lte: now } }, { startsAt: { $exists: false } }],
    deadlineAt: { $gt: now, $lte: deadlineUpperBound },
    recipientEmail: { $type: 'string', $ne: '' }
  })
    .sort({ deadlineAt: 1 })
    .limit(limit)
    .lean()) as unknown as ReviewLinkDoc[];

  return docs.map((doc) => ({
    tokenId: doc.tokenId,
    tokenHash: doc.tokenHash,
    slug: doc.slug,
    recipientEmail: (doc.recipientEmail || '').trim().toLowerCase(),
    startsAt: doc.startsAt ? new Date(doc.startsAt) : doc.createdAt ? new Date(doc.createdAt) : now,
    deadlineAt: new Date(doc.deadlineAt),
    reminderSentAt: doc.reminderSentAt ? new Date(doc.reminderSentAt) : null,
    revokedAt: doc.revokedAt ? new Date(doc.revokedAt) : null,
    overrideLock: doc.overrideLock === true
  })) as ReviewReminderCandidate[];
}

export async function markReviewLinkSent(tokenId: string) {
  await connectDB();
  const updated = (await ReviewLink.findOneAndUpdate(
    { tokenId },
    { $set: { lastSentAt: new Date() } },
    { new: true }
  )) as ReviewLinkDoc | null;
  return updated ? toSummary(updated) : null;
}

export async function markReviewLinkReminderSent(tokenId: string, sentAt = new Date()) {
  await connectDB();
  const updated = (await ReviewLink.findOneAndUpdate(
    { tokenId },
    { $set: { reminderSentAt: sentAt } },
    { new: true }
  )) as ReviewLinkDoc | null;
  return updated ? toSummary(updated) : null;
}

export async function setReviewLinkOverrideLock(id: string, overrideLock: boolean) {
  await connectDB();
  const updated = (await ReviewLink.findOneAndUpdate(
    { _id: id, revokedAt: null },
    { $set: { overrideLock } },
    { new: true }
  )) as ReviewLinkDoc | null;
  return updated ? toSummary(updated) : null;
}

export async function getReviewLinkByTokenId(tokenId: string) {
  await connectDB();
  const doc = (await ReviewLink.findOne({ tokenId }).lean()) as ReviewLinkDoc | null;
  return doc ? toSummary(doc) : null;
}

export async function revokeReviewLink(id: string) {
  await connectDB();
  const updated = (await ReviewLink.findOneAndUpdate(
    { _id: id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true }
  )) as ReviewLinkDoc | null;
  return updated ? toSummary(updated) : null;
}

export async function validateReviewToken(
  rawToken: string,
  options?: { slug?: string; allowExpired?: boolean; enforceSlug?: boolean }
) {
  await connectDB();
  const parsed = parseReviewToken(rawToken);
  if (!parsed) return { ok: false, reason: 'invalid' } as const;

  const doc = (await ReviewLink.findOne({ tokenId: parsed.tokenId }).lean()) as ReviewLinkDoc | null;
  if (!doc) return { ok: false, reason: 'invalid' } as const;

  const primaryTokenHash = toHexHash(parsed.secret);
  const isPrimaryToken = secureHashEquals(doc.tokenHash, primaryTokenHash);
  const reminderSecret = createReminderTokenSecret(doc.tokenId, doc.tokenHash);
  const isReminderToken = reminderSecret ? secureHashEquals(reminderSecret, parsed.secret) : false;
  if (!isPrimaryToken && !isReminderToken) {
    return { ok: false, reason: 'invalid' } as const;
  }

  if (options?.enforceSlug && options?.slug && options.slug !== doc.slug) {
    return { ok: false, reason: 'invalid' } as const;
  }

  if (doc.revokedAt) {
    return { ok: false, reason: 'revoked' } as const;
  }

  const startsAt = doc.startsAt ? new Date(doc.startsAt) : doc.createdAt ? new Date(doc.createdAt) : new Date(0);
  if (Number.isFinite(startsAt.getTime()) && startsAt.getTime() > Date.now()) {
    return { ok: false, reason: 'not_started' } as const;
  }

  const expired = isReviewExpired(doc.deadlineAt, { overrideLock: doc.overrideLock === true });
  if (expired && !options?.allowExpired) {
    return { ok: false, reason: 'expired' } as const;
  }

  return { ok: true, record: toSummary(doc) } as const;
}
