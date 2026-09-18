import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/campaigns.ts');
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { buildDefaultNewsletterCampaignTemplateContent, isLegacyNewsletterCampaignTemplate } from './default-campaign-template';
import { clean, normalizeEmail } from './shared';
import { getSystemEmailTemplateEditorState } from '@/lib/system-email-templates';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { NewsletterDelivery } from '@/models/NewsletterDelivery';
import { mapCampaign, mapDelivery, type CampaignDoc, type DeliveryDoc, type NewsletterDeliveryStatus as DeliveryStatus } from './campaign-types';
import type { NewsletterAttachment, NewsletterBodySource } from './media-types';
import { validateDraftMedia } from './campaign-preparation';
export type { NewsletterCampaignSummary, NewsletterDeliverySummary, NewsletterDeliveryStatus } from './campaign-types';
export { queueNewsletterCampaign, cancelNewsletterCampaign, unscheduleNewsletterCampaign } from './campaign-lifecycle';
export { dispatchQueuedNewsletterCampaigns } from './dispatch';

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
  await requireNewsletterDatabase();
  const rows = (await NewsletterCampaign.find({})
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(500, Math.round(limit))))
    .lean()) as CampaignDoc[];
  return rows.map(mapCampaign);
}

export async function getNewsletterCampaignById(campaignId: string) {
  await requireNewsletterDatabase();
  const row = (await NewsletterCampaign.findById(clean(campaignId)).lean()) as CampaignDoc | null;
  return row ? mapCampaign(row) : null;
}

export async function listNewsletterDeliveriesByCampaign(campaignId: string, limit = 250) {
  await requireNewsletterDatabase();
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
  await requireNewsletterDatabase();
  const limit = Math.max(1, Math.min(2000, Math.round(options?.limit || 250)));
  const query: Record<string, unknown> = {};
  const campaignId = clean(options?.campaignId);
  const q = clean(options?.q);
  const status = options?.status;

  if (campaignId) query.campaignId = campaignId;
  if (status && status !== 'all') query.status = status;
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
  await requireNewsletterDatabase();
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
  attachments?: NewsletterAttachment[];
  bodySource?: NewsletterBodySource;
  createdByUserId: string;
}) {
  await requireNewsletterDatabase();
  const mediaFields = await validateDraftMedia(input);
  const created = (await NewsletterCampaign.create({
    ...mediaFields,
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
  attachments?: NewsletterAttachment[];
  bodySource?: NewsletterBodySource;
}) {
  await requireNewsletterDatabase();
  const campaignId = clean(input.campaignId);
  if (!campaignId) return null;
  const mediaFields = await validateDraftMedia(input);
  const updated = (await NewsletterCampaign.findOneAndUpdate(
    { _id: campaignId, status: 'draft', preparationToken: null },
    {
      $set: {
        ...mediaFields,
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
