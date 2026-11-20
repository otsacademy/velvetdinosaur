import { NewsletterPreference } from '@/models/NewsletterPreference';
import { EventRegistration } from '@/models/EventRegistration';
import { validateNewsletterConfirmToken } from '@/lib/newsletter/confirm-token';
import { validateEventRegistrationConfirmToken } from '@/lib/event-registration/confirm-token';
import type { NotificationInput } from './notification-outbox';

export async function isNotificationCurrent(job: NotificationInput) {
  switch (job.kind) {
    case 'newsletter-verify': {
      const token = validateNewsletterConfirmToken(job.payload.token);
      return token.ok && Boolean(await NewsletterPreference.exists({ userId: token.userId, email: token.email, status: 'pending' }));
    }
    case 'newsletter-confirmed': return Boolean(await NewsletterPreference.exists({ email: job.payload.email, status: 'subscribed' }));
    case 'newsletter-unsubscribed': return !await NewsletterPreference.exists({ email: job.payload.email, status: { $ne: 'unsubscribed' } });
    case 'event-verify': {
      const token = validateEventRegistrationConfirmToken(job.payload.token);
      return token.ok && Boolean(await EventRegistration.exists({ _id: token.registrationId, email: token.email, eventId: token.eventId, status: 'pending' }));
    }
    case 'event-confirmed': return Boolean(await EventRegistration.exists({ eventSlug: job.payload.eventSlug, email: job.payload.email, status: 'confirmed' }));
  }
}
