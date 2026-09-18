import { z } from 'zod';
import { NewsletterCampaign } from '@/models/NewsletterCampaign';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { getNewsletterPreferenceByEmail } from './consent';
import { clean } from './shared';
import { prepareNewsletterMedia } from './media';
import { prepareFrozenNewsletterBatch } from './campaign-preparation';
import { prepareNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';
import type { CampaignDoc } from './campaign-types';

export const NewsletterAttachmentSchema = z.object({
  assetKey: z.string().min(1).max(2048), name: z.string().max(255).default(''),
  mime: z.string().max(100).default(''), size: z.number().nonnegative().default(0)
});
export const NewsletterRequestSchema = z.object({
  toEmail: z.string().trim().email().optional(), firstName: z.string().trim().max(120).optional(),
  campaignId: z.string().trim().regex(/^[a-f\d]{24}$/i).optional(),
  subject: z.string().trim().min(1).max(200).optional(), preheader: z.string().trim().max(200).optional(),
  htmlBody: z.string().max(2_000_000).optional(), textBody: z.string().max(2_000_000).optional(),
  visualBody: z.array(z.unknown()).optional(), bodySource: z.enum(['visual', 'html', 'text']).optional(),
  attachments: z.array(NewsletterAttachmentSchema).max(5).optional()
});

export async function prepareNewsletterRequest(data: z.infer<typeof NewsletterRequestSchema>, adminEmail: string) {
  await requireNewsletterDatabase();
  const to = data.toEmail || adminEmail;
  let firstName = clean(data.firstName);
  if (!firstName) firstName = clean((await getNewsletterPreferenceByEmail(to))?.firstName);
  let campaign: CampaignDoc | null = null;
  if (data.campaignId) {
    await requireNewsletterDatabase();
    campaign = await NewsletterCampaign.findById(data.campaignId).lean() as CampaignDoc | null;
    if (!campaign) throw new Error('Campaign not found.');
  }
  const campaignId = data.campaignId || 'preview-campaign';
  if (campaign?.frozenContent && campaign.status !== 'draft') {
    const frozen = campaign.frozenContent;
    return { input: { to, firstName, campaignId, ...frozen, prepared: await prepareFrozenNewsletterBatch(frozen) }, attachments: frozen.manifest.attachments, manifest: frozen.manifest };
  }
  const subject = data.subject || campaign?.subject || '';
  const preheader = data.preheader ?? campaign?.preheader ?? '';
  const htmlBody = data.htmlBody ?? campaign?.htmlBody ?? '';
  const textBody = data.textBody ?? campaign?.textBody ?? '';
  if (!subject || !htmlBody || !textBody) throw new Error('Subject, HTML body, and text body are required.');
  const bodySource = data.bodySource || campaign?.bodySource;
  const visualBody = data.visualBody ?? (Array.isArray(campaign?.visualBody) ? campaign.visualBody : undefined);
  const media = await prepareNewsletterMedia({ htmlBody, visualBody: bodySource === 'html' || bodySource === 'text' ? undefined : visualBody, attachments: data.attachments ?? campaign?.attachments ?? [] });
  const prepared = await prepareNewsletterCampaignEmail({ htmlBody: media.htmlBody, textBody, attachments: media.attachments });
  return { input: { to, firstName, campaignId, subject, preheader, htmlBody: media.htmlBody, textBody, prepared }, attachments: media.manifest.attachments, manifest: media.manifest };
}
