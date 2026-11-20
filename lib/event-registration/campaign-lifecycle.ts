import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';
import { EventRegistrationDelivery } from '@/models/EventRegistrationDelivery';
import { listConfirmedEventRecipients } from './registrations';
import { getEventRegistrationContextById } from './event-context';
import { clean, toFirstName } from './shared';
import { mapCampaign, parseScheduledAt, type CampaignDoc } from './campaign-types';

export async function queueEventRegistrationCampaign(input: { campaignId: string; scheduledAt?: string | Date | null }) {
  const connection = await requireNewsletterDatabase();
  const scheduledAt = parseScheduledAt(input.scheduledAt);
  if (!scheduledAt) return null;
  const campaignId = clean(input.campaignId);
  const session = await connection.startSession();
  try {
    return await session.withTransaction(async () => {
      const campaign = await EventRegistrationCampaign.findOne({ _id: campaignId, status: 'draft' }).session(session).lean() as CampaignDoc | null;
      if (!campaign) return null;
      const context = await getEventRegistrationContextById(clean(campaign.eventId));
      if (!context) return null;
      const recipients = await listConfirmedEventRecipients(clean(campaign.eventId), 10000);
      // No queued edit or repeated queue request can reset a completed delivery.
      if (await EventRegistrationDelivery.exists({ campaignId }).session(session)) return null;
      if (recipients.length) await EventRegistrationDelivery.insertMany(recipients.map((recipient) => ({
        campaignId, eventId: campaign.eventId, registrationId: recipient.registrationId,
        email: recipient.email, firstName: recipient.firstName || toFirstName(recipient.fullName, recipient.email), status: 'pending'
      })), { session });
      const updated = await EventRegistrationCampaign.findOneAndUpdate({ _id: campaignId, status: 'draft' }, { $set: {
        status: 'queued', queuedAt: new Date(), scheduledAt, recipientSnapshotCount: recipients.length, lastError: '',
        frozenEvent: { slug: context.slug, title: context.title, dateLabel: context.dateLabel,
          location: `${context.venue} ${context.location}`.trim(), joiningInstructions: context.joiningInstructions }
      } }, { new: true, session }).lean() as CampaignDoc | null;
      return updated ? mapCampaign(updated) : null;
    });
  } finally { await session.endSession(); }
}

export async function cancelEventRegistrationCampaign(campaignId: string) {
  await requireNewsletterDatabase();
  const updated = await EventRegistrationCampaign.findOneAndUpdate(
    { _id: clean(campaignId), status: { $in: ['draft', 'queued', 'sending'] } },
    { $set: { status: 'cancelled', completedAt: new Date() } }, { new: true }
  ).lean() as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

export async function unscheduleEventRegistrationCampaign(campaignId: string) {
  const connection = await requireNewsletterDatabase();
  const session = await connection.startSession();
  try {
    return await session.withTransaction(async () => {
      const id = clean(campaignId);
      // Returning to draft is only safe before the first worker takes ownership.
      const updated = await EventRegistrationCampaign.findOneAndUpdate(
        { _id: id, status: 'queued', startedAt: null, dispatchLeaseToken: null },
        { $set: { status: 'draft', scheduledAt: null, queuedAt: null, recipientSnapshotCount: 0, frozenEvent: null } },
        { new: true, session }
      ).lean() as CampaignDoc | null;
      if (!updated) return null;
      await EventRegistrationDelivery.deleteMany({ campaignId: id, status: 'pending', attempts: 0 }, { session });
      return mapCampaign(updated);
    });
  } finally { await session.endSession(); }
}
