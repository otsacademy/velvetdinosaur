import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/confirm.ts');

import { sendEventRegistrationConfirmationEmail } from '@/lib/email/event-registration-lifecycle';
import { validateEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import { getEventRegistrationContextById } from '@/lib/event-registration/event-context';
import {
  confirmEventRegistrationById,
  getEventRegistrationById
} from '@/lib/event-registration/registrations';
import { clean } from '@/lib/event-registration/shared';

export type EventRegistrationConfirmResult =
  | {
      ok: true;
      email: string;
      eventSlug: string;
      eventTitle: string;
      status: 'confirmed' | 'already-confirmed';
    }
  | {
      ok: false;
      error: 'invalid-token' | 'expired-token' | 'misconfigured' | 'not-pending';
    };

export async function confirmEventRegistrationWithToken(
  rawToken: string,
  options?: { source?: string; actorType?: string; actorId?: string }
): Promise<EventRegistrationConfirmResult> {
  const validated = validateEventRegistrationConfirmToken(rawToken);
  if (!validated.ok) {
    if (validated.reason === 'expired') return { ok: false, error: 'expired-token' };
    if (validated.reason === 'misconfigured') return { ok: false, error: 'misconfigured' };
    return { ok: false, error: 'invalid-token' };
  }

  const current = await getEventRegistrationById(validated.registrationId);
  if (!current) return { ok: false, error: 'not-pending' };
  if (current.email !== validated.email || current.eventId !== validated.eventId) {
    return { ok: false, error: 'invalid-token' };
  }

  if (current.status === 'confirmed') {
    return {
      ok: true,
      email: current.email,
      eventSlug: current.eventSlug,
      eventTitle: current.eventTitle,
      status: 'already-confirmed'
    };
  }

  if (current.status !== 'pending') {
    return { ok: false, error: 'not-pending' };
  }

  const updated = await confirmEventRegistrationById({
    registrationId: current.id,
    eventId: current.eventId,
    source: clean(options?.source) || 'event-registration-confirm-link',
    actorType: clean(options?.actorType) || 'token',
    actorId: clean(options?.actorId) || current.id,
    reason: 'event-registration-confirmed'
  });

  if (!updated || updated.status !== 'confirmed') {
    return { ok: false, error: 'not-pending' };
  }
  const eventContext = await getEventRegistrationContextById(updated.eventId);

  void sendEventRegistrationConfirmationEmail({
    email: updated.email,
    firstName: updated.firstName || updated.fullName,
    eventTitle: updated.eventTitle,
    eventSlug: updated.eventSlug,
    eventDateLabel: eventContext?.dateLabel || 'Date TBA',
    eventLocation: eventContext ? `${eventContext.venue} ${eventContext.location}`.trim() : ''
  }).catch((error) => {
    console.error('[event-registration] confirmation send failed', error);
  });

  return {
    ok: true,
    email: updated.email,
    eventSlug: updated.eventSlug,
    eventTitle: updated.eventTitle,
    status: 'confirmed'
  };
}
