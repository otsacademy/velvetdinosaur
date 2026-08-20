import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/campaigns.ts');

import { connectDB } from '@/lib/db';
import { sendNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import {
  ensureNewsletterPreferencesForRegisteredUsers,
  getNewsletterPreferenceByEmail,
  getNewsletterPreferenceForUser,
  listDispatchRecipients
} from '@/lib/newsletter/consent';
import { mapSuppressedEmails } from '@/lib/newsletter/suppression';
import {
  buildDefaultNewsletterCampaignTemplateContent,
  isLegacyNewsletterCampaignTemplate
} from '@/lib/newsletter/default-campaign-template';
import { clean, normalizeEmail, toFirstName, toIdString } from '@/lib/newsletter/shared';
import { getSystemEmailTemplateEditorState } from '@/lib/system-email-templates';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';

type CampaignStatus = 'draft' | 'queued' | 'sending' | 'completed' | 'cancelled';
type DeliveryStatus =
  | 'pending'
  | 'sent'
  | 'failed'
  | 'skipped_no_consent'
  | 'skipped_unsubscribed'
  | 'skipped_suppressed';
export type NewsletterDeliveryStatus = DeliveryStatus;

type CampaignDoc = {
  _id?: unknown;
  name?: string;
  subject?: string;
  preheader?: string;
  htmlBody?: string;
  textBody?: string;
  visualBody?: unknown;
  status?: CampaignStatus;
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
  userId?: string;
  email?: string;
  firstName?: string;
  status?: DeliveryStatus;
  postmarkMessageId?: string;
  sentAt?: Date | string | null;
  error?: string;
  attempts?: number;
  createdAt?: Date | string | null;
  updatedAt?: Date | string | null;
};

export type NewsletterCampaignSummary = {
  id: string;
  name: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  visualBody: unknown[];
  status: CampaignStatus;
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

export type NewsletterDeliverySummary = {
  id: string;
  campaignId: string;
  userId: string;
  email: string;
  firstName: string;
  status: DeliveryStatus;
  postmarkMessageId: string;
  sentAt: string | null;
  error: string;
  attempts: number;
  createdAt: string | null;
  updatedAt: string | null;
};

function toDateIsoOrNull(value: unknown) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeCampaignStatus(value: unknown): CampaignStatus {
  if (value === 'queued') return 'queued';
  if (value === 'sending') return 'sending';
  if (value === 'completed') return 'completed';
  if (value === 'cancelled') return 'cancelled';
  return 'draft';
}

function normalizeDeliveryStatus(value: unknown): DeliveryStatus {
  if (value === 'sent') return 'sent';
  if (value === 'failed') return 'failed';
  if (value === 'skipped_no_consent') return 'skipped_no_consent';
  if (value === 'skipped_unsubscribed') return 'skipped_unsubscribed';
  if (value === 'skipped_suppressed') return 'skipped_suppressed';
  return 'pending';
}

function mapCampaign(doc: CampaignDoc): NewsletterCampaignSummary {
  return {
    id: toIdString(doc._id),
    name: clean(doc.name),
    subject: clean(doc.subject),
    preheader: clean(doc.preheader),
    htmlBody: doc.htmlBody || '',
    textBody: doc.textBody || '',
    visualBody: Array.isArray(doc.visualBody) ? doc.visualBody : [],
    status: normalizeCampaignStatus(doc.status),
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

function mapDelivery(doc: DeliveryDoc): NewsletterDeliverySummary {
  return {
    id: toIdString(doc._id),
    campaignId: clean(doc.campaignId),
    userId: clean(doc.userId),
    email: normalizeEmail(doc.email),
    firstName: clean(doc.firstName),
    status: normalizeDeliveryStatus(doc.status),
    postmarkMessageId: clean(doc.postmarkMessageId),
    sentAt: toDateIsoOrNull(doc.sentAt),
    error: clean(doc.error),
    attempts: Math.max(0, Math.round(Number(doc.attempts || 0))),
    createdAt: toDateIsoOrNull(doc.createdAt),
    updatedAt: toDateIsoOrNull(doc.updatedAt)
  };
}

function parseScheduledAt(value: string | Date | null | undefined) {
  if (!value) return new Date();
  const parsed = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

const FALLBACK_DEFAULT_COMPOSER_BODY = buildDefaultNewsletterCampaignTemplateContent();

function hasRequiredHighlightDirectives(htmlBody: string, textBody: string) {
  const source = `${htmlBody}\n${textBody}`;
  return /\{\{newsHighlights(?::[^}]*)?\}\}/.test(source) && /\{\{eventHighlights(?::[^}]*)?\}\}/.test(source);
}

export function buildDefaultNewsletterCampaignContent() {
  return { ...FALLBACK_DEFAULT_COMPOSER_BODY };
}

export async function getNewsletterCampaignComposerDefaults() {
  try {
    const templates = await getSystemEmailTemplateEditorState();
    const template = templates.find((item) => item.key === 'newsletter-campaign');
    if (!template) return buildDefaultNewsletterCampaignContent();
    const templateHtml = template.initialHtml || '';
    const templateText = template.initialText || '';
    if (isLegacyNewsletterCampaignTemplate(templateHtml, templateText)) {
      return buildDefaultNewsletterCampaignContent();
    }
    if (!hasRequiredHighlightDirectives(templateHtml, templateText)) {
      return buildDefaultNewsletterCampaignContent();
    }
    return {
      htmlBody: templateHtml || FALLBACK_DEFAULT_COMPOSER_BODY.htmlBody,
      textBody: templateText || FALLBACK_DEFAULT_COMPOSER_BODY.textBody
    };
  } catch {
    return buildDefaultNewsletterCampaignContent();
  }
}

export async function listNewsletterCampaigns(limit = 100) {
  await connectDB();
  const rows = (await NewsletterCampaign.find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as CampaignDoc[];
  return rows.map(mapCampaign);
}

export async function getNewsletterCampaignById(campaignId: string) {
  await connectDB();
  const row = (await NewsletterCampaign.findById(clean(campaignId)).lean()) as CampaignDoc | null;
  return row ? mapCampaign(row) : null;
}

export async function listNewsletterDeliveriesByCampaign(campaignId: string, limit = 250) {
  await connectDB();
  const rows = (await NewsletterDelivery.find({ campaignId: clean(campaignId) })
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(2000, Math.round(limit))))
    .lean()) as DeliveryDoc[];
  return rows.map(mapDelivery);
}

export async function listNewsletterDeliveries(options?: {
  campaignId?: string | null;
  status?: DeliveryStatus | 'all';
  q?: string | null;
  limit?: number;
}) {
  await connectDB();
  const limit = Math.max(1, Math.min(2000, Math.round(options?.limit || 250)));
  const query: Record<string, unknown> = {};
  const campaignId = clean(options?.campaignId);
  const q = clean(options?.q);
  const status = options?.status;

  if (campaignId) query.campaignId = campaignId;
  if (status && status !== 'all') query.status = normalizeDeliveryStatus(status);
  if (q) {
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = [
      { email: { $regex: safe, $options: 'i' } },
      { firstName: { $regex: safe, $options: 'i' } }
    ];
  }

  const rows = (await NewsletterDelivery.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as DeliveryDoc[];
  return rows.map(mapDelivery);
}

export async function listNewsletterDeliveriesForRecipient(input: {
  userId?: string | null;
  email?: string | null;
  limit?: number;
}) {
  await connectDB();
  const userId = clean(input.userId);
  const email = normalizeEmail(input.email);
  const limit = Math.max(1, Math.min(3000, Math.round(input.limit || 500)));
  if (!userId && !email) return [];

  const clauses: Record<string, unknown>[] = [];
  if (userId) clauses.push({ userId });
  if (email) clauses.push({ email });
  const query = clauses.length === 1 ? clauses[0] : { $or: clauses };

  const rows = (await NewsletterDelivery.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()) as DeliveryDoc[];
  return rows.map(mapDelivery);
}

export async function createNewsletterCampaignDraft(input: {
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
  createdByUserId: string;
}) {
  await connectDB();
  const created = (await NewsletterCampaign.create({
    name: clean(input.name) || 'Newsletter Campaign',
    subject: clean(input.subject),
    preheader: clean(input.preheader),
    htmlBody: input.htmlBody || '',
    textBody: input.textBody || '',
    visualBody: Array.isArray(input.visualBody) ? input.visualBody : [],
    createdByUserId: clean(input.createdByUserId),
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
  })) as CampaignDoc;
  return mapCampaign(created);
}

export async function updateNewsletterCampaignDraft(input: {
  campaignId: string;
  name: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  visualBody?: unknown[];
}) {
  await connectDB();
  const campaignId = clean(input.campaignId);
  if (!campaignId) return null;
  const updated = (await NewsletterCampaign.findOneAndUpdate(
    { _id: campaignId, status: { $in: ['draft', 'queued'] } },
    {
      $set: {
        name: clean(input.name) || 'Newsletter Campaign',
        subject: clean(input.subject),
        preheader: clean(input.preheader),
        htmlBody: input.htmlBody || '',
        textBody: input.textBody || '',
        visualBody: Array.isArray(input.visualBody) ? input.visualBody : []
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

export async function queueNewsletterCampaign(input: { campaignId: string; scheduledAt?: string | Date | null }) {
  await connectDB();
  await ensureNewsletterPreferencesForRegisteredUsers(10000);
  const campaignId = clean(input.campaignId);
  if (!campaignId) return null;

  const campaign = (await NewsletterCampaign.findById(campaignId).lean()) as CampaignDoc | null;
  if (!campaign) return null;
  const status = normalizeCampaignStatus(campaign.status);
  if (status === 'completed' || status === 'cancelled') {
    return null;
  }

  const scheduledAt = parseScheduledAt(input.scheduledAt);
  if (!scheduledAt) return null;

  const recipients = await listDispatchRecipients(50000);
  const ops = recipients.map((recipient) => ({
    updateOne: {
      filter: { campaignId, email: recipient.email },
      update: {
        $setOnInsert: {
          campaignId,
          userId: clean(recipient.userId),
          email: normalizeEmail(recipient.email),
          firstName: clean(recipient.firstName),
          status: 'pending' as DeliveryStatus,
          postmarkMessageId: '',
          sentAt: null,
          error: '',
          attempts: 0
        }
      },
      upsert: true
    }
  }));

  if (ops.length) {
    await NewsletterDelivery.bulkWrite(ops, { ordered: false });
  }

  const updated = (await NewsletterCampaign.findOneAndUpdate(
    { _id: campaignId },
    {
      $set: {
        status: 'queued',
        scheduledAt,
        queuedAt: new Date(),
        recipientSnapshotCount: recipients.length,
        lastError: ''
      }
    },
    { new: true }
  ).lean()) as CampaignDoc | null;

  return updated ? mapCampaign(updated) : null;
}

export async function cancelNewsletterCampaign(campaignId: string) {
  await connectDB();
  const updated = (await NewsletterCampaign.findOneAndUpdate(
    { _id: clean(campaignId), status: { $in: ['draft', 'queued', 'sending'] } },
    { $set: { status: 'cancelled', completedAt: new Date() } },
    { new: true }
  ).lean()) as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

export async function unscheduleNewsletterCampaign(campaignId: string) {
  await connectDB();
  const id = clean(campaignId);
  if (!id) return null;
  await NewsletterDelivery.deleteMany({ campaignId: id, status: 'pending' });
  const updated = (await NewsletterCampaign.findOneAndUpdate(
    { _id: id, status: 'queued' },
    {$set: {status: 'draft', scheduledAt: null, queuedAt: null, startedAt: null, completedAt: null, recipientSnapshotCount: 0, sentCount: 0, failedCount: 0, skippedCount: 0, lastError: ''}},
    { new: true }
  ).lean()) as CampaignDoc | null;
  return updated ? mapCampaign(updated) : null;
}

async function recomputeCampaignCounters(campaignId: string) {
  const [pending, sent, failed, skippedNoConsent, skippedUnsubscribed, skippedSuppressed] = await Promise.all([
    NewsletterDelivery.countDocuments({ campaignId, status: 'pending' }),
    NewsletterDelivery.countDocuments({ campaignId, status: 'sent' }),
    NewsletterDelivery.countDocuments({ campaignId, status: 'failed' }),
    NewsletterDelivery.countDocuments({ campaignId, status: 'skipped_no_consent' }),
    NewsletterDelivery.countDocuments({ campaignId, status: 'skipped_unsubscribed' }),
    NewsletterDelivery.countDocuments({ campaignId, status: 'skipped_suppressed' })
  ]);
  const skipped = skippedNoConsent + skippedUnsubscribed + skippedSuppressed;
  return { pending, sent, failed, skipped };
}

async function markCampaignStateAfterBatch(campaignId: string) {
  const counters = await recomputeCampaignCounters(campaignId);
  const done = counters.pending === 0;
  await NewsletterCampaign.updateOne(
    { _id: campaignId },
    {
      $set: {
        sentCount: counters.sent,
        failedCount: counters.failed,
        skippedCount: counters.skipped,
        status: done ? 'completed' : 'sending',
        completedAt: done ? new Date() : null
      }
    }
  );
  return counters;
}

export async function dispatchQueuedNewsletterCampaigns(options?: {
  now?: Date;
  maxCampaigns?: number;
  batchSizePerCampaign?: number;
}) {
  await connectDB();
  const now = options?.now || new Date();
  const maxCampaigns = Math.max(1, Math.min(25, Math.round(options?.maxCampaigns || 5)));
  const batchSizePerCampaign = Math.max(1, Math.min(500, Math.round(options?.batchSizePerCampaign || 80)));

  const campaigns = (await NewsletterCampaign.find({
    status: { $in: ['queued', 'sending'] },
    $or: [{ scheduledAt: null }, { scheduledAt: { $lte: now } }]
  })
    .sort({ scheduledAt: 1, createdAt: 1 })
    .limit(maxCampaigns)
    .lean()) as CampaignDoc[];

  const summary = {
    checkedCampaigns: campaigns.length,
    processedCampaigns: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    results: [] as Array<{ campaignId: string; sent: number; failed: number; skipped: number; pending: number }>
  };

  for (const rawCampaign of campaigns) {
    const campaign = mapCampaign(rawCampaign);
    await NewsletterCampaign.updateOne(
      { _id: campaign.id, status: { $in: ['queued', 'sending'] } },
      { $set: { status: 'sending', startedAt: now, lastError: '' } }
    );

    const batch = (await NewsletterDelivery.find({ campaignId: campaign.id, status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(batchSizePerCampaign)
      .lean()) as DeliveryDoc[];
    const suppressedEmails = await mapSuppressedEmails(batch.map((row) => normalizeEmail(row.email)));

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const rawDelivery of batch) {
      const delivery = mapDelivery(rawDelivery);
      if (suppressedEmails.has(delivery.email)) {
        await NewsletterDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'skipped_suppressed',
              error: 'suppressed'
            }
          }
        );
        skipped += 1;
        continue;
      }

      const preference = delivery.userId
        ? await getNewsletterPreferenceForUser(delivery.userId)
        : await getNewsletterPreferenceByEmail(delivery.email);
      if (preference?.status === 'unsubscribed') {
        await NewsletterDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'skipped_unsubscribed',
              error: 'unsubscribed'
            }
          }
        );
        skipped += 1;
        continue;
      }
      if (!preference || preference.status !== 'subscribed') {
        await NewsletterDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'skipped_no_consent',
              error: preference?.status || 'missing-consent'
            }
          }
        );
        skipped += 1;
        continue;
      }

      const sendResult = await sendNewsletterCampaignEmail({
        to: delivery.email,
        firstName: clean(delivery.firstName) || toFirstName('', delivery.email),
        subject: campaign.subject,
        preheader: campaign.preheader,
        htmlBody: campaign.htmlBody,
        textBody: campaign.textBody,
        campaignId: campaign.id
      });
      if (sendResult.ok) {
        await NewsletterDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'sent',
              postmarkMessageId: sendResult.messageId,
              sentAt: new Date(),
              error: ''
            },
            $inc: {
              attempts: 1
            }
          }
        );
        sent += 1;
      } else {
        await NewsletterDelivery.updateOne(
          { _id: delivery.id },
          {
            $set: {
              status: 'failed',
              error: sendResult.error || 'send-failed'
            },
            $inc: {
              attempts: 1
            }
          }
        );
        failed += 1;
      }
    }

    const counters = await markCampaignStateAfterBatch(campaign.id);
    if (failed > 0) {
      await NewsletterCampaign.updateOne(
        { _id: campaign.id },
        { $set: { lastError: `${failed} deliveries failed in last batch` } }
      );
    }
    summary.processedCampaigns += 1;
    summary.sent += sent;
    summary.failed += failed;
    summary.skipped += skipped;
    summary.results.push({
      campaignId: campaign.id,
      sent,
      failed,
      skipped,
      pending: counters.pending
    });
  }

  return summary;
}
