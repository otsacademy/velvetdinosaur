import {
  buildInitialForm,
  toDateTimeLocalInput,
  type CampaignFormState,
  type CampaignItem,
  type EventCampaignKind,
  type OverviewPayload
} from '@/components/edit/event-registration/event-registration-workspace.shared';
import {
  ensureVisualValue,
  visualValueFromPlainText,
  visualValueToEmailHtml,
  visualValueToPlainText
} from '@/lib/email-template-visual';

export function getVisualSource(input: CampaignFormState) {
  if (Array.isArray(input.visualBody) && input.visualBody.length > 0) {
    return ensureVisualValue(input.visualBody);
  }
  return visualValueFromPlainText(input.textBody || '');
}

export function deriveCampaignBody(input: CampaignFormState, visualOverride?: unknown[]) {
  const hasVisualSource = Array.isArray(visualOverride)
    ? visualOverride.length > 0
    : Array.isArray(input.visualBody) && input.visualBody.length > 0;
  const visualBody = hasVisualSource
    ? ensureVisualValue(Array.isArray(visualOverride) ? visualOverride : input.visualBody)
    : visualValueFromPlainText(input.textBody || '');
  const textBody = hasVisualSource ? visualValueToPlainText(visualBody) : input.textBody || '';
  const htmlBody = hasVisualSource
    ? visualValueToEmailHtml({
        value: visualBody,
        heading: (input.subject || input.name || 'Event update').trim(),
        previewText: input.preheader || textBody,
        siteNameToken: '{{siteName}}',
        appUrlToken: '{{appUrl}}',
        logoUrlToken: '{{logoUrl}}'
      })
    : input.htmlBody || '';

  return { htmlBody, textBody, visualBody };
}

export function toCampaignFormState(campaign: CampaignItem): CampaignFormState {
  return {
    campaignId: campaign.id,
    eventId: campaign.eventId,
    campaignKind: campaign.campaignKind,
    name: campaign.name,
    subject: campaign.subject,
    preheader: campaign.preheader,
    htmlBody: campaign.htmlBody,
    textBody: campaign.textBody,
    visualBody: Array.isArray(campaign.visualBody) ? campaign.visualBody : [],
    scheduledAt: toDateTimeLocalInput(campaign.scheduledAt)
  };
}

export function buildNewDraftForm(
  eventId: string,
  defaults: OverviewPayload['defaults'],
  campaignKind: EventCampaignKind = 'update'
) {
  return buildInitialForm(eventId, defaults, campaignKind);
}
