import { randomUUID } from 'node:crypto';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';
import { ensureNewsletterPreferencesForRegisteredUsers, listDispatchRecipients } from './consent';
import { clean, normalizeEmail } from './shared';
import { mapCampaign, type CampaignDoc, type FrozenNewsletterContent } from './campaign-types';
import { freezeNewsletterCampaign } from './campaign-preparation';
import { releaseNewsletterMedia, cleanupNewsletterMedia } from './media';
import { assertNewsletterSendingAllowed } from './send-policy';

export async function queueNewsletterCampaign(input: { campaignId: string; scheduledAt?: string | Date | null }) {
  assertNewsletterSendingAllowed();
  await requireNewsletterDatabase();
  const campaignId = clean(input.campaignId);
  if (!campaignId) return null;
  const scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : new Date();
  if (Number.isNaN(scheduledAt.getTime())) throw new Error('Enter a valid scheduled time.');
  const token = randomUUID();
  const campaign = await NewsletterCampaign.findOneAndUpdate({
    _id: campaignId, status: 'draft', preparationToken: null
  }, { $set: { preparationToken: token, preparationStartedAt: new Date() } }, { new: true }).lean() as CampaignDoc | null;
  if (!campaign) throw new Error('Campaign is not a draft or is already preparing. An interrupted preparation must be reviewed before retrying.');
  let frozen: FrozenNewsletterContent | undefined;
  let queued = false;
  try {
    frozen = await freezeNewsletterCampaign(campaign, campaignId);
    await ensureNewsletterPreferencesForRegisteredUsers(10000);
    const recipients = await listDispatchRecipients(50000);
    // Only draft campaigns can enter preparation. No recipient may be dispatchable yet.
    await NewsletterDelivery.deleteMany({ campaignId, status: 'pending' });
    if (recipients.length) await NewsletterDelivery.bulkWrite(recipients.map((recipient) => ({ updateOne: {
      filter: { campaignId, email: normalizeEmail(recipient.email) },
      update: { $setOnInsert: { campaignId, userId: clean(recipient.userId), email: normalizeEmail(recipient.email), firstName: clean(recipient.firstName), status: 'pending' } }, upsert: true
    } })), { ordered: false });
    const updated = await NewsletterCampaign.findOneAndUpdate({ _id: campaignId, status: 'draft', preparationToken: token }, {
      $set: { status: 'queued', scheduledAt, queuedAt: new Date(), frozenContent: frozen, recipientSnapshotCount: recipients.length, lastError: '', preparationToken: null, preparationStartedAt: null, needsReviewCount: 0 }
    }, { new: true }).lean() as CampaignDoc | null;
    if (!updated) throw new Error('Campaign changed while preparing. Review the draft and queue it again.');
    queued = true;
    return mapCampaign(updated);
  } finally {
    if (!queued) {
      await NewsletterCampaign.updateOne({ _id: campaignId, preparationToken: token }, { $set: { preparationToken: null, preparationStartedAt: null } });
      if (frozen) await releaseNewsletterMedia(frozen.manifest, new Date());
    }
    // Bounded maintenance; cleanup failure must not undo a successfully queued campaign.
    await cleanupNewsletterMedia({ limit: 20 }).catch(() => undefined);
  }
}

export async function cancelNewsletterCampaign(campaignId: string) {
  await requireNewsletterDatabase();
  const updated = await NewsletterCampaign.findOneAndUpdate({ _id: clean(campaignId), status: { $in: ['draft', 'queued', 'sending'] }, preparationToken: null },
    { $set: { status: 'cancelled', completedAt: new Date() } }, { new: true }).lean() as CampaignDoc | null;
  if (updated?.frozenContent) await releaseNewsletterMedia(updated.frozenContent.manifest, new Date());
  return updated ? mapCampaign(updated) : null;
}

export async function unscheduleNewsletterCampaign(campaignId: string) {
  await requireNewsletterDatabase();
  const id = clean(campaignId);
  if (!id) return null;
  const token = randomUUID();
  // Move out of the dispatchable state before deleting recipients. Keep edits/queue locked.
  const campaign = await NewsletterCampaign.findOneAndUpdate({ _id: id, status: 'queued', dispatchLeaseToken: null, preparationToken: null },
    { $set: { status: 'draft', preparationToken: token, preparationStartedAt: new Date() } }, { new: true }).lean() as CampaignDoc | null;
  if (!campaign) return null;
  try {
    await NewsletterDelivery.deleteMany({ campaignId: id, status: 'pending' });
    if (campaign.frozenContent) await releaseNewsletterMedia(campaign.frozenContent.manifest, new Date());
    const updated = await NewsletterCampaign.findOneAndUpdate({ _id: id, preparationToken: token }, { $set: {
      frozenContent: null, scheduledAt: null, queuedAt: null, startedAt: null, completedAt: null,
      recipientSnapshotCount: 0, sentCount: 0, failedCount: 0, skippedCount: 0, needsReviewCount: 0, lastError: '', preparationToken: null, preparationStartedAt: null
    } }, { new: true }).lean() as CampaignDoc | null;
    return updated ? mapCampaign(updated) : null;
  } catch (error) {
    await NewsletterCampaign.updateOne({ _id: id, preparationToken: token }, { $set: { preparationToken: null, preparationStartedAt: null, lastError: 'Unschedule cleanup failed; review before queueing again.' } });
    throw error;
  }
}
