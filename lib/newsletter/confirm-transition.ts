import { randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from './database';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { mapPreference, writeConsentEvent, type PreferenceDoc } from './consent';
import { enqueueNotification, flushNotification } from '@/lib/email/notification-outbox';
import type { NewsletterConfirmResult } from './confirm';

export async function confirmNewsletterTransition(input: { userId: string; email: string; source: string; actorType: string; actorId: string }): Promise<NewsletterConfirmResult> {
  const connection = await requireNewsletterDatabase();
  const session = await connection.startSession();
  const key = `newsletter-confirmed:${randomUUID()}`;
  try {
    const result = await session.withTransaction(async (): Promise<NewsletterConfirmResult> => {
      const filter = { userId: input.userId, email: input.email };
      const row = await NewsletterPreference.findOneAndUpdate({ ...filter, status: 'pending' }, { $set: {
        status: 'subscribed', consentAt: new Date(), unsubscribedAt: null, source: input.source,
        lastUpdatedBy: { actorType: input.actorType, actorId: input.actorId }
      } }, { new: true, session }).lean() as PreferenceDoc | null;
      if (!row) {
        const current = await NewsletterPreference.findOne(filter).session(session).lean() as PreferenceDoc | null;
        if (current?.status === 'subscribed') return { ok: true, email: input.email, userId: input.userId, status: 'already-subscribed' };
        return { ok: false, error: 'not-pending' };
      }
      const preference = mapPreference(row);
      await writeConsentEvent({ ...input, eventType: 'subscribe', legalTextVersion: preference.legalTextVersion, reason: 'double-opt-in-confirmed' }, session);
      await enqueueNotification({ key, kind: 'newsletter-confirmed', payload: { email: preference.email, firstName: preference.firstName } }, session);
      // Provider suppression is a delivery constraint, not consent. Confirming
      // an address must not reactivate a hard bounce or spam complaint.
      return { ok: true, email: preference.email, userId: preference.userId, status: 'confirmed' };
    });
    if (result?.ok && result.status === 'confirmed') await flushNotification(key);
    return result!;
  } finally { await session.endSession(); }
}
