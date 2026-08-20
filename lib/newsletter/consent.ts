import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/consent.ts');

import crypto from 'node:crypto';
import { connectDB } from '@/lib/db';
import { NewsletterConsentEvent } from '@/models/NewsletterConsentEvent';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { clean, normalizeEmail, toFirstName, toIdString, type NewsletterStatus } from '@/lib/newsletter/shared';

type RegisteredUserRow = {
  _id: unknown;
  email?: string | null;
  name?: string | null;
};

type PreferenceDoc = {
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

function mapPreference(doc: PreferenceDoc): NewsletterPreferenceSummary {
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

async function writeConsentEvent(input: {
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
}) {
  await NewsletterConsentEvent.create({
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
  });
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
}) {
  await connectDB();
  const userId = clean(input.userId);
  const email = normalizeEmail(input.email);
  if (!userId || !email) return null;
  const firstName = clean(input.firstName) || toFirstName('', email);
  const status = normalizeStatus(input.status);
  const now = new Date();
  const existing = (await NewsletterPreference.findOne({ userId }, { status: 1 }).lean()) as
    | { status?: NewsletterStatus }
    | null;
  const prior = normalizeStatus(existing?.status);
  const source = clean(input.source);
  const legalTextVersion = clean(input.legalTextVersion) || 'v1';
  const actorType = clean(input.actorType) || 'system';
  const actorId = clean(input.actorId);
  const updated = (await NewsletterPreference.findOneAndUpdate(
    { userId },
    {
      $set: {
        email,
        firstName,
        status,
        source,
        legalTextVersion,
        lastUpdatedBy: {
          actorType,
          actorId
        },
        consentAt: status === 'subscribed' ? now : null,
        unsubscribedAt: status === 'unsubscribed' ? now : null
      }
    },
    { upsert: true, new: true }
  ).lean()) as PreferenceDoc | null;

  const changed = prior !== status;
  if (!changed) {
    return updated ? mapPreference(updated) : null;
  }
  const eventType =
    status === 'subscribed'
      ? prior === 'subscribed'
        ? 'subscribe'
        : prior === 'unsubscribed'
          ? 'resubscribe'
          : 'subscribe'
      : status === 'unsubscribed'
        ? 'unsubscribe'
        : status === 'pending'
          ? 'set-pending'
          : 'set-not-consented';

  await writeConsentEvent({
    userId,
    email,
    eventType,
    source,
    legalTextVersion,
    actorType,
    actorId,
    ip: input.ip,
    userAgent: input.userAgent,
    reason: input.reason
  });

  return updated ? mapPreference(updated) : null;
}

export async function unsubscribeNewsletterByEmail(input: {
  email: string;
  source?: string;
  actorType?: string;
  actorId?: string;
  reason?: string;
}) {
  await connectDB();
  const email = normalizeEmail(input.email);
  if (!email) return { updated: 0 };
  const rows = (await NewsletterPreference.find({ email }).lean()) as PreferenceDoc[];
  if (!rows.length) return { updated: 0 };
  const rowsToUpdate = rows.filter((row) => normalizeStatus(row.status) !== 'unsubscribed');
  if (!rowsToUpdate.length) return { updated: 0 };

  const now = new Date();
  const bulkOps = rowsToUpdate.map((row) => ({
    updateOne: {
      filter: { userId: clean(row.userId) },
      update: {
        $set: {
          status: 'unsubscribed',
          unsubscribedAt: now,
          source: clean(input.source) || 'email-unsubscribe',
          lastUpdatedBy: {
            actorType: clean(input.actorType) || 'token',
            actorId: clean(input.actorId)
          }
        }
      }
    }
  }));
  if (bulkOps.length) {
    await NewsletterPreference.bulkWrite(bulkOps, { ordered: false });
  }

  await Promise.all(
    rowsToUpdate.map((row) =>
      writeConsentEvent({
        userId: clean(row.userId),
        email,
        eventType: 'unsubscribe',
        source: clean(input.source) || 'email-unsubscribe',
        actorType: clean(input.actorType) || 'token',
        actorId: clean(input.actorId),
        reason: input.reason
      })
    )
  );

  return { updated: bulkOps.length };
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
