import { randomUUID } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { EmailNotification } from '@/models/EmailNotification';
import type * as NewsletterEmail from './newsletter-lifecycle';
import type * as EventEmail from './event-registration-lifecycle';
import type { PostmarkSendResult } from './postmark';
import { isNotificationCurrent } from './notification-current';

type Payloads = {
  'newsletter-verify': Parameters<typeof NewsletterEmail.sendNewsletterSubscriptionVerificationEmail>[0];
  'newsletter-confirmed': Parameters<typeof NewsletterEmail.sendNewsletterSubscribeConfirmationEmail>[0];
  'newsletter-unsubscribed': Parameters<typeof NewsletterEmail.sendNewsletterUnsubscribeConfirmationEmail>[0];
  'event-verify': Parameters<typeof EventEmail.sendEventRegistrationVerificationEmail>[0];
  'event-confirmed': Parameters<typeof EventEmail.sendEventRegistrationConfirmationEmail>[0];
};
export type NotificationInput = { [K in keyof Payloads]: { key: string; kind: K; payload: Payloads[K] } }[keyof Payloads];

export async function enqueueNotification(input: NotificationInput, session?: ClientSession) {
  // Call within the same transaction as the consent/registration transition.
  await EmailNotification.updateOne({ key: input.key }, { $setOnInsert: {
    ...input, status: 'pending', availableAt: new Date(), attempts: 0
  } }, { upsert: true, session });
}

async function deliver(input: NotificationInput): Promise<PostmarkSendResult> {
  const newsletter = await import('./newsletter-lifecycle');
  const events = await import('./event-registration-lifecycle');
  switch (input.kind) {
    case 'newsletter-verify': return newsletter.sendNewsletterSubscriptionVerificationEmail(input.payload);
    case 'newsletter-confirmed': return newsletter.sendNewsletterSubscribeConfirmationEmail(input.payload);
    case 'newsletter-unsubscribed': return newsletter.sendNewsletterUnsubscribeConfirmationEmail(input.payload);
    case 'event-verify': return events.sendEventRegistrationVerificationEmail(input.payload);
    case 'event-confirmed': return events.sendEventRegistrationConfirmationEmail(input.payload);
  }
}

export async function dispatchNotifications(options?: { limit?: number; key?: string }) {
  await requireNewsletterDatabase();
  const now = new Date();
  const summary = { sent: 0, failed: 0, needsReview: 0, pending: 0, cancelled: 0 };
  await EmailNotification.updateMany({ status: 'processing', claimedAt: { $lte: new Date(now.getTime() - 5 * 60_000) } },
    { $set: { status: 'needs_review', error: 'Worker stopped during delivery. Check Postmark activity before retrying.' } });
  for (let index = 0; index < Math.min(50, options?.limit || 20); index++) {
    const token = randomUUID();
    const row = await EmailNotification.findOneAndUpdate({
      status: 'pending', availableAt: { $lte: now }, ...(options?.key ? { key: options.key } : {})
    }, { $set: { status: 'processing', claimToken: token, claimedAt: new Date() }, $inc: { attempts: 1 } },
    { new: true, sort: { availableAt: 1, createdAt: 1 } }).lean() as (NotificationInput & { _id: unknown; attempts: number }) | null;
    if (!row) break;
    const claim = { _id: row._id, status: 'processing', claimToken: token };
    try {
      if (!await isNotificationCurrent(row)) {
        await EmailNotification.updateOne(claim, { $set: { status: 'cancelled', claimToken: null, error: 'Superseded preference or expired confirmation link.' } });
        summary.cancelled++;
        continue;
      }
      const result = await deliver(row);
      const status = result.ok ? 'sent' : result.ambiguous ? 'needs_review' : result.retryable && row.attempts < 5 ? 'pending' : 'failed';
      const saved = await EmailNotification.updateOne(claim, { $set: {
        status, messageId: result.messageId, error: result.error, sentAt: result.ok ? new Date() : null, claimToken: null,
        availableAt: new Date(Date.now() + Math.min(60, 2 ** row.attempts) * 60_000)
      } });
      if (!saved.matchedCount) throw new Error('Notification claim lost.');
      if (status === 'needs_review') summary.needsReview++;
      else summary[status]++;
    } catch {
      await EmailNotification.updateOne(claim, { $set: { status: 'needs_review', error: 'Delivery outcome is uncertain. Check Postmark activity.' } });
      summary.needsReview++;
    }
  }
  return summary;
}

export async function flushNotification(key: string) {
  // The committed job survives a process crash or a provider failure. A failed
  // receipt must never undo a person's unsubscribe or confirmation.
  await dispatchNotifications({ key, limit: 1 }).catch(() => {
    console.error('[email] Notification remains queued for the scheduled worker.');
  });
}
