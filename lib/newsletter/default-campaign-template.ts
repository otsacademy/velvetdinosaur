import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/default-campaign-template.ts');

export type NewsletterCampaignTemplateContent = {
  htmlBody: string;
  textBody: string;
};

const LEGACY_HTML_SIGNATURES = [
  'Thank you for supporting {{siteName}}. Here is your latest update.',
  'New reports and publications now live.',
  'Upcoming events and chapter activity.',
  'Ways to get involved this month.'
];

const LEGACY_TEXT_SIGNATURES = [
  'Thank you for supporting {{siteName}}. Here is your latest update.',
  '- New reports and publications now live.',
  '- Upcoming events and chapter activity.',
  '- Ways to get involved this month.'
];

const DEFAULT_TEMPLATE: NewsletterCampaignTemplateContent = {
  htmlBody: [
    '<p style="margin:0 0 12px 0;font-size:15px;line-height:24px">Hello {{firstName}},</p>',
    '<p style="margin:0 0 16px 0;font-size:15px;line-height:24px">Here are the latest updates from {{siteName}}.</p>',
    '<h2 style="margin:0 0 10px 0;font-size:20px;line-height:28px">Latest News</h2>',
    '{{newsHighlights}}',
    '<h2 style="margin:18px 0 10px 0;font-size:20px;line-height:28px">Upcoming Events</h2>',
    '{{eventHighlights}}',
    '<p style="margin:18px 0 0 0;font-size:14px;line-height:22px">Explore more on <a href="{{appUrl}}" style="color:#0b4e9b">the {{siteName}} website</a>.</p>',
    '<p style="margin:8px 0 0 0;font-size:13px;line-height:20px;color:#6b7280">You can unsubscribe any time using the link below.</p>'
  ].join(''),
  textBody: [
    'Hello {{firstName}},',
    '',
    'Here are the latest updates from {{siteName}}.',
    '',
    'Latest News',
    '',
    '{{newsHighlights}}',
    '',
    'Upcoming Events',
    '{{eventHighlights}}',
    '',
    'Explore all updates: {{appUrl}}'
  ].join('\n')
};

export function buildDefaultNewsletterCampaignTemplateContent(): NewsletterCampaignTemplateContent {
  return {
    htmlBody: DEFAULT_TEMPLATE.htmlBody,
    textBody: DEFAULT_TEMPLATE.textBody
  };
}

export function isLegacyNewsletterCampaignTemplate(htmlBody: string, textBody: string) {
  const html = (htmlBody || '').trim();
  const text = (textBody || '').trim();
  if (!html || !text) return false;
  const htmlLegacy = LEGACY_HTML_SIGNATURES.every((signature) => html.includes(signature));
  const textLegacy = LEGACY_TEXT_SIGNATURES.every((signature) => text.includes(signature));
  return htmlLegacy && textLegacy;
}
