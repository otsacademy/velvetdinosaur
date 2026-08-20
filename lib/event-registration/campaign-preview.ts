import { buildBrandedEmailHtml, escapeHtml } from '@/lib/email-branding';
import { clean, normalizeEventCampaignKind, type EventCampaignKind } from '@/lib/event-registration/shared';

export const EVENT_CAMPAIGN_TEMPLATE_KEYS = [
  'event-registration-update',
  'event-registration-joining-instructions'
] as const;

export type EventCampaignTemplateKey = (typeof EVENT_CAMPAIGN_TEMPLATE_KEYS)[number];

export function isEventCampaignTemplateKey(value: string): value is EventCampaignTemplateKey {
  return EVENT_CAMPAIGN_TEMPLATE_KEYS.includes(value as EventCampaignTemplateKey);
}

export function eventCampaignTemplateKeyToKind(key: EventCampaignTemplateKey): EventCampaignKind {
  return key === 'event-registration-joining-instructions' ? 'joining-instructions' : 'update';
}

export function isFullHtmlDocument(value: string) {
  return /<html[\s>]|<body[\s>]/i.test(value || '');
}

export function applyEventCampaignTemplateValues(template: string, values: Record<string, string>) {
  let output = template || '';
  for (const [token, value] of Object.entries(values)) {
    output = output.split(token).join(value);
  }
  return output;
}

function buildEventMetaHtml(values: Record<string, string>) {
  const title = escapeHtml(values['{{eventTitle}}'] || '');
  const date = escapeHtml(values['{{eventDate}}'] || '');
  const location = escapeHtml(values['{{eventLocation}}'] || '');
  return `<p style="margin:0 0 16px 0;font-size:14px;line-height:22px;color:#111827"><strong>${title}</strong><br />${date}<br />${location}</p>`;
}

function buildPreheaderHtml(preheader: string) {
  const trimmed = clean(preheader);
  if (!trimmed) return '';
  return `<p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#6b7280">${escapeHtml(trimmed)}</p>`;
}

export function buildEventCampaignPreviewHtml(input: {
  campaignKind: EventCampaignKind;
  subject: string;
  preheader: string;
  htmlBody: string;
  values: Record<string, string>;
}) {
  const kind = normalizeEventCampaignKind(input.campaignKind);
  const htmlBody = applyEventCampaignTemplateValues(input.htmlBody, input.values);
  if (isFullHtmlDocument(htmlBody)) return htmlBody;

  const subject = applyEventCampaignTemplateValues(input.subject, input.values);
  const preheader = applyEventCampaignTemplateValues(input.preheader, input.values);

  return buildBrandedEmailHtml({
    previewText: preheader || subject,
    heading: subject,
    siteName: input.values['{{siteName}}'] || '{{siteName}}',
    appUrl: input.values['{{appUrl}}'] || '{{appUrl}}',
    logoUrl: input.values['{{logoUrl}}'] || '{{logoUrl}}',
    bodyHtml: [
      buildPreheaderHtml(preheader),
      buildEventMetaHtml(input.values),
      htmlBody,
      kind === 'joining-instructions'
        ? '<p style="margin:16px 0 0 0;font-size:13px;line-height:20px;color:#6b7280">Confirmed participants should keep these joining instructions to hand on the day of the event.</p>'
        : ''
    ].join('')
  });
}

export function buildEventCampaignPreviewText(input: {
  textBody: string;
  values: Record<string, string>;
}) {
  const textBody = applyEventCampaignTemplateValues(input.textBody, input.values);
  return [
    clean(input.values['{{eventTitle}}']),
    clean(input.values['{{eventDate}}']),
    clean(input.values['{{eventLocation}}']),
    '',
    textBody
  ]
    .filter(Boolean)
    .join('\n');
}
