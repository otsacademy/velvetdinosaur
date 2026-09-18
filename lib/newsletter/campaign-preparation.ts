import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/campaign-preparation.ts');
import { prepareNewsletterMedia, loadNewsletterMedia, releaseNewsletterMedia } from './media';
import type { NewsletterAttachment, NewsletterBodySource } from './media-types';
import type { CampaignDoc, FrozenNewsletterContent } from './campaign-types';
import { prepareNewsletterCampaignEmail, renderNewsletterCampaignEmail } from '@/lib/email/newsletter-campaign';

type DraftInput = { htmlBody: string; visualBody?: unknown[]; bodySource?: NewsletterBodySource; attachments?: NewsletterAttachment[] };

export async function validateDraftMedia(input: DraftInput) {
  const bodySource = input.bodySource || (input.visualBody?.length ? 'visual' : 'html');
  const prepared = await prepareNewsletterMedia({ ...input, visualBody: bodySource === 'visual' ? input.visualBody : undefined });
  return {
    bodySource,
    attachments: prepared.manifest.attachments.map(({ assetKey, name, mime, size }) => ({ assetKey, name, mime, size }))
  };
}

export async function freezeNewsletterCampaign(campaign: CampaignDoc, campaignId: string): Promise<FrozenNewsletterContent> {
  const media = await prepareNewsletterMedia({
    htmlBody: campaign.htmlBody || '',
    visualBody: campaign.bodySource === 'html' || campaign.bodySource === 'text' ? undefined : Array.isArray(campaign.visualBody) ? campaign.visualBody : undefined,
    attachments: campaign.attachments || [],
    campaignId
  });
  try {
    const email = await prepareNewsletterCampaignEmail({ htmlBody: media.htmlBody, textBody: campaign.textBody || '', attachments: media.attachments });
    await renderNewsletterCampaignEmail({
      to: 'queue-validation@example.invalid', firstName: 'Recipient', campaignId,
      subject: campaign.subject || '', preheader: campaign.preheader || '',
      htmlBody: media.htmlBody, textBody: campaign.textBody || '', prepared: email
    });
    return { subject: campaign.subject || '', preheader: campaign.preheader || '', htmlBody: email.htmlBody, textBody: email.textBody, manifest: media.manifest };
  } catch (error) {
    await releaseNewsletterMedia(media.manifest, new Date());
    throw error;
  }
}

export async function prepareFrozenNewsletterBatch(content: FrozenNewsletterContent) {
  const media = await loadNewsletterMedia(content.manifest);
  return prepareNewsletterCampaignEmail({ htmlBody: content.htmlBody, textBody: content.textBody, attachments: media.attachments });
}
