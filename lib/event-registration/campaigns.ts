import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/event-registration/campaigns.ts');

import { connectDB } from '@/lib/db';
import { sendEventRegistrationCampaignEmail } from '@/lib/email/event-registration-campaign';
import { getEventRegistrationContextById } from '@/lib/event-registration/event-context';
import { buildDefaultEventCampaignTemplateContent } from '@/lib/event-registration/default-campaign-template';
import {
  getEventRegistrationByEmail,
  listConfirmedEventRecipients
} from '@/lib/event-registration/registrations';
import {
  clean,
  normalizeEventCampaignKind,
  normalizeEventCampaignStatus,
  normalizeEventDeliveryStatus,
  normalizeEmail,
  toFirstName,
  toIdString,
  type EventCampaignKind,
  type EventCampaignStatus,
  type EventDeliveryStatus
} from '@/lib/event-registration/shared';
import { getSystemEmailTemplateEditorState } from '@/lib/system-email-templates';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';
import { EventRegistrationDelivery } from '@/models/EventRegistrationDelivery';

type CampaignDoc = {
  _id?: unknown;
  eventId?: string;
  eventSlug?: string;
  eventTitle?: string;
  campaignKind?: EventCampaignKind;
  name?: string;
  subject?: string;
  preheader?: string;
  htmlBody?: string;
  textBody?: string;
  visualBody?: unknown;
  status?: EventCampaignStatus;
  scheduledAt?: Date | string | null;
  queuedAt?: Date | string | null;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  createdByUserId?: string;
  recipientSnapshotCount?: number;
  sentCount?: number;
  failedCount?: number;
  skippedCount?: number;
  lastError?: string;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

type DeliveryDoc = {
  _id?: unknown;
  campaignId?: string;
  eventId?: string;
  registrationId?: string;
  email?: string;
  firstName?: string;
  status?: EventDeliveryStatus;
  postmarkMessageId?: string;
  sentAt?: Date | string | null;
  error?: string;
  attempts?: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function parseScheduledAt(value: string | Date | null | undefined) {
  if (!value) return new Date();
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

const TEMPLATE_KEY_BY_KIND = {
  update: 'event-registration-update',
  'joining-instructions': 'event-registration-joining-instructions'
} as const;

export type EventRegistrationCampaignSummary = {
  id: string;
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: EventCampaignStatus;
  scheduledAt: string | null;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdByUserId: string;
  recipientSnapshotCount: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  lastError: string;
  createdAt: string | null;
  updatedAt: string | null;
};

export type EventRegistrationDeliverySummary = {
  id: string;
  campaignId: string;
  eventId: string;
  registrationId: string;
  email: string;
  firstName: string;
  status: EventDeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

function mapCampaign(doc: CampaignDoc): EventRegistrationCampaignSummary {
  return {
    id: toIdString(doc._id),
    eventId: clean(doc.eventId),
    eventSlug: clean(doc.eventSlug),
    eventTitle: clean(doc.eventTitle),
    campaignKind: normalizeEventCampaignKind(doc.campaignKind),
    name: clean(doc.name),
    subject: clean(doc.subject),
    preheader: clean(doc.preheader),
    htmlBody: doc.htmlBody || '',
    textBody: doc.textBody || '',
    visualBody: Array.isArray(doc.visualBody) ? doc.visualBody : [],
    status: normalizeEventCampaignStatus(doc.status),
    scheduledAt: toDateIsoOrNull(doc.scheduledAt),
    queuedAt: toDateIsoOrNull(doc.queuedAt),
    startedAt: toDateIsoOrNull(doc.startedAt),
    completedAt: toDateIsoOrNull(doc.completedAt),
    createdByUserId: clean(doc.createdByUserId),
    recipientSnapshotCount: Math.max(0, Math.round(Number(doc.recipientSnapshotCount || 0))),
    sentCount: Math.max(0, Math.round(Number(doc.sentCount || 0))),
    failedCount: Math.max(0, Math.round(Number(doc.failedCount || 0))),
    skippedCount: Math.max(0, Math.round(Number(doc.skippedCount || 0))),
    lastError: clean(doc.lastError),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

function mapDelivery(doc: DeliveryDoc): EventRegistrationDeliverySummary {
  return {
    id: toIdString(doc._id),
    campaignId: clean(doc.campaignId),
    eventId: clean(doc.eventId),
    registrationId: clean(doc.registrationId),
    email: normalizeEmail(doc.email),
    firstName: clean(doc.firstName),
    status: normalizeEventDeliveryStatus(doc.status),
    postmarkMessageId: clean(doc.postmarkMessageId),
    sentAt: toDateIsoOrNull(doc.sentAt),
    error: clean(doc.error),
    attempts: Math.max(0, Math.round(Number(doc.attempts || 0))),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

async function recomputeCampaignCounters(campaignId: string) {
  const [pending, sent, failed, skipped] = await Promise.all([
    EventRegistrationDelivery.countDocuments({ campaignId, status: 'pending' }),
    EventRegistrationDelivery.countDocuments({ campaignId, status: 'sent' }),
    EventRegistrationDelivery.countDocuments({ campaignId, status: 'failed' }),
    EventRegistrationDelivery.countDocuments({ campaignId, status: 'skipped_unconfirmed' })
  ]);
  return { pending, sent, failed, skipped };
}

async function markCampaignStateAfterBatch(campaignId: string) {
  const counters = await recomputeCampaignCounters(campaignId);
  const nextStatus = counters.pending > 0 ? 'sending' : 'completed';
  await EventRegistrationCampaign.updateOne(
    { _id: campaignId },
    {
      $set: {
        status: nextStatus,
        sentCount: counters.sent,
        failedCount: counters.failed,
        skippedCount: counters.skipped,
        ...(nextStatus === 'completed' ? { completedAt: new Date() } : {})
      }
    }
  );
  return counters;
}

export function buildDefaultEventCampaignContent(kind: EventCampaignKind) {
  return buildDefaultEventCampaignTemplateContent(normalizeEventCampaignKind(kind));
}

export async function getEventRegistrationCampaignComposerDefaults(kind: EventCampaignKind) {
  const normalizedKind = normalizeEventCampaignKind(kind);
  const fallback = buildDefaultEventCampaignContent(normalizedKind);
  try {
    const templates = await getSystemEmailTemplateEditorState();
    const template = templates.find((item) => item.key === TEMPLATE_KEY_BY_KIND[normalizedKind]);
    if (!template) return fallback;
    return {
      htmlBody: template.initialHtml || fallback.htmlBody,
      textBody: template.initialText || fallback.textBody
    };
  } catch {
    return fallback;
  }
}

export async function listEventRegistrationCampaigns(options?: { eventId?: string | null; limit?: number }) {
  await connectDB();
  const limit = Math.max(1, Math.min(200, Math.round(options?.limit || 80)));
  const query: Record<string, unknown> = {};
  const eventId = clean(options?.eventId);
  if (eventId) query.eventId = eventId;
  const rows = (await EventRegistrationCampaign.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as CampaignDoc[];
  return rows.map(mapCampaign);
}

export async function getEventRegistrationCampaignById(campaignId: string) {
  await connectDB();
  const row = (await EventRegistrationCampaign.findById(clean(campaignId)).lean()) as CampaignDoc | null;
  return row ? mapCampaign(row) : null;
}

export async function listEventRegistrationDeliveries(options?: {
  eventId?: string | null;
  campaignId?: string | null;
  status?: EventDeliveryStatus | 'all';
  q?: string | null;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.max(1, Math.min(2000, Math.round(options?.limit || 400)));
  const query: Record<string, unknown> = {};
  const eventId = clean(options?.eventId);
  const campaignId = clean(options?.campaignId);
  const q = clean(options?.q);
  const status = options?.status;

  if (eventId) query.eventId = eventId;
  if (campaignId) query.campaignId = campaignId;
  if (status && status !== 'all') query.status = normalizeEventDeliveryStatus(status);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { email: { $regex: safe, $options: 'i' } },
      { firstName: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await EventRegistrationDelivery.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as DeliveryDoc[];
  return rows.map(mapDelivery);
}

export async function createEventRegistrationCampaignDraft(input: {
  eventId: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
  createdByUserId: string;
}) {
  await connectDB();
  const eventContext = await getEventRegistrationContextById(input.eventId);
  if (!eventContext) return null;

  const created = await EventRegistrationCampaign.create({
    eventId: eventContext.id,
    eventSlug: eventContext.slug,
    eventTitle: eventContext.title,
    campaignKind: normalizeEventCampaignKind(input.campaignKind),
    name: clean(input.name),
    subject: clean(input.subject),
    preheader: clean(input.preheader),
    htmlBody: input.htmlBody,
    textBody: input.textBody,
    visualBody: Array.isArray(input.visualBody) ? input.visualBody : [],
    createdByUserId: clean(input.createdByUserId)
  });

  return mapCampaign(created.toObject() as CampaignDoc);
}

export async function updateEventRegistrationCampaignDraft(input: {
  campaignId: string;
  campaignKind: EventCampaignKind;
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
}) {
  await connectDB();
  const updated = (await EventRegistrationCampaign.findOneAndUpdate(
    {
      _id: clean(input.campaignId),
      status: { $in: ['draft', 'queued'] }
    },
    {
      $set: {
        campaignKind: normalizeEventCampaignKind(input.campaignKind),
        name: clean(input.name),
        subject: clean(input.subject),
        preheader: clean(input.preheader),
        htmlBody: input.htmlBody,
        textBody: input.textBody,
        visualBody: Array.isArray(input.visualBody) ? input.visualBody : []
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;

  return updated ? mapCampaign(updated) : null;
}

export async function queueEventRegistrationCampaign(input: {
  campaignId: string;
  scheduledAt?: string | Date | null;
}) {
  await connectDB();
  const campaignId = clean(input.campaignId);
  if (!campaignId) return null;

  const campaign = (await EventRegistrationCampaign.findById(campaignId).lean()) as CampaignDoc | null;
  if (!campaign) return null;
  const status = normalizeEventCampaignStatus(campaign.status);
  if (status !== 'draft' && status !== 'queued') return null;

  const recipients = await listConfirmedEventRecipients(clean(campaign.eventId), 10000);
  const bulkOps = recipients.map((recipient) => ({
    updateOne: {
      filter: { campaignId, email: recipient.email },
      update: {
        $set: {
          campaignId,
          eventId: clean(campaign.eventId),
          registrationId: recipient.registrationId,
          email: recipient.email,
          firstName: recipient.firstName || toFirstName(recipient.fullName, recipient.email),
          status: 'pending',
          error: '',
          postmarkMessageId: '',
          sentAt: null,
          attempts: 0
        }
      },
      upsert: true
    }
  }));
  if (bulkOps.length > 0) {
    await EventRegistrationDelivery.bulkWrite(bulkOps, { ordered: false });
  }

  const scheduledAt = parseScheduledAt(input.scheduledAt);
  if (!scheduledAt) return null;

  const updated = (await EventRegistrationCampaign.findOneAndUpdate(
    { _id: campaignId },
    {
      $set: {
        status: 'queued',
        queuedAt: new Date(),
        scheduledAt,
        recipientSnapshotCount: recipients.length,
        lastError: ''
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;

  return updated ? mapCampaign(updated) : null;
}

export async function cancelEventRegistrationCampaign(campaignId: string) {
  await connectDB();
  const updated = (await EventRegistrationCampaign.findOneAndUpdate(
    { _id: clean(campaignId), status: { $in: ['draft', 'queued', 'sending'] } },
    { $set: { status: 'cancelled', completedAt: new Date() } },
    { new: true }
  ).lean()) as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

export async function unscheduleEventRegistrationCampaign(campaignId: string) {
  await connectDB();
  const id = clean(campaignId);
  if (!id) return null;
  await EventRegistrationDelivery.deleteMany({ campaignId: id, status: 'pending' });
  const updated = (await EventRegistrationCampaign.findOneAndUpdate(
    { _id: id, status: { $in: ['queued', 'sending'] } },
    {
      $set: {
        status: 'draft',
        scheduledAt: null,
        queuedAt: null,
        startedAt: null,
        completedAt: null,
        recipientSnapshotCount: 0,
        sentCount: 0,
        failedCount: 0,
        skippedCount: 0,
        lastError: ''
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

export async function dispatchQueuedEventRegistrationCampaigns(options?: { batchSize?: number }) {
  await connectDB();
  const batchSize = Math.max(1, Math.min(200, Math.round(options?.batchSize || 60)));
  const now = new Date();
  const campaigns = (await EventRegistrationCampaign.find({
    status: { $in: ['queued', 'sending'] },
    $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }]
  })
    .sort({ queuedAt: 1, createdAt: 1 })
    .lean()) as CampaignDoc[];

  const summary = {
    processedCampaigns: campaigns.length,
    sent: 0,
    failed: 0,
    skipped: 0,
    results: [] as Array<{ campaignId: string; sent: number; failed: number; skipped: number; pending: number }>
  };

  for (const rawCampaign of campaigns) {
    const campaign = mapCampaign(rawCampaign);
    await EventRegistrationCampaign.updateOne(
      { _id: campaign.id, status: { $in: ['queued', 'sending'] } },
      { $set: { status: 'sending', startedAt: rawCampaign.startedAt || new Date(), lastError: '' } }
    );

    const eventContext = await getEventRegistrationContextById(campaign.eventId);
    if (!eventContext) {
      await EventRegistrationCampaign.updateOne(
        { _id: campaign.id },
        { $set: { status: 'completed', completedAt: new Date(), lastError: 'missing-event-context' } }
      );
      continue;
    }

    const batch = (await EventRegistrationDelivery.find({ campaignId: campaign.id, status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(batchSize)
      .lean()) as DeliveryDoc[];

    let batchSent = 0;
    let batchFailed = 0;
    let batchSkipped = 0;

    for (const rawDelivery of batch) {
      const delivery = mapDelivery(rawDelivery);
      const registration = await getEventRegistrationByEmail(campaign.eventId, delivery.email);
      if (!registration || registration.status !== 'confirmed') {
        await EventRegistrationDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'skipped_unconfirmed',
              error: 'registration-not-confirmed',
              attempts: delivery.attempts + 1
            }
          }
        );
        batchSkipped += 1;
        continue;
      }

      const sendResult = await sendEventRegistrationCampaignEmail({
        to: registration.email,
        fullName: registration.fullName,
        subject: campaign.subject,
        preheader: campaign.preheader,
        htmlBody: campaign.htmlBody,
        textBody: campaign.textBody,
        campaignId: campaign.id,
        event: {
          slug: eventContext.slug,
          title: eventContext.title,
          dateLabel: eventContext.dateLabel,
          location: `${eventContext.venue} ${eventContext.location}`.trim(),
          joiningInstructions: eventContext.joiningInstructions
        }
      });

      if (sendResult.ok) {
        await EventRegistrationDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              postmarkMessageId: clean(sendResult.messageId),
              error: '',
              attempts: delivery.attempts + 1
            }
          }
        );
        batchSent += 1;
      } else {
        await EventRegistrationDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'failed',
              error: clean(sendResult.error) || 'send-failed',
              attempts: delivery.attempts + 1
            }
          }
        );
        batchFailed += 1;
      }
    }

    const counters = await markCampaignStateAfterBatch(campaign.id);
    await EventRegistrationCampaign.updateOne(
      { _id: campaign.id },
      {
        $set: {
          sentCount: counters.sent,
          failedCount: counters.failed,
          skippedCount: counters.skipped
        }
      }
    );

    summary.sent += batchSent;
    summary.failed += batchFailed;
    summary.skipped += batchSkipped;
    summary.results.push({
      campaignId: campaign.id,
      sent: batchSent,
      failed: batchFailed,
      skipped: batchSkipped,
      pending: counters.pending
    });
  }

  return summary;
}
