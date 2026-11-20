import { createHash, randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from './database';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { NewsletterSuppression } from '@/models/NewsletterSuppression';
import { createNewsletterConfirmToken } from './confirm-token';
import { writeConsentEvent, type PreferenceDoc } from './consent';
import { enqueueNotification } from '@/lib/email/notification-outbox';
import { checkDurableRateLimit } from '@/lib/security/durable-rate-limit';

export async function requestNewsletterSubscription(input: {
  email: string; firstName: string; userId?: string; source: string; legalTextVersion: string;
  ip: string; userAgent: string; doubleOptIn: boolean; blockSuppressed: boolean; ttlMinutes: number; cooldownMinutes: number;
}) {
  const connection = await requireNewsletterDatabase();
  const session = await connection.startSession();
  const key = `newsletter-request:${randomUUID()}`;
  try {
    const queued = await session.withTransaction(async () => {
      const prior = await NewsletterPreference.findOne({ email: input.email }).session(session).lean() as PreferenceDoc | null;
      if (prior?.status === 'subscribed') return false;
      if (input.blockSuppressed && await NewsletterSuppression.exists({ email: input.email, active: true }).session(session)) return false;
      const userId = prior?.userId || input.userId || `email:${createHash('sha256').update(input.email).digest('hex').slice(0, 24)}`;
      // A signed-in account may only bind its own email. Never overwrite another
      // preference when an account's email has changed.
      const owner = await NewsletterPreference.findOne({ userId }).session(session).lean() as PreferenceDoc | null;
      if (owner && owner.email !== input.email) return false;
      const allowed = await checkDurableRateLimit({ id: 'newsletter-confirmation-email', key: input.email, limit: 1,
        windowMs: input.cooldownMinutes * 60_000 }, session);
      if (!allowed.ok) return false;
      const status = input.doubleOptIn ? 'pending' : 'subscribed';
      const token = input.doubleOptIn ? createNewsletterConfirmToken({ email: input.email, userId, ttlSeconds: input.ttlMinutes * 60 }) : '';
      if (input.doubleOptIn && !token) throw new Error('Confirmation is temporarily unavailable.');
      const firstName = prior?.firstName || input.firstName;
      await NewsletterPreference.updateOne({ userId }, { $set: {
        email: input.email, firstName, status, source: input.source, legalTextVersion: input.legalTextVersion,
        consentAt: input.doubleOptIn ? null : new Date(), unsubscribedAt: null,
        lastUpdatedBy: { actorType: input.userId ? 'user' : 'public', actorId: input.userId || userId }
      } }, { upsert: true, session });
      if (prior?.status !== status) await writeConsentEvent({ ...input, userId,
        eventType: input.doubleOptIn ? 'set-pending' : 'subscribe', actorType: input.userId ? 'user' : 'public', actorId: input.userId || userId
      }, session);
      await enqueueNotification(input.doubleOptIn ? { key, kind: 'newsletter-verify', payload: {
        email: input.email, firstName, token: token!, expiresInHours: Math.max(1, Math.round(input.ttlMinutes / 60))
      } } : { key, kind: 'newsletter-confirmed', payload: { email: input.email, firstName } }, session);
      return true;
    });
    return queued ? key : null;
  } finally { await session.endSession(); }
}
