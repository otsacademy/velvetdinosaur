import { requireNewsletterDatabase } from './database';
import { NewsletterSuppression } from '@/models/NewsletterSuppression';
import { classifyPostmarkEvent } from './postmark-events';
import { NewsletterPreference } from '@/models/NewsletterPreference';
import { writeConsentEvent, type PreferenceDoc } from './consent';

export async function applyPostmarkEvent(event: NonNullable<ReturnType<typeof classifyPostmarkEvent>>) {
  const connection = await requireNewsletterDatabase();
  const session = await connection.startSession();
  try {
    return await session.withTransaction(async () => {
      const prior = await NewsletterSuppression.findOne({ email: event.email }).session(session).lean() as {
        active?: boolean; source?: string; providerEventAt?: Date; lastEventAt?: Date;
      } | null;
      const previousAt = prior?.providerEventAt?.getTime() || 0;
      const stale = previousAt > event.at.getTime() || (previousAt === event.at.getTime() && (prior?.active || !event.active));
      const localBan = prior?.active && !prior.source?.startsWith('postmark-webhook:');
      if (!stale) {
        // Preserve the origin of a manual ban even when a new provider bounce
        // arrives. Otherwise a later reactivation could accidentally clear it.
        const providerMetadata = { providerEventAt: event.at, messageId: event.messageId,
          messageStream: event.messageStream, lastEventAt: new Date() };
        await NewsletterSuppression.updateOne({ email: event.email }, { $set: localBan ? providerMetadata : {
          ...providerMetadata, active: event.active, source: `postmark-webhook:${event.eventType}`,
          reason: event.reason, eventType: event.eventType
        }, $setOnInsert: { suppressedAt: event.at } }, { upsert: true, session });
      }
      let consentChanged = false;
      if (event.withdrawConsent) {
        // Spam complaints and recipient-origin unsubscribe requests express a
        // choice independently of delivery-state ordering. A newer provider
        // reactivation must not erase an older unsubscribe arriving late, while
        // explicit consent given after that unsubscribe must remain valid.
        const rows = await NewsletterPreference.find({ email: event.email, status: { $ne: 'unsubscribed' },
          $or: [{ consentAt: null }, { consentAt: { $lte: event.at } }]
        }).session(session).lean() as PreferenceDoc[];
        for (const row of rows) {
          await NewsletterPreference.updateOne({ _id: row._id }, { $set: { status: 'unsubscribed', unsubscribedAt: event.at,
            source: `postmark-webhook:${event.eventType}`, lastUpdatedBy: { actorType: 'recipient', actorId: event.messageId } } }, { session });
          await writeConsentEvent({ userId: row.userId || '', email: event.email, eventType: 'unsubscribe',
            source: `postmark-webhook:${event.eventType}`, legalTextVersion: row.legalTextVersion,
            actorType: 'recipient', actorId: event.messageId, reason: event.reason }, session);
        }
        consentChanged = rows.length > 0;
      }
      return !stale || consentChanged;
    });
  } finally { await session.endSession(); }
}
