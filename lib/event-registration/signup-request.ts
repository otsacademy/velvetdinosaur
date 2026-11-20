import { createHash, randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationEvent } from '@/models/EventRegistrationEvent';
import { createEventRegistrationConfirmToken } from './confirm-token';
import { mapRegistration, type EventRegistrationDoc } from './registrations';
import { enqueueNotification } from '@/lib/email/notification-outbox';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';
import { toFirstName } from './shared';

export async function requestEventRegistration(input: {
  eventId: string; eventSlug: string; eventTitle: string; eventDateLabel: string; eventLocation: string;
  email: string; fullName: string; userId?: string; source: string; legalTextVersion: string;
  ip: string; userAgent: string; ttlMinutes: number; cooldownMinutes: number;
}) {
  const connection = await requireNewsletterDatabase();
  const session = await connection.startSession();
  const key = `event-request:${randomUUID()}`;
  try {
    const queued = await session.withTransaction(async () => {
      const filter = { eventId: input.eventId, email: input.email };
      const prior = await EventRegistration.findOne(filter).session(session).lean() as EventRegistrationDoc | null;
      if (prior?.status === 'confirmed') return false;
      const allowed = await checkDurableRateLimit({ id: 'event-confirmation-email', key: `${input.eventId}:${input.email}`, limit: 1,
        windowMs: input.cooldownMinutes * 60_000 }, session);
      if (!allowed.ok) return false;
      const fullName = prior?.fullName || input.fullName;
      const updated = await EventRegistration.findOneAndUpdate(filter, { $set: {
        ...filter, eventSlug: input.eventSlug, eventTitle: input.eventTitle,
        userId: prior?.userId || input.userId || '', fullName, firstName: toFirstName(fullName),
        status: 'pending', source: input.source, legalTextVersion: input.legalTextVersion, confirmedAt: null,
        consentAt: prior?.consentAt || new Date(), lastUpdatedBy: { actorType: input.userId ? 'user' : 'public', actorId: input.userId || '' }
      } }, { new: true, upsert: true, session }).lean() as EventRegistrationDoc | null;
      const registration = mapRegistration(updated!);
      const token = createEventRegistrationConfirmToken({ ...filter, registrationId: registration.id, ttlSeconds: input.ttlMinutes * 60 });
      if (!token) throw new Error('Confirmation is temporarily unavailable.');
      await EventRegistrationEvent.create([{ ...filter, registrationId: registration.id, eventSlug: input.eventSlug,
        eventType: prior?.status === 'pending' ? 'resend-confirmation' : 'request', source: input.source, legalTextVersion: input.legalTextVersion,
        actorType: input.userId ? 'user' : 'public', actorId: input.userId || '', userAgent: input.userAgent,
        ipHash: input.ip ? createHash('sha256').update(input.ip).digest('hex') : ''
      }], { session });
      await enqueueNotification({ key, kind: 'event-verify', payload: { email: input.email, firstName: registration.firstName,
        eventTitle: input.eventTitle, eventSlug: input.eventSlug, eventDateLabel: input.eventDateLabel, eventLocation: input.eventLocation,
        token, expiresInHours: Math.max(1, Math.round(input.ttlMinutes / 60)) } }, session);
      return true;
    });
    return queued ? key : null;
  } finally { await session.endSession(); }
}
