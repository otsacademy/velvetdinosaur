import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/consent.ts');

import crypto from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { requireNewsletterDatabase } from './database';
import { connectDB } from '@/lib/db';
import { NewsletterConsentEvent } from '@/models/NewsletterConsentEvent';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { enqueueNotification, flushNotification } from '@/lib/email/notification-outbox';
import { clean, normalizeEmail, toFirstName, toIdString, type NewsletterStatus } from '@/lib/newsletter/shared';

type RegisteredUserRow = {
  _id: unknown;
  email?: string | null;
  name?: string | null;
};

export type PreferenceDoc = {
  _id?: unknown;
  userId?: string;
  email?: string;
  firstName?: string;
  status?: NewsletterStatus;
  consentAt?: Date | string | null;
  unsubscribedAt?: Date | string | null;
  source?: string;
  legalTextVersion?: string;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

type ConsentEventDoc = {
  _id?: unknown;
  userId?: string;
  email?: string;
  eventType?: string;
  source?: string;
  legalTextVersion?: string;
  actorType?: string;
  actorId?: string;
  ipHash?: string;
  userAgent?: string;
  reason?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function toDateOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeStatus(value: unknown): NewsletterStatus {
  if (value === 'pending') return 'pending';
  if (value === 'subscribed') return 'subscribed';
  if (value === 'unsubscribed') return 'unsubscribed';
  return 'not_consented';
}

function hashIp(ip: string) {
  const normalized = clean(ip);
  if (!normalized) return '';
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export type NewsletterPreferenceSummary = {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  status: NewsletterStatus;
  consentAt: string | null;
  unsubscribedAt: string | null;
  source: string;
  legalTextVersion: string;
  updatedAt: string | null;
  createdAt: string | null;
};

export type NewsletterConsentEventSummary = {
  id: string;
  userId: string;
  email: string;
  eventType: string;
  source: string;
  legalTextVersion: string;
  actorType: string;
  actorId: string;
  ipHash: string;
  userAgent: string;
  reason: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export function mapPreference(doc: PreferenceDoc): NewsletterPreferenceSummary {
  return {
    id: toIdString(doc._id),
    userId: clean(doc.userId),
    email: normalizeEmail(doc.email),
    firstName: clean(doc.firstName),
    status: normalizeStatus(doc.status),
    consentAt: toDateOrNull(doc.consentAt)?.toISOString() || null,
    unsubscribedAt: toDateOrNull(doc.unsubscribedAt)?.toISOString() || null,
    source: clean(doc.source),
    legalTextVersion: clean(doc.legalTextVersion) || 'v1',
    updatedAt: toDateOrNull(doc.updatedAt)?.toISOString() || null,
    createdAt: toDateOrNull(doc.createdAt)?.toISOString() || null
  };
}

function mapConsentEvent(doc: ConsentEventDoc): NewsletterConsentEventSummary {
  return {
    id: toIdString(doc._id),
    userId: clean(doc.userId),
    email: normalizeEmail(doc.email),
    eventType: clean(doc.eventType),
    source: clean(doc.source),
    legalTextVersion: clean(doc.legalTextVersion) || 'v1',
    actorType: clean(doc.actorType),
    actorId: clean(doc.actorId),
    ipHash: clean(doc.ipHash),
    userAgent: clean(doc.userAgent),
    reason: clean(doc.reason),
    createdAt: toDateOrNull(doc.createdAt)?.toISOString() || null,
    updatedAt: toDateOrNull(doc.updatedAt)?.toISOString() || null
  };
}

export async function ensureNewsletterPreferenceForUser(input: {
  userId: string;
  email: string;
  firstName?: string | null;
}) {
  await connectDB();
  const userId = clean(input.userId);
  const email = normalizeEmail(input.email);
  if (!userId || !email) return null;
  const firstName = clean(input.firstName) || toFirstName('', email);

  const updated = (await NewsletterPreference.findOneAndUpdate(
    { userId },
    {
      $set: {
        email,
        firstName
      },
      $setOnInsert: {
        status: 'not_consented',
        source: 'account-seed',
        legalTextVersion: 'v1',
        consentAt: null,
        unsubscribedAt: null,
        lastUpdatedBy: {
          actorType: 'system',
          actorId: 'seed'
        }
      }
    },
    { upsert: true, new: true }
  ).lean()) as PreferenceDoc | null;

  return updated ? mapPreference(updated) : null;
}

export async function ensureNewsletterPreferencesForRegisteredUsers(limit = 3000) {
  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) return { synced: 0 };

  const users = (await db
    .collection<RegisteredUserRow>('user')
    .find({}, { projection: { _id: 1, email: 1, name: 1 } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray()) as RegisteredUserRow[];

  if (!users.length) return { synced: 0 };

  const userIds = users.map((user) => toIdString(user._id)).filter(Boolean);
  const existing = (await NewsletterPreference.find(
    { userId: { $in: userIds } },
    { userId: 1 }
  ).lean()) as Array<{ userId?: string }>;
  const existingIds = new Set(existing.map((row) => clean(row.userId)).filter(Boolean));

  const inserts = users
    .map((user) => {
      const userId = toIdString(user._id);
      const email = normalizeEmail(user.email);
      if (!userId || !email || existingIds.has(userId)) return null;
      return {
        userId,
        email,
        firstName: toFirstName(user.name, email),
        status: 'not_consented' as NewsletterStatus,
        source: 'account-seed',
        legalTextVersion: 'v1',
        consentAt: null,
        unsubscribedAt: null,
        lastUpdatedBy: {
          actorType: 'system',
          actorId: 'seed'
        }
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (!inserts.length) return { synced: 0 };
  await NewsletterPreference.insertMany(inserts, { ordered: false }).catch(() => null);
  return { synced: inserts.length };
}

export async function writeConsentEvent(input: {
  userId: string;
  email: string;
  eventType: 'subscribe' | 'unsubscribe' | 'resubscribe' | 'set-not-consented' | 'set-pending';
  source?: string;
  legalTextVersion?: string;
  actorType?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
}, session?: ClientSession) {
  await NewsletterConsentEvent.create([{
    userId: clean(input.userId),
    email: normalizeEmail(input.email),
    eventType: input.eventType,
    source: clean(input.source),
    legalTextVersion: clean(input.legalTextVersion) || 'v1',
    actorType: clean(input.actorType) || 'system',
    actorId: clean(input.actorId),
    ipHash: hashIp(input.ip || ''),
    userAgent: clean(input.userAgent),
    reason: clean(input.reason)
  }], { session });
}

export async function setNewsletterConsentForUser(input: {
  userId: string;
  email: string;
  firstName?: string | null;
  status: NewsletterStatus;
  source?: string;
  legalTextVersion?: string;
  actorType?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
  notify?: boolean;
}) {
  const connection = await requireNewsletterDatabase();
  const userId = clean(input.userId); const email = normalizeEmail(input.email);
  if (!userId || !email) return null;
  const session = await connection.startSession();
  const key = 'newsletter-consent:' + crypto.randomUUID();
  let queued = false;
  try {
    const result = await session.withTransaction(async () => {
      queued = false;
      const prior = await NewsletterPreference.findOne({ userId }).session(session).lean() as PreferenceDoc | null;
      const status = normalizeStatus(input.status);
      const now = new Date();
      const actorType = clean(input.actorType) || 'system';
      const actorId = clean(input.actorId);
      const changed = prior?.status !== status;
      const updated = await NewsletterPreference.findOneAndUpdate({ userId }, { $set: {
        email, firstName: clean(input.firstName) || toFirstName('', email), status,
        source: clean(input.source), legalTextVersion: clean(input.legalTextVersion) || 'v1',
        lastUpdatedBy: { actorType, actorId },
        consentAt: status === 'subscribed' ? (changed ? now : prior?.consentAt) : null,
        unsubscribedAt: status === 'unsubscribed' ? (changed ? now : prior?.unsubscribedAt) : null
      } }, { new: true, upsert: true, session }).lean() as PreferenceDoc | null;
      if (!updated) return null;
      if (changed) {
        await writeConsentEvent({ ...input, userId, email, actorType, actorId,
          eventType: status === 'subscribed' ? (prior?.status === 'unsubscribed' ? 'resubscribe' : 'subscribe')
            : status === 'pending' ? 'set-pending' : status === 'unsubscribed' ? 'unsubscribe' : 'set-not-consented'
        }, session);
        if (input.notify && (status === 'subscribed' || status === 'unsubscribed')) {
          await enqueueNotification({ key, kind: status === 'subscribed' ? 'newsletter-confirmed' : 'newsletter-unsubscribed', payload: { email, firstName: updated.firstName } }, session);
          queued = true;
        }
      }
      return mapPreference(updated);
    });
    if (queued) await flushNotification(key);
    return result;
  } finally { await session.endSession(); }
}

export async function unsubscribeNewsletterByEmail(input: {
  email: string;
  source?: string;
  actorType?: string;
  actorId?: string;
  reason?: string;
  ip?: string;
  userAgent?: string;
}) {
  const connection = await requireNewsletterDatabase();
  const email = normalizeEmail(input.email);
  if (!email) return { updated: 0 };
  const session = await connection.startSession();
  const notificationKey = `newsletter-unsubscribed:${crypto.randomUUID()}`;
  try {
    // One transaction covers all accounts sharing an address and their audit events.
    // Concurrent requests retry against the committed state and cannot send twice.
    return await session.withTransaction(async () => {
      const rows = await NewsletterPreference.find({ email, status: { $ne: 'unsubscribed' } })
        .session(session).lean() as PreferenceDoc[];
      if (!rows.length) return { updated: 0 };
      const source = clean(input.source) || 'email-unsubscribe';
      const actorType = clean(input.actorType) || 'token';
      const actorId = clean(input.actorId);
      await NewsletterPreference.updateMany(
        { _id: { $in: rows.map((row) => row._id) } },
        { $set: { status: 'unsubscribed', unsubscribedAt: new Date(), source, lastUpdatedBy: { actorType, actorId } } },
        { session }
      );
      for (const row of rows) {
        await writeConsentEvent({
          userId: clean(row.userId), email, eventType: 'unsubscribe', source,
          legalTextVersion: row.legalTextVersion, actorType, actorId,
          reason: input.reason, ip: input.ip, userAgent: input.userAgent
        }, session);
      }
      await enqueueNotification({ key: notificationKey, kind: 'newsletter-unsubscribed', payload: { email, firstName: clean(rows[0].firstName) } }, session);
      return { updated: rows.length, notificationKey };
    });
  } finally {
    await session.endSession();
  }
}

export async function getNewsletterPreferenceForUser(userId: string) {
  await connectDB();
  const row = (await NewsletterPreference.findOne({ userId: clean(userId) }).lean()) as PreferenceDoc | null;
  return row ? mapPreference(row) : null;
}

export async function listNewsletterPreferences(options?: {
  status?: NewsletterStatus | 'all';
  q?: string;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.max(1, Math.min(1000, Math.round(options?.limit || 200)));
  const query: Record<string, unknown> = {};
  if (options?.status && options.status !== 'all') {
    query.status = normalizeStatus(options.status);
  }
  const q = clean(options?.q);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { email: { $regex: safe, $options: 'i' } },
      { firstName: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await NewsletterPreference.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()) as PreferenceDoc[];

  return rows.map((row) => mapPreference(row));
}

export async function getNewsletterPreferenceCounts() {
  await connectDB();
  const [total, subscribed, pending, unsubscribed, notConsented] = await Promise.all([
    NewsletterPreference.countDocuments({}),
    NewsletterPreference.countDocuments({ status: 'subscribed' }),
    NewsletterPreference.countDocuments({ status: 'pending' }),
    NewsletterPreference.countDocuments({ status: 'unsubscribed' }),
    NewsletterPreference.countDocuments({ status: 'not_consented' })
  ]);
  return { total, subscribed, pending, unsubscribed, notConsented };
}

export async function listSubscribedRecipients(limit = 10000) {
  await connectDB();
  const rows = (await NewsletterPreference.find({ status: 'subscribed' })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .lean()) as PreferenceDoc[];
  return rows.map((row) => ({
    userId: clean(row.userId),
    email: normalizeEmail(row.email),
    firstName: clean(row.firstName) || toFirstName('', row.email)
  }));
}

export async function listDispatchRecipients(limit = 10000) {
  await connectDB();
  const rows = (await NewsletterPreference.find({ status: 'subscribed' })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()) as PreferenceDoc[];

  const dedupedByEmail = new Map<
    string,
    {
      userId: string;
      email: string;
      firstName: string;
    }
  >();

  for (const row of rows) {
    const email = normalizeEmail(row.email);
    if (!email) continue;
    if (dedupedByEmail.has(email)) continue;
    dedupedByEmail.set(email, {
      userId: clean(row.userId),
      email,
      firstName: clean(row.firstName) || toFirstName('', row.email)
    });
  }

  return [...dedupedByEmail.values()];
}

export async function getNewsletterPreferenceByEmail(email: string) {
  await connectDB();
  const row = (await NewsletterPreference.findOne({ email: normalizeEmail(email) }).lean()) as PreferenceDoc | null;
  return row ? mapPreference(row) : null;
}

export async function listNewsletterConsentEventsForUser(userId: string, limit = 100) {
  await connectDB();
  const rows = (await NewsletterConsentEvent.find({ userId: clean(userId) })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as ConsentEventDoc[];
  return rows.map(mapConsentEvent);
}

export async function listNewsletterConsentEventsForEmail(email: string, limit = 100) {
  await connectDB();
  const rows = (await NewsletterConsentEvent.find({ email: normalizeEmail(email) })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as ConsentEventDoc[];
  return rows.map(mapConsentEvent);
}
