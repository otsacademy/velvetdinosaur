import { randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { EventRegistration } from '@/models/EventRegistration';
import { EventRegistrationEvent } from '@/models/EventRegistrationEvent';
import { enqueueNotification, flushNotification } from '@/lib/email/notification-outbox';
import { mapRegistration, type EventRegistrationDoc } from './registrations';
import { getEventRegistrationContextById } from './event-context';
import type { EventRegistrationConfirmResult } from './confirm';

export async function confirmEventTransition(input: { registrationId: string; eventId: string; email: string; source: string; actorType: string; actorId: string }): Promise<EventRegistrationConfirmResult> {
  const connection = await requireNewsletterDatabase();
  const context = await getEventRegistrationContextById(input.eventId);
  const session = await connection.startSession();
  const key = `event-confirmed:${randomUUID()}`;
  try {
    const result = await session.withTransaction(async (): Promise<EventRegistrationConfirmResult> => {
      const filter = { _id: input.registrationId, eventId: input.eventId, email: input.email };
      const row = await EventRegistration.findOneAndUpdate({ ...filter, status: 'pending' }, { $set: {
        status: 'confirmed', confirmedAt: new Date(), lastUpdatedBy: { actorType: input.actorType, actorId: input.actorId }
      } }, { new: true, session }).lean() as EventRegistrationDoc | null;
      if (!row) {
        const current = await EventRegistration.findOne(filter).session(session).lean() as EventRegistrationDoc | null;
        if (!current || current.status !== 'confirmed') return { ok: false, error: 'not-pending' };
        const registration = mapRegistration(current);
        return { ok: true, email: registration.email, eventSlug: registration.eventSlug, eventTitle: registration.eventTitle, status: 'already-confirmed' };
      }
      const registration = mapRegistration(row);
      await EventRegistrationEvent.create([{ ...input, eventSlug: registration.eventSlug, eventType: 'confirm', legalTextVersion: registration.legalTextVersion, reason: 'double-opt-in-confirmed' }], { session });
      await enqueueNotification({ key, kind: 'event-confirmed', payload: {
        email: registration.email, firstName: registration.firstName, eventTitle: registration.eventTitle, eventSlug: registration.eventSlug,
        eventDateLabel: context?.dateLabel || 'Date TBA', eventLocation: context ? `${context.venue} ${context.location}`.trim() : ''
      } }, session);
      return { ok: true, email: registration.email, eventSlug: registration.eventSlug, eventTitle: registration.eventTitle, status: 'confirmed' };
    });
    if (result?.ok && result.status === 'confirmed') await flushNotification(key);
    return result!;
  } finally { await session.endSession(); }
}
