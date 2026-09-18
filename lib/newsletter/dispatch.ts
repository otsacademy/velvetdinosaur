import { randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from './database';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';
import { assertNewsletterTransportConfigured, sendNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import { getNewsletterPreferenceByEmail, getNewsletterPreferenceForUser } from './consent';
import { mapSuppressedEmails } from './suppression';
import { clean, toFirstName } from './shared';
import { mapCampaign, mapDelivery, type CampaignDoc, type DeliveryDoc } from './campaign-types';
import { freezeNewsletterCampaign, prepareFrozenNewsletterBatch } from './campaign-preparation';
import { releaseNewsletterMedia, cleanupNewsletterMedia } from './media';
import { assertNewsletterSendingAllowed } from './send-policy';
import { runOneNewsletterDelivery, type DeliveryCompletion } from './delivery-worker';

const LEASE_MS = 60 * 60_000;

async function counters(campaignId: string) {
  const rows = await NewsletterDelivery.aggregate<{ _id: string; count: number }>([
    { $match: { campaignId } }, { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  const counts = Object.fromEntries(rows.map((row) => [row._id, row.count]));
  return { pending: counts.pending || 0, processing: counts.processing || 0, sent: counts.sent || 0, failed: counts.failed || 0, needsReview: counts.needs_review || 0,
    skipped: (counts.skipped_no_consent || 0) + (counts.skipped_unsubscribed || 0) + (counts.skipped_suppressed || 0) };
}

export async function dispatchQueuedNewsletterCampaigns(options?: { now?: Date; maxCampaigns?: number; batchSizePerCampaign?: number }) {
  assertNewsletterSendingAllowed();
  assertNewsletterTransportConfigured();
  await requireNewsletterDatabase();
  const now = options?.now || new Date();
  const maxCampaigns = Math.max(1, Math.min(25, Math.round(options?.maxCampaigns || 5)));
  const batchSize = Math.max(1, Math.min(500, Math.round(options?.batchSizePerCampaign || 80)));
  const candidates = await NewsletterCampaign.find({ status: { $in: ['queued', 'sending'] }, needsReviewCount: { $not: { $gt: 0 } },
    $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }] }).sort({ scheduledAt: 1, createdAt: 1 }).limit(maxCampaigns).lean() as CampaignDoc[];
  const summary = { checkedCampaigns: candidates.length, processedCampaigns: 0, sent: 0, failed: 0, skipped: 0, needsReview: 0,
    results: [] as Array<{ campaignId: string; sent: number; failed: number; skipped: number; pending: number; needsReview: number }> };
  for (const candidate of candidates) {
    const campaign = mapCampaign(candidate);
    const token = randomUUID();
    const locked = await NewsletterCampaign.findOneAndUpdate({ _id: campaign.id, status: { $in: ['queued', 'sending'] },
      $or: [{ dispatchLeaseToken: null }, { dispatchLeaseUntil: { $lte: now } }] },
      { $set: { dispatchLeaseToken: token, dispatchLeaseUntil: new Date(now.getTime() + LEASE_MS), status: 'sending', startedAt: candidate.startedAt || now } }, { new: true }).lean() as CampaignDoc | null;
    if (!locked) continue;
    let sent = 0; let failed = 0; let skipped = 0; let needsReview = 0;
    try {
      // The previous owner cannot prove whether a processing message reached Postmark.
      await NewsletterDelivery.updateMany({ campaignId: campaign.id, status: 'processing', claimedAt: { $lte: new Date(now.getTime() - LEASE_MS) } },
        { $set: { status: 'needs_review', error: 'Worker stopped during delivery. Check provider activity before retrying.' } });
      const uncertain = await NewsletterDelivery.countDocuments({ campaignId: campaign.id, status: 'needs_review' });
      if (uncertain) {
        await NewsletterCampaign.updateOne({ _id: campaign.id, dispatchLeaseToken: token }, { $set: { needsReviewCount: uncertain, lastError: 'Delivery outcome needs review; automatic dispatch is paused.' } });
        continue;
      }
      let frozen = locked.frozenContent;
      if (!frozen) {
        // Legacy campaigns are frozen once under the same campaign lease before any new send.
        frozen = await freezeNewsletterCampaign(locked, campaign.id);
        const saved = await NewsletterCampaign.updateOne({ _id: campaign.id, status: 'sending', dispatchLeaseToken: token }, { $set: { frozenContent: frozen } });
        if (!saved.matchedCount) {
          await releaseNewsletterMedia(frozen.manifest, new Date());
          continue;
        }
      }
      const prepared = await prepareFrozenNewsletterBatch(frozen);
      for (let index = 0; index < batchSize; index++) {
        const active = await NewsletterCampaign.exists({ _id: campaign.id, status: 'sending', dispatchLeaseToken: token, dispatchLeaseUntil: { $gt: new Date() } });
        if (!active) break;
        const status = await runOneNewsletterDelivery({
          claim: async () => {
            const row = await NewsletterDelivery.findOneAndUpdate({ campaignId: campaign.id, status: 'pending' },
              { $set: { status: 'processing', claimToken: token, claimedAt: new Date() } }, { new: true, sort: { createdAt: 1 } }).lean() as DeliveryDoc | null;
            return row ? mapDelivery(row) : null;
          },
          permitted: async (delivery): Promise<DeliveryCompletion | null> => {
            if (!await NewsletterCampaign.exists({ _id: campaign.id, status: 'sending', dispatchLeaseToken: token, dispatchLeaseUntil: { $gt: new Date() } })) {
              return { status: 'failed', error: 'Campaign stopped before delivery.' };
            }
            if ((await mapSuppressedEmails([delivery.email])).has(delivery.email)) return { status: 'skipped_suppressed', error: 'suppressed' };
            const preference = delivery.userId ? await getNewsletterPreferenceForUser(delivery.userId) : await getNewsletterPreferenceByEmail(delivery.email);
            if (preference?.status === 'unsubscribed') return { status: 'skipped_unsubscribed', error: 'unsubscribed' };
            if (!preference || preference.status !== 'subscribed') return { status: 'skipped_no_consent', error: preference?.status || 'missing-consent' };
            return null;
          },
          send: async (delivery) => {
            if (!await NewsletterCampaign.exists({ _id: campaign.id, status: 'sending', dispatchLeaseToken: token, dispatchLeaseUntil: { $gt: new Date() } })) {
              return { ok: false, messageId: '', error: 'Campaign stopped before delivery.' };
            }
            const claimed = await NewsletterDelivery.updateOne({ _id: delivery.id, claimToken: token, status: 'processing' }, { $inc: { attempts: 1 } });
            if (!claimed.matchedCount) return { ok: false, messageId: '', error: 'Delivery claim was lost before submission.' };
            return sendNewsletterCampaignEmail({ to: delivery.email, firstName: clean(delivery.firstName) || toFirstName('', delivery.email), ...frozen,
              campaignId: campaign.id, prepared });
          },
          complete: async (delivery, outcome) => {
            const updated = await NewsletterDelivery.updateOne({ _id: delivery.id, status: 'processing', claimToken: token }, { $set: { ...outcome, claimToken: null } });
            if (!updated.matchedCount) throw new Error('Delivery claim was lost.');
          }
        });
        if (!status) break;
        if (status === 'sent') sent++;
        else if (status === 'failed') failed++;
        else if (status === 'needs_review') { needsReview++; break; }
        else skipped++;
      }
      const count = await counters(campaign.id);
      const done = count.pending === 0 && count.processing === 0 && count.needsReview === 0;
      const completedAt = done ? new Date() : null;
      const updated = await NewsletterCampaign.updateOne({ _id: campaign.id, dispatchLeaseToken: token, status: 'sending' }, { $set: {
        sentCount: count.sent, failedCount: count.failed, skippedCount: count.skipped, needsReviewCount: count.needsReview,
        status: done ? 'completed' : 'sending', completedAt,
        lastError: count.needsReview ? 'Delivery outcome needs review; automatic dispatch is paused.' : failed ? `${failed} deliveries failed in last batch` : ''
      } });
      // Cancellation can happen while a provider request is in flight; preserve its status,
      // but accurately record the eventual outcome in the campaign counters.
      if (!updated.matchedCount) await NewsletterCampaign.updateOne({ _id: campaign.id, dispatchLeaseToken: token, status: 'cancelled' }, { $set: {
        sentCount: count.sent, failedCount: count.failed, skippedCount: count.skipped, needsReviewCount: count.needsReview
      } });
      if (done && updated.matchedCount) await releaseNewsletterMedia(frozen.manifest, completedAt!);
      summary.processedCampaigns++;
      summary.sent += sent; summary.failed += failed; summary.skipped += skipped; summary.needsReview += needsReview;
      summary.results.push({ campaignId: campaign.id, sent, failed, skipped, pending: count.pending, needsReview: count.needsReview });
    } catch (error) {
      await NewsletterCampaign.updateOne({ _id: campaign.id, dispatchLeaseToken: token }, { $set: { lastError: error instanceof Error ? error.message : 'Campaign preparation failed' } });
      throw error;
    } finally {
      await NewsletterCampaign.updateOne({ _id: campaign.id, dispatchLeaseToken: token }, { $set: { dispatchLeaseToken: null, dispatchLeaseUntil: null } });
    }
  }
  await cleanupNewsletterMedia({ limit: 20 }).catch(() => undefined);
  return summary;
}
