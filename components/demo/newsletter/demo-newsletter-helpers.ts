'use client';

import {
  buildDemoNewsletterForm,
  formatNewsletterDate,
  toDateTimeLocalInput,
  type DemoNewsletterCampaign,
  type DemoNewsletterDelivery,
  type DemoNewsletterFormState,
  type DemoNewsletterSeed,
  type DemoNewsletterSubscriber,
  type DemoNewsletterContentItem
} from '@/lib/demo-newsletter-seed';
import { buildDemoBrandedEmailHtml, ensureVisualValue, visualValueFromPlainText, visualValueToEmailHtml, visualValueToPlainText } from '@/lib/demo-email-template-visual';

type RenderNewsletterPreviewArgs = {
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  email: string;
  firstName: string;
  newsOptions: DemoNewsletterContentItem[];
  eventOptions: DemoNewsletterContentItem[];
};

export type DemoNewsletterOverview = {
  totalSubscribers: number;
  subscribedCount: number;
  pendingCount: number;
  campaignCounts: {
    draft: number;
    queued: number;
    completed: number;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildHighlightDirective(token: 'newsHighlights' | 'eventHighlights', slugs: string[]) {
  return slugs.length ? `{{${token}:${slugs.join(',')}}}` : `{{${token}}}`;
}

function replaceTokenValue(template: string, mapping: Record<string, string>) {
  return Object.entries(mapping).reduce((output, [token, value]) => output.split(token).join(value), template);
}

function readDirectiveSlugs(body: string, token: 'newsHighlights' | 'eventHighlights') {
  const match = body.match(new RegExp(`\\{\\{${token}(?::([^}]+))?\\}\\}`));
  if (!match?.[1]) return [];
  return match[1]
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveHighlightItems(
  body: string,
  token: 'newsHighlights' | 'eventHighlights',
  options: DemoNewsletterContentItem[]
) {
  const selectedSlugs = readDirectiveSlugs(body, token);
  const selectedItems = selectedSlugs
    .map((slug) => options.find((item) => item.slug === slug) ?? null)
    .filter((item): item is DemoNewsletterContentItem => Boolean(item));

  if (selectedItems.length) return selectedItems;
  return options.slice(0, 2);
}

function renderHighlightHtml(items: DemoNewsletterContentItem[]) {
  return `<ul>${items
    .map((item) => `<li><strong>${escapeHtml(item.title)}</strong><br /><span>${escapeHtml(item.dateLabel)}</span></li>`)
    .join('')}</ul>`;
}

function renderHighlightText(items: DemoNewsletterContentItem[]) {
  return items.map((item) => `- ${item.title} (${item.dateLabel})`).join('\n');
}

function replaceHighlightTokens(
  body: string,
  token: 'newsHighlights' | 'eventHighlights',
  options: DemoNewsletterContentItem[],
  html = false
) {
  const items = resolveHighlightItems(body, token, options);
  const rendered = html ? renderHighlightHtml(items) : renderHighlightText(items);
  return body.replace(new RegExp(`\\{\\{${token}(?::[^}]+)?\\}\\}`, 'g'), rendered);
}

export function createNewsletterOverview(
  subscribers: DemoNewsletterSubscriber[],
  campaigns: DemoNewsletterCampaign[]
): DemoNewsletterOverview {
  return {
    totalSubscribers: subscribers.length,
    subscribedCount: subscribers.filter((item) => item.status === 'subscribed').length,
    pendingCount: subscribers.filter((item) => item.status === 'pending').length,
    campaignCounts: {
      draft: campaigns.filter((item) => item.status === 'draft').length,
      queued: campaigns.filter((item) => item.status === 'queued').length,
      completed: campaigns.filter((item) => item.status === 'completed').length
    }
  };
}

export function applyHighlightSelections(
  form: DemoNewsletterFormState,
  selectedNewsSlugs: string[],
  selectedEventSlugs: string[]
) {
  const htmlBody = replaceTokenValue(form.htmlBody, {
    '{{newsHighlights}}': buildHighlightDirective('newsHighlights', selectedNewsSlugs),
    '{{eventHighlights}}': buildHighlightDirective('eventHighlights', selectedEventSlugs)
  }).replace(/\{\{newsHighlights:[^}]+\}\}/g, buildHighlightDirective('newsHighlights', selectedNewsSlugs))
    .replace(/\{\{eventHighlights:[^}]+\}\}/g, buildHighlightDirective('eventHighlights', selectedEventSlugs));
  const textBody = replaceTokenValue(form.textBody, {
    '{{newsHighlights}}': buildHighlightDirective('newsHighlights', selectedNewsSlugs),
    '{{eventHighlights}}': buildHighlightDirective('eventHighlights', selectedEventSlugs)
  }).replace(/\{\{newsHighlights:[^}]+\}\}/g, buildHighlightDirective('newsHighlights', selectedNewsSlugs))
    .replace(/\{\{eventHighlights:[^}]+\}\}/g, buildHighlightDirective('eventHighlights', selectedEventSlugs));
  const visualBody =
    Array.isArray(form.visualBody) && form.visualBody.length ? visualValueFromPlainText(textBody) : [];

  return {
    ...form,
    htmlBody,
    textBody,
    visualBody
  };
}

export function readSelectedHighlights(
  form: Pick<DemoNewsletterFormState, 'htmlBody' | 'textBody'>,
  token: 'newsHighlights' | 'eventHighlights'
) {
  return readDirectiveSlugs(form.htmlBody || form.textBody, token);
}

export function renderNewsletterPreview({
  subject,
  preheader,
  htmlBody,
  textBody,
  email,
  firstName,
  newsOptions,
  eventOptions
}: RenderNewsletterPreviewArgs) {
  const tokenValues = {
    '{{firstName}}': firstName || 'Amelia',
    '{{email}}': email || 'amelia@harbourandpine.example',
    '{{siteName}}': 'Harbour & Pine Studio',
    '{{appUrl}}': 'https://harbourandpine.example',
    '{{logoUrl}}': '/assets/demo-media/harbour-pine/branding/brand-board.svg',
    '{{subject}}': subject,
    '{{preheader}}': preheader,
    '{{unsubscribeUrl}}': 'https://harbourandpine.example/unsubscribe/demo'
  };

  const highlightedHtml = replaceHighlightTokens(
    replaceHighlightTokens(htmlBody, 'newsHighlights', newsOptions, true),
    'eventHighlights',
    eventOptions,
    true
  );
  const highlightedText = replaceHighlightTokens(
    replaceHighlightTokens(textBody, 'newsHighlights', newsOptions, false),
    'eventHighlights',
    eventOptions,
    false
  );
  const bodyHtml = replaceTokenValue(
    highlightedHtml,
    Object.fromEntries(Object.entries(tokenValues).map(([token, value]) => [token, escapeHtml(value)]))
  );
  const fullHtml = /<html[\s>]/i.test(bodyHtml)
    ? bodyHtml
    : buildDemoBrandedEmailHtml({
        previewText: preheader || subject,
        heading: subject,
        siteName: tokenValues['{{siteName}}'],
        appUrl: tokenValues['{{appUrl}}'],
        logoUrl: tokenValues['{{logoUrl}}'],
        bodyHtml
      });

  return {
    htmlBody: fullHtml,
    textBody: replaceTokenValue(highlightedText, tokenValues)
  };
}

export function getVisualSource(form: DemoNewsletterFormState) {
  if (Array.isArray(form.visualBody) && form.visualBody.length) {
    return ensureVisualValue(form.visualBody);
  }
  return visualValueFromPlainText(form.textBody || '');
}

export function deriveNewsletterSource(form: DemoNewsletterFormState, visualOverride?: unknown[]) {
  const hasVisualSource = Array.isArray(visualOverride)
    ? visualOverride.length > 0
    : Array.isArray(form.visualBody) && form.visualBody.length > 0;
  const visualBody = hasVisualSource
    ? ensureVisualValue(Array.isArray(visualOverride) ? visualOverride : form.visualBody)
    : visualValueFromPlainText(form.textBody || '');
  const textBody = hasVisualSource ? visualValueToPlainText(visualBody) : form.textBody || '';
  const htmlBody = hasVisualSource
    ? visualValueToEmailHtml({
        value: visualBody,
        heading: (form.subject || form.name || 'Newsletter update').trim(),
        previewText: form.preheader || textBody,
        siteNameToken: '{{siteName}}',
        appUrlToken: '{{appUrl}}',
        logoUrlToken: '{{logoUrl}}'
      })
    : form.htmlBody;

  return { htmlBody, textBody, visualBody };
}

export function createCampaignForm(
  campaign: DemoNewsletterCampaign | null,
  defaults: DemoNewsletterSeed['defaults']
) {
  if (!campaign) {
    return buildDemoNewsletterForm(defaults);
  }

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

export function createDraftCampaign(form: DemoNewsletterFormState, id: string): DemoNewsletterCampaign {
  return {
    id,
    name: form.name.trim(),
    subject: form.subject.trim(),
    preheader: form.preheader.trim(),
    htmlBody: form.htmlBody,
    textBody: form.textBody,
    visualBody: Array.isArray(form.visualBody) ? form.visualBody : [],
    status: 'draft',
    scheduledAt: form.scheduledAt || null,
    recipientSnapshotCount: 0,
    sentCount: 0,
    failedCount: 0,
    skippedCount: 0,
    createdAt: new Date().toISOString()
  };
}

export function filterSubscribers(
  items: DemoNewsletterSubscriber[],
  query: string,
  status: 'all' | DemoNewsletterSubscriber['status']
) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (status !== 'all' && item.status !== status) return false;
    if (!normalizedQuery) return true;
    return `${item.firstName} ${item.email}`.toLowerCase().includes(normalizedQuery);
  });
}

export function filterDeliveries(
  items: DemoNewsletterDelivery[],
  query: string,
  status: 'all' | DemoNewsletterDelivery['status'],
  campaignId: string
) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    if (campaignId && item.campaignId !== campaignId) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (!normalizedQuery) return true;
    return `${item.firstName} ${item.email} ${item.postmarkMessageId}`.toLowerCase().includes(normalizedQuery);
  });
}

export function nextCampaignId() {
  return `cmp-demo-${Math.random().toString(36).slice(2, 8)}`;
}

export function nextDeliveryId() {
  return `del-demo-${Math.random().toString(36).slice(2, 8)}`;
}

export function formatCampaignMeta(campaign: DemoNewsletterCampaign) {
  return `Scheduled ${formatNewsletterDate(campaign.scheduledAt)} · ${campaign.recipientSnapshotCount} recipients`;
}
