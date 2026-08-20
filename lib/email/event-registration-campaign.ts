import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/event-registration-campaign.ts');

import { render } from '@react-email/render';
import { EventRegistrationCampaignEmail } from '@/components/email/event-registration-campaign-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { isFullHtmlDocument } from '@/lib/event-registration/campaign-preview';
import { sendPostmarkEmail } from '@/lib/email/postmark';
import { clean, normalizeEmail, toFirstName } from '@/lib/event-registration/shared';

type EventCampaignContext = {
  slug: string;
  title: string;
  dateLabel: string;
  location: string;
  joiningInstructions: string;
};

type SendEventRegistrationCampaignEmailInput = {
  to: string;
  fullName?: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  campaignId: string;
  event: EventCampaignContext;
  metadata?: Record<string, string>;
};

type SendEventRegistrationCampaignEmailResult = {
  ok: boolean;
  messageId: string;
  error: string;
};

type RenderEventRegistrationCampaignEmailResult = {
  toEmail: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
};

function normalizeBaseUrl(value: string | undefined | null) {
  return clean(value).replace(/\/+$/, '');
}

function buildEventUrl(appUrl: string, eventSlug: string) {
  const base = normalizeBaseUrl(appUrl);
  const slug = clean(eventSlug);
  if (!base || !slug) return '';
  return `${base}/events/${encodeURIComponent(slug)}`;
}

function applyTemplateValues(template: string, values: Record<string, string>) {
  let output = template || '';
  for (const [token, value] of Object.entries(values)) {
    output = output.split(token).join(value);
  }
  return output;
}

export async function renderEventRegistrationCampaignEmail(
  input: SendEventRegistrationCampaignEmailInput
): Promise<RenderEventRegistrationCampaignEmailResult | null> {
  const recipient = normalizeEmail(input.to);
  if (!recipient) return null;

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const eventUrl = buildEventUrl(appUrl, input.event.slug);
  const firstName = toFirstName(input.fullName, recipient) || 'there';
  const values = {
    '{{subject}}': clean(input.subject),
    '{{preheader}}': clean(input.preheader),
    '{{firstName}}': firstName,
    '{{fullName}}': clean(input.fullName) || firstName,
    '{{email}}': recipient,
    '{{siteName}}': siteName,
    '{{appUrl}}': appUrl,
    '{{logoUrl}}': logoUrl,
    '{{eventTitle}}': clean(input.event.title),
    '{{eventDate}}': clean(input.event.dateLabel),
    '{{eventLocation}}': clean(input.event.location),
    '{{eventUrl}}': eventUrl,
    '{{joiningInstructions}}': clean(input.event.joiningInstructions),
    '{{customMessage}}': 'Please check the latest event details below.'
  };

  const subject = applyTemplateValues(input.subject, values);
  const preheader = applyTemplateValues(input.preheader || '', values);
  const htmlBase = applyTemplateValues(input.htmlBody, values);
  const textBody = applyTemplateValues(input.textBody, values);
  const htmlBody = isFullHtmlDocument(htmlBase)
    ? htmlBase
    : await render(
        EventRegistrationCampaignEmail({
          subject,
          preheader,
          htmlBody: htmlBase,
          siteName,
          appUrl,
          logoUrl,
          eventTitle: clean(input.event.title),
          eventDateLabel: clean(input.event.dateLabel),
          eventLocation: clean(input.event.location)
        })
      );

  return {
    toEmail: recipient,
    subject,
    preheader,
    htmlBody,
    textBody: [
      `${clean(input.event.title)}`,
      clean(input.event.dateLabel),
      clean(input.event.location),
      '',
      textBody
    ]
      .filter(Boolean)
      .join('\n')
  };
}

export async function sendEventRegistrationCampaignEmail(
  input: SendEventRegistrationCampaignEmailInput
): Promise<SendEventRegistrationCampaignEmailResult> {
  const rendered = await renderEventRegistrationCampaignEmail(input);
  if (!rendered) {
    return { ok: false, messageId: '', error: 'missing-recipient' };
  }

  const result = await sendPostmarkEmail({
    to: rendered.toEmail,
    subject: rendered.subject,
    htmlBody: rendered.htmlBody,
    textBody: rendered.textBody,
    fromName: 'The ASAP Global Team',
    tag: 'event-registration-campaign',
    metadata: {
      campaignId: clean(input.campaignId),
      eventSlug: clean(input.event.slug),
      ...(input.metadata || {})
    }
  });

  return {
    ok: result.ok,
    messageId: result.messageId,
    error: result.error || ''
  };
}
