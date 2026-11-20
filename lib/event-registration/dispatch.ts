import { randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { sendEventRegistrationCampaignEmail } from '@/lib/email/event-registration-campaign';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';
import { EventRegistrationDelivery } from '@/models/EventRegistrationDelivery';
import { getEventRegistrationByEmail } from './registrations';
import { getEventRegistrationContextById } from './event-context';
import { mapCampaign, type CampaignDoc, type DeliveryDoc } from './campaign-types';
import { clean, toIdString } from './shared';

const LEASE_MS = 60 * 60_000;

async function counters(campaignId: string) {
  const rows = await EventRegistrationDelivery.aggregate<{ _id: string; count: number }>([
    { $match: { campaignId } }, { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  return { pending: counts.pending || 0, processing: counts.processing || 0, sent: counts.sent || 0,
    failed: counts.failed || 0, skipped: counts.skipped_unconfirmed || 0, needsReview: counts.needs_review || 0 };
}

export async function dispatchQueuedEventRegistrationCampaigns(options?: { batchSize?: number }) {
  await requireNewsletterDatabase();
  const batchSize = Math.max(1, Math.min(200, Math.round(options?.batchSize || 60)));
  const now = new Date();
  const candidates = await EventRegistrationCampaign.find({ status: { $in: ['queued', 'sending'] },
    needsReviewCount: { $not: { $gt: 0 } }, $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }]
  }).sort({ queuedAt: 1, createdAt: 1 }).limit(10).lean() as CampaignDoc[];
  const summary = { processedCampaigns: 0, sent: 0, failed: 0, skipped: 0, needsReview: 0,
    results: [] as Array<{ campaignId: string; sent: number; failed: number; skipped: number; pending: number; needsReview: number }> };
  for (const candidate of candidates) {
    const campaign = mapCampaign(candidate);
    const token = randomUUID();
    const ownership = { _id: campaign.id, dispatchLeaseToken: token };
    const locked = await EventRegistrationCampaign.findOneAndUpdate({
      _id: campaign.id, queuedAt: candidate.queuedAt ?? null, status: { $in: ['queued', 'sending'] }, needsReviewCount: { $not: { $gt: 0 } },
      $and: [{ $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] },
        { $or: [{ dispatchLeaseToken: null }, { dispatchLeaseUntil: { $lte: now } }] }]
    }, { $set: { status: 'sending', startedAt: candidate.startedAt || now, dispatchLeaseToken: token, dispatchLeaseUntil: new Date(now.getTime() + LEASE_MS) } },
    { new: true }).lean() as CampaignDoc | null;
    if (!locked) continue;
    let sent = 0; let failed = 0; let skipped = 0; let needsReview = 0;
    const active = () => EventRegistrationCampaign.exists({ ...ownership, status: 'sending', dispatchLeaseUntil: { $gt: new Date() } });
    try {
      // Any abandoned claim is uncertain, even if the process died before writing
      // its attempt counter. Never automatically submit it again.
      await EventRegistrationDelivery.updateMany({ campaignId: campaign.id, status: 'processing', claimToken: { $ne: token } },
        { $set: { status: 'needs_review', error: 'Worker stopped during delivery. Check provider activity before retrying.' } });
      let event = locked.frozenEvent;
      if (!event) {
        const context = await getEventRegistrationContextById(campaign.eventId);
        if (!context) throw new Error('Event details are unavailable.');
        event = { slug: context.slug, title: context.title, dateLabel: context.dateLabel,
          location: `${context.venue} ${context.location}`.trim(), joiningInstructions: context.joiningInstructions };
        await EventRegistrationCampaign.updateOne(ownership, { $set: { frozenEvent: event } });
      }
      for (let index = 0; index < batchSize; index++) {
        if (!await active() || await EventRegistrationDelivery.exists({ campaignId: campaign.id, status: 'needs_review' })) break;
        const row = await EventRegistrationDelivery.findOneAndUpdate({ campaignId: campaign.id, status: 'pending' },
          { $set: { status: 'processing', claimToken: token, claimedAt: new Date() } }, { new: true, sort: { createdAt: 1 } }).lean() as DeliveryDoc | null;
        if (!row) break;
        const claim = { _id: toIdString(row._id), status: 'processing', claimToken: token };
        let attempted = false;
        let outcome: { status: string; error: string; postmarkMessageId?: string; sentAt?: Date };
        try {
          const registration = await getEventRegistrationByEmail(campaign.eventId, clean(row.email));
          if (!registration || registration.status !== 'confirmed') {
            outcome = { status: 'skipped_unconfirmed', error: 'Registration is no longer confirmed.' };
          } else if (!await active()) {
            outcome = { status: 'failed', error: 'Campaign stopped before delivery.' };
          } else {
            const claimed = await EventRegistrationDelivery.updateOne(claim, { $inc: { attempts: 1 } });
            if (!claimed.matchedCount) break;
            attempted = true;
            const result = await sendEventRegistrationCampaignEmail({
              to: registration.email, fullName: row.firstName || registration.fullName,
              subject: campaign.subject, preheader: campaign.preheader, htmlBody: campaign.htmlBody, textBody: campaign.textBody,
              campaignId: campaign.id, event
            });
            outcome = result.ok ? { status: 'sent', error: '', postmarkMessageId: result.messageId, sentAt: new Date() }
              : { status: result.ambiguous ? 'needs_review' : 'failed', error: result.error };
          }
          const saved = await EventRegistrationDelivery.updateOne(claim, { $set: { ...outcome, claimToken: null } });
          if (!saved.matchedCount) throw new Error('Delivery claim was lost.');
        } catch {
          outcome = { status: attempted ? 'needs_review' : 'failed', error: attempted ? 'Delivery outcome is uncertain. Check Postmark activity.' : 'Delivery validation failed.' };
          await EventRegistrationDelivery.updateOne(claim, { $set: outcome });
        }
        if (outcome.status === 'sent') sent++;
        else if (outcome.status === 'failed') failed++;
        else if (outcome.status === 'needs_review') { needsReview++; break; }
        else skipped++;
      }
      const count = await counters(campaign.id);
      const done = !count.pending && !count.processing && !count.needsReview;
      const totals = { sentCount: count.sent, failedCount: count.failed, skippedCount: count.skipped, needsReviewCount: count.needsReview };
      await EventRegistrationCampaign.updateOne({ ...ownership, status: 'sending' }, { $set: { ...totals,
        status: done ? 'completed' : 'sending', completedAt: done ? new Date() : null,
        lastError: count.needsReview ? 'Delivery outcome needs review; check Postmark activity.' : '' } });
      await EventRegistrationCampaign.updateOne({ ...ownership, status: 'cancelled' }, { $set: totals });
      summary.processedCampaigns++; summary.sent += sent; summary.failed += failed; summary.skipped += skipped; summary.needsReview += needsReview;
      summary.results.push({ campaignId: campaign.id, sent, failed, skipped, pending: count.pending, needsReview: count.needsReview });
    } catch (error) {
      await EventRegistrationCampaign.updateOne(ownership, { $set: { lastError: error instanceof Error ? error.message : 'Dispatch failed.' } });
      throw error;
    } finally {
      await EventRegistrationCampaign.updateOne(ownership, { $set: { dispatchLeaseToken: null, dispatchLeaseUntil: null } });
    }
  }
  return summary;
}
