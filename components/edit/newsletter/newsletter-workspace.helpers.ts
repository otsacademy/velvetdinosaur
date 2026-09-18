import {
  buildInitialForm,
  toDateTimeLocalInput,
  type CampaignFormState,
  type CampaignItem,
  type OverviewPayload
} from '@/components/edit/newsletter/newsletter-workspace.shared';
import { getNewsletterBodySource } from '@/lib/newsletter/composer-source';

export { deriveNewsletterComposerSource as deriveCampaignBody } from '@/lib/newsletter/composer-source';

export function toCampaignFormState(campaign: CampaignItem): CampaignFormState {
  return {
    campaignId: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    preheader: campaign.preheader,
    htmlBody: campaign.htmlBody,
    textBody: campaign.textBody,
    visualBody: Array.isArray(campaign.visualBody) ? campaign.visualBody : [],
    bodySource: getNewsletterBodySource(campaign), attachments: campaign.attachments || [],
    scheduledAt: toDateTimeLocalInput(campaign.scheduledAt)
  };
}

export function buildNewDraftForm(defaults: OverviewPayload['defaults']) {
  return buildInitialForm(defaults);
}
