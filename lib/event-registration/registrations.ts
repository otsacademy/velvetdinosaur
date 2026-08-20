import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/registrations.ts');

import crypto from 'node:crypto';
import { connectDB } from '@/lib/db';
import { Event } from '@/models/Event';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationEvent } from '@/models/EventRegistrationEvent';
import {
  clean,
  normalizeEmail,
  normalizeEventRegistrationStatus,
  toFirstName,
  toFullName,
  toIdString,
  type EventRegistrationEventType,
  type EventRegistrationStatus
} from '@/lib/event-registration/shared';

type EventRegistrationDoc = {
  _id?: unknown;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
  userId?: string;
  email?: string;
  fullName?: string;
  firstName?: string;
  status?: EventRegistrationStatus;
  consentAt?: Date | string | null;
  confirmedAt?: Date | string | null;
  source?: string;
  legalTextVersion?: string;
  updatedAt?: Date | string | null;
  createdAt?: Date | string | null;
};

type EventRegistrationEventDoc = {
  _id?: unknown;
  registrationId?: string;
  eventId?: string;
  eventSlug?: string;
  email?: string;
  eventType?: EventRegistrationEventType;
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

type EventRow = {
  _id?: unknown;
  slug?: string;
  title?: string;
  startDateTime?: Date | string | null;
  endDateTime?: Date | string | null;
  status?: string;
  registrationMode?: string;
};

function toDateOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function hashIp(ip: string) {
  const normalized = clean(ip);
  if (!normalized) return '';
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export type EventRegistrationSummary = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  userId: string;
  email: string;
  fullName: string;
  firstName: string;
  status: EventRegistrationStatus;
  consentAt: string | null;
  confirmedAt: string | null;
  source: string;
  legalTextVersion: string;
  updatedAt: string | null;
  createdAt: string | null;
};

export type EventRegistrationEventSummary = {
  id: string;
  registrationId: string;
  eventId: string;
  eventSlug: string;
  email: string;
  eventType: EventRegistrationEventType;
  source: string;
  legalTextVersion: string;
  actorType: string;
  actorId: string;
  ipHash: string;
  userAgent: string;
  reason: string;
  createdAt: string | null;
};

export type EventRegistrationWorkspaceEvent = {
  id: string;
  slug: string;
  title: string;
  startDateTime: string | null;
  status: string;
  registrationMode: string;
  pendingCount: number;
  confirmedCount: number;
  cancelledCount: number;
  totalCount: number;
};

function mapRegistration(doc: EventRegistrationDoc): EventRegistrationSummary {
  return {
    id: toIdString(doc._id),
    eventId: clean(doc.eventId),
    eventSlug: clean(doc.eventSlug),
    eventTitle: clean(doc.eventTitle),
    userId: clean(doc.userId),
    email: normalizeEmail(doc.email),
    fullName: clean(doc.fullName),
    firstName: clean(doc.firstName),
    status: normalizeEventRegistrationStatus(doc.status),
    consentAt: toDateOrNull(doc.consentAt)?.toISOString() || null,
    confirmedAt: toDateOrNull(doc.confirmedAt)?.toISOString() || null,
    source: clean(doc.source),
    legalTextVersion: clean(doc.legalTextVersion) || 'v1',
    updatedAt: toDateOrNull(doc.updatedAt)?.toISOString() || null,
    createdAt: toDateOrNull(doc.createdAt)?.toISOString() || null
  };
}

function mapRegistrationEvent(doc: EventRegistrationEventDoc): EventRegistrationEventSummary {
  return {
    id: toIdString(doc._id),
    registrationId: clean(doc.registrationId),
    eventId: clean(doc.eventId),
    eventSlug: clean(doc.eventSlug),
    email: normalizeEmail(doc.email),
    eventType: (clean(doc.eventType) as EventRegistrationEventType) || 'request',
    source: clean(doc.source),
    legalTextVersion: clean(doc.legalTextVersion) || 'v1',
    actorType: clean(doc.actorType),
    actorId: clean(doc.actorId),
    ipHash: clean(doc.ipHash),
    userAgent: clean(doc.userAgent),
    reason: clean(doc.reason),
    createdAt: toDateOrNull(doc.createdAt)?.toISOString() || null
  };
}

export async function writeEventRegistrationEvent(input: {
  registrationId: string;
  eventId: string;
  eventSlug: string;
  email: string;
  eventType: EventRegistrationEventType;
  source?: string;
  legalTextVersion?: string;
  actorType?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
}) {
  await connectDB();
  const created = await EventRegistrationEvent.create({
    registrationId: clean(input.registrationId),
    eventId: clean(input.eventId),
    eventSlug: clean(input.eventSlug),
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
  return mapRegistrationEvent(created.toObject() as EventRegistrationEventDoc);
}

export async function getEventRegistrationById(registrationId: string) {
  await connectDB();
  const row = (await EventRegistration.findById(clean(registrationId)).lean()) as EventRegistrationDoc | null;
  return row ? mapRegistration(row) : null;
}

export async function getEventRegistrationByEmail(eventId: string, email: string) {
  await connectDB();
  const row = (await EventRegistration.findOne({
    eventId: clean(eventId),
    email: normalizeEmail(email)
  }).lean()) as EventRegistrationDoc | null;
  return row ? mapRegistration(row) : null;
}

export async function createOrUpdatePendingEventRegistration(input: {
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  userId?: string | null;
  email: string;
  fullName: string;
  source?: string;
  legalTextVersion?: string;
  actorType?: string;
  actorId?: string;
  ip?: string;
  userAgent?: string;
  reason?: string;
}) {
  await connectDB();
  const eventId = clean(input.eventId);
  const email = normalizeEmail(input.email);
  const fullName = toFullName(input.fullName, email);
  if (!eventId || !email || !fullName) return null;

  const firstName = toFirstName(fullName, email);
  const now = new Date();
  const existing = (await EventRegistration.findOne({ eventId, email }, { status: 1, consentAt: 1 })
    .lean()) as EventRegistrationDoc | null;
  const priorStatus = normalizeEventRegistrationStatus(existing?.status);
  const updated = (await EventRegistration.findOneAndUpdate(
    { eventId, email },
    {
      $set: {
        eventSlug: clean(input.eventSlug),
        eventTitle: clean(input.eventTitle),
        userId: clean(input.userId),
        email,
        fullName,
        firstName,
        status: 'pending',
        source: clean(input.source),
        legalTextVersion: clean(input.legalTextVersion) || 'v1',
        lastUpdatedBy: {
          actorType: clean(input.actorType) || 'system',
          actorId: clean(input.actorId)
        },
        consentAt: existing?.consentAt ? toDateOrNull(existing.consentAt) : now,
        confirmedAt: null
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean()) as EventRegistrationDoc | null;

  if (!updated) return null;
  const summary = mapRegistration(updated);
  if (!existing || priorStatus !== 'pending') {
    await writeEventRegistrationEvent({
      registrationId: summary.id,
      eventId: summary.eventId,
      eventSlug: summary.eventSlug,
      email: summary.email,
      eventType: 'request',
      source: input.source,
      legalTextVersion: summary.legalTextVersion,
      actorType: clean(input.actorType) || 'system',
      actorId: clean(input.actorId),
      ip: input.ip,
      userAgent: input.userAgent,
      reason: clean(input.reason) || 'registration-requested'
    });
  }
  return summary;
}

export async function confirmEventRegistrationById(input: {
  registrationId: string;
  eventId?: string;
  source?: string;
  actorType?: string;
  actorId?: string;
  reason?: string;
}) {
  await connectDB();
  const registrationId = clean(input.registrationId);
  if (!registrationId) return null;

  const existing = (await EventRegistration.findById(registrationId).lean()) as EventRegistrationDoc | null;
  if (!existing) return null;
  const priorStatus = normalizeEventRegistrationStatus(existing.status);
  const updated = (await EventRegistration.findOneAndUpdate(
    { _id: registrationId },
    {
      $set: {
        status: 'confirmed',
        confirmedAt: priorStatus === 'confirmed' ? toDateOrNull(existing.confirmedAt) : new Date(),
        lastUpdatedBy: {
          actorType: clean(input.actorType) || 'system',
          actorId: clean(input.actorId)
        }
      }
    },
    { new: true }
  ).lean()) as EventRegistrationDoc | null;

  if (!updated) return null;
  const summary = mapRegistration(updated);
  if (priorStatus !== 'confirmed') {
    await writeEventRegistrationEvent({
      registrationId: summary.id,
      eventId: summary.eventId,
      eventSlug: summary.eventSlug,
      email: summary.email,
      eventType: 'confirm',
      source: input.source,
      legalTextVersion: summary.legalTextVersion,
      actorType: clean(input.actorType) || 'system',
      actorId: clean(input.actorId),
      reason: clean(input.reason) || 'registration-confirmed'
    });
  }
  return summary;
}

export async function listEventRegistrations(options?: {
  eventId?: string | null;
  status?: EventRegistrationStatus | 'all';
  q?: string | null;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.max(1, Math.min(1000, Math.round(options?.limit || 250)));
  const query: Record<string, unknown> = {};
  const eventId = clean(options?.eventId);
  if (eventId) query.eventId = eventId;
  if (options?.status && options.status !== 'all') {
    query.status = normalizeEventRegistrationStatus(options.status);
  }

  const q = clean(options?.q);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { email: { $regex: safe, $options: 'i' } },
      { firstName: { $regex: safe, $options: 'i' } },
      { fullName: { $regex: safe, $options: 'i' } },
      { eventTitle: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await EventRegistration.find(query)
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(limit)
    .lean()) as EventRegistrationDoc[];
  return rows.map(mapRegistration);
}

export async function listEventRegistrationEvents(registrationId: string, limit = 100) {
  await connectDB();
  const rows = (await EventRegistrationEvent.find({ registrationId: clean(registrationId) })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as EventRegistrationEventDoc[];
  return rows.map(mapRegistrationEvent);
}

export async function countEventRegistrationsForEvent(eventId: string) {
  await connectDB();
  const resolvedEventId = clean(eventId);
  if (!resolvedEventId) {
    return { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  }
  const [total, pending, confirmed, cancelled] = await Promise.all([
    EventRegistration.countDocuments({ eventId: resolvedEventId }),
    EventRegistration.countDocuments({ eventId: resolvedEventId, status: 'pending' }),
    EventRegistration.countDocuments({ eventId: resolvedEventId, status: 'confirmed' }),
    EventRegistration.countDocuments({ eventId: resolvedEventId, status: 'cancelled' })
  ]);
  return { total, pending, confirmed, cancelled };
}

export async function listConfirmedEventRecipients(eventId: string, limit = 10000) {
  await connectDB();
  const rows = (await EventRegistration.find({
    eventId: clean(eventId),
    status: 'confirmed'
  })
    .sort({ updatedAt: -1, createdAt: -1 })
    .limit(Math.max(1, Math.min(20000, Math.round(limit))))
    .lean()) as EventRegistrationDoc[];

  return rows.map((row) => {
    const summary = mapRegistration(row);
    return {
      registrationId: summary.id,
      eventId: summary.eventId,
      eventSlug: summary.eventSlug,
      eventTitle: summary.eventTitle,
      email: summary.email,
      fullName: summary.fullName,
      firstName: summary.firstName || toFirstName(summary.fullName, summary.email)
    };
  });
}

export async function listLocalRegistrationEvents(limit = 200): Promise<EventRegistrationWorkspaceEvent[]> {
  await connectDB();
  const rows = (await Event.find({
    registrationMode: 'local'
  })
    .sort({ startDateTime: -1, createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as EventRow[];

  const items = await Promise.all(
    rows.map(async (row) => {
      const id = toIdString(row._id);
      const counts = await countEventRegistrationsForEvent(id);
      return {
        id,
        slug: clean(row.slug),
        title: clean(row.title),
        startDateTime: toDateOrNull(row.startDateTime)?.toISOString() || null,
        status: clean(row.status),
        registrationMode: clean(row.registrationMode) || 'local',
        pendingCount: counts.pending,
        confirmedCount: counts.confirmed,
        cancelledCount: counts.cancelled,
        totalCount: counts.total
      } satisfies EventRegistrationWorkspaceEvent;
    })
  );

  return items;
}

export async function listEventOutreachEvents(limit = 200): Promise<EventRegistrationWorkspaceEvent[]> {
  await connectDB();
  const now = new Date();
  const rows = (await Event.find({
    endDateTime: { $gte: now }
  })
    .sort({ startDateTime: 1, createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as EventRow[];

  const items = await Promise.all(
    rows.map(async (row) => {
      const id = toIdString(row._id);
      const counts = await countEventRegistrationsForEvent(id);
      return {
        id,
        slug: clean(row.slug),
        title: clean(row.title),
        startDateTime: toDateOrNull(row.startDateTime)?.toISOString() || null,
        status: clean(row.status),
        registrationMode: clean(row.registrationMode) || 'none',
        pendingCount: counts.pending,
        confirmedCount: counts.confirmed,
        cancelledCount: counts.cancelled,
        totalCount: counts.total
      } satisfies EventRegistrationWorkspaceEvent;
    })
  );

  return items;
}
