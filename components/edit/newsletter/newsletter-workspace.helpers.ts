import {
  buildInitialForm,
  toDateTimeLocalInput,
  type CampaignFormState,
  type CampaignItem,
  type OverviewPayload
} from '@/components/edit/newsletter/newsletter-workspace.shared';
import { visualValueFromPlainText, visualValueToEmailHtml, visualValueToPlainText } from '@/lib/email-template-visual';

export function deriveCampaignBody(input: CampaignFormState) {
  const hasVisualSource = Array.isArray(input.visualBody) && input.visualBody.length > 0;
  const visualBody = hasVisualSource ? input.visualBody : visualValueFromPlainText(input.textBody);
  const textBody = hasVisualSource ? visualValueToPlainText(visualBody) : input.textBody;
  const htmlBody = hasVisualSource
    ? visualValueToEmailHtml({
        value: visualBody,
        heading: (input.subject || input.name || 'Newsletter update').trim(),
        previewText: input.preheader || textBody,
        siteNameToken: '{{siteName}}',
        appUrlToken: '{{appUrl}}',
        logoUrlToken: '{{logoUrl}}'
      })
    : input.htmlBody;

  return { htmlBody, textBody, visualBody };
}

export function toCampaignFormState(campaign: CampaignItem): CampaignFormState {
  return {
    campaignId: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    preheader: campaign.preheader,
    htmlBody: campaign.htmlBody,
    textBody: campaign.textBody,
    visualBody: Array.isArray(campaign.visualBody) ? campaign.visualBody : [],
    scheduledAt: toDateTimeLocalInput(campaign.scheduledAt)
  };
}

export function buildNewDraftForm(defaults: OverviewPayload['defaults']) {
  return buildInitialForm(defaults);
}
