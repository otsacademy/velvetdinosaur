import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/newsletter-campaign.ts');

import { ServerClient } from 'postmark';
import { loadInlineSocialIconAttachments, withHtmlFooter, withTextFooter } from './newsletter-social';
import { assertNewsletterSendingAllowed } from '@/lib/newsletter/send-policy';
import { assertNewsletterMessageSize } from '@/lib/newsletter/media-validation';
import {
  buildBrandedEmailHtml,
  escapeHtml,
  normalizeBaseUrl,
  resolveLogoUrl,
  resolveSiteName
} from '@/lib/email-branding';
import { resolveNewsletterHighlightDirectives } from '@/lib/newsletter/highlight-directives';
import { clean, normalizeEmail, toFirstName } from '@/lib/newsletter/shared';
import { createNewsletterUnsubscribeToken } from '@/lib/newsletter/unsubscribe-token';

export type SendNewsletterCampaignEmailInput = {
  to: string;
  firstName?: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  campaignId: string;
  metadata?: Record<string, string>;
  prepared?: PreparedNewsletterEmail;
};

type SendNewsletterCampaignEmailResult = {
  ok: boolean;
  messageId: string;
  error: string;
  ambiguous?: boolean;
};

type RenderNewsletterCampaignEmailOptions = {
  inlineSocialIcons?: boolean;
};

type RenderNewsletterCampaignEmailResult = {
  toEmail: string;
  subject: string;
  preheader: string;
  htmlBody: string;
  textBody: string;
  unsubscribeUrl: string;
  oneClickUnsubscribeUrl: string;
  attachments: PostmarkAttachment[];
};

export type PostmarkAttachment = NonNullable<Parameters<ServerClient['sendEmail']>[0]['Attachments']>[number];

function getPostmarkConfig() {
  const token = (process.env.POSTMARK_SERVER_TOKEN || '').trim();
  const from = (
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    ''
  ).trim();
  return { token, from };
}

export function assertNewsletterTransportConfigured() {
  const { token, from } = getPostmarkConfig();
  if (!token || !extractEmailAddress(from)) throw new Error('Newsletter sending requires a configured Postmark token and sender email.');
}

function extractEmailAddress(from: string) {
  const trimmed = clean(from);
  const match = trimmed.match(/<([^>]+)>/);
  const candidate = match?.[1] || trimmed;
  return candidate.includes('@') ? candidate.trim() : '';
}

function normalizeEnvValue(raw: string | undefined | null) {
  const value = (raw || '').trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

export function resolveNewsletterBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.PUBLIC_BASE_URL,
    process.env.APP_BASE_URL,
    process.env.SITE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.VD_SITE_URL,
    process.env.BETTERAUTH_URL,
    process.env.NEXT_PUBLIC_BETTERAUTH_URL
  ];

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(normalizeEnvValue(candidate));
    if (normalized) return normalized;
  }

  const domain = normalizeEnvValue(process.env.DOMAIN).replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (domain) return `https://${domain}`;

  return '';
}

function applyTemplateValues(template: string, values: Record<string, string>) {
  let output = template || '';
  for (const [token, value] of Object.entries(values)) {
    output = output.split(token).join(value);
  }
  return output;
}

function formatNewsletterHeading(raw: string) {
  const trimmed = clean(raw);
  if (!trimmed) return '';
  // Keep date segments and separators from breaking into orphaned fragments.
  return trimmed
    .replace(/\s+·\s+/g, '\u00A0·\u00A0')
    .replace(/\b(\d{4})-(\d{2})-(\d{2})\b/g, '$1\u2011$2\u2011$3');
}

function resolveHeadingSize(heading: string) {
  const len = heading.length;
  if (len >= 70) return { fontSize: 18, lineHeight: 24 };
  if (len >= 58) return { fontSize: 20, lineHeight: 26 };
  return { fontSize: 22, lineHeight: 28 };
}

function buildUnsubscribeUrl(email: string, campaignId: string) {
  const token = createNewsletterUnsubscribeToken({ email, campaignId });
  if (!token) return '';
  const base = resolveNewsletterBaseUrl().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function buildOneClickUnsubscribeUrl(email: string, campaignId: string) {
  const token = createNewsletterUnsubscribeToken({ email, campaignId });
  if (!token) return '';
  const base = resolveNewsletterBaseUrl().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/api/newsletter/unsubscribe/one-click?token=${encodeURIComponent(token)}`;
}

export async function sendNewsletterCampaignEmail(
  input: SendNewsletterCampaignEmailInput,
  transport?: (message: Parameters<ServerClient['sendEmail']>[0]) => Promise<{ MessageID: string }>
): Promise<SendNewsletterCampaignEmailResult> {
  try { assertNewsletterSendingAllowed(); } catch (error) {
    return { ok: false, messageId: '', error: error instanceof Error ? error.message : 'Sending disabled' };
  }
  const recipient = normalizeEmail(input.to);
  if (!recipient) {
    return { ok: false, messageId: '', error: 'missing-recipient' };
  }

  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    return { ok: false, messageId: '', error: 'missing-postmark-config' };
  }

  let rendered: RenderNewsletterCampaignEmailResult | null;
  try {
    rendered = await renderNewsletterCampaignEmail(input, { inlineSocialIcons: true });
  } catch (error) {
    // No provider request has occurred: a rendering/size failure is definite.
    return { ok: false, messageId: '', error: error instanceof Error ? error.message : 'Newsletter rendering failed', ambiguous: false };
  }
  if (!rendered) {
    return { ok: false, messageId: '', error: 'missing-recipient' };
  }
  const client = new ServerClient(token);

  try {
    const headers: Array<{ Name: string; Value: string }> = [];
    const listUnsubscribeParts: string[] = [];
    if (rendered.oneClickUnsubscribeUrl) {
      listUnsubscribeParts.push(`<${rendered.oneClickUnsubscribeUrl}>`);
    } else if (rendered.unsubscribeUrl) {
      listUnsubscribeParts.push(`<${rendered.unsubscribeUrl}>`);
    }
    const fromEmail = extractEmailAddress(from);
    if (fromEmail) {
      listUnsubscribeParts.push(`<mailto:${fromEmail}?subject=unsubscribe>`);
    }
    if (listUnsubscribeParts.length > 0) {
      headers.push({ Name: 'List-Unsubscribe', Value: listUnsubscribeParts.join(', ') });
      if (rendered.oneClickUnsubscribeUrl) {
        headers.push({ Name: 'List-Unsubscribe-Post', Value: 'List-Unsubscribe=One-Click' });
      }
    }

    const message: Parameters<ServerClient['sendEmail']>[0] = {
      From: from,
      To: rendered.toEmail,
      Subject: rendered.subject,
      HtmlBody: rendered.htmlBody,
      TextBody: rendered.textBody,
      MessageStream: 'outbound',
      Tag: 'newsletter-campaign',
      Metadata: {
        campaignId: clean(input.campaignId),
        ...(rendered.preheader ? { preheader: rendered.preheader } : {}),
        ...(input.metadata || {})
      }
    };
    if (headers.length) {
      message.Headers = headers;
    }
    if (rendered.attachments.length) {
      message.Attachments = rendered.attachments;
    }
    const response = await (transport ? transport(message) : client.sendEmail(message));
    const messageId = clean((response as { MessageID?: string }).MessageID);
    if (!messageId) return { ok: false, messageId: '', error: 'Provider acceptance could not be confirmed.', ambiguous: true };
    return { ok: true, messageId, error: '' };
  } catch (error) {
    return {
      ok: false,
      messageId: '',
      error: error instanceof Error ? error.message : 'postmark-send-failed',
      ambiguous: true
    };
  }
}

export async function renderNewsletterCampaignEmail(
  input: SendNewsletterCampaignEmailInput,
  options?: RenderNewsletterCampaignEmailOptions
): Promise<RenderNewsletterCampaignEmailResult | null> {
  const recipient = normalizeEmail(input.to);
  if (!recipient) return null;

  const firstName = toFirstName(input.firstName) || 'there';
  const unsubscribeUrl = buildUnsubscribeUrl(recipient, input.campaignId);
  const oneClickUnsubscribeUrl = buildOneClickUnsubscribeUrl(recipient, input.campaignId);
  const appUrl = resolveNewsletterBaseUrl();
  const siteName = resolveSiteName();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const values = {
    '{{firstName}}': firstName,
    '{{email}}': recipient,
    '{{siteName}}': siteName,
    '{{appUrl}}': appUrl,
    '{{logoUrl}}': logoUrl,
    '{{subject}}': clean(input.subject),
    '{{preheader}}': clean(input.preheader),
    '{{unsubscribeUrl}}': unsubscribeUrl
  };

  const subject = applyTemplateValues(input.subject, values);
  const heading = formatNewsletterHeading(subject) || subject;
  const headingSize = resolveHeadingSize(heading);
  const preheader = applyTemplateValues(input.preheader || '', values);
  const htmlValues = Object.fromEntries(Object.entries(values).map(([key, value]) => [key, escapeHtml(value)]));
  const htmlBase = applyTemplateValues(input.htmlBody || '', htmlValues);
  const textBase = applyTemplateValues(input.textBody || '', values);
  const resolved = input.prepared
    ? { htmlBody: applyTemplateValues(input.prepared.htmlBody, htmlValues), textBody: applyTemplateValues(input.prepared.textBody, values) }
    : await resolveNewsletterHighlightDirectives({ htmlBody: htmlBase, textBody: textBase, appUrl });

  const htmlWithPreheader =
    preheader && !resolved.htmlBody.includes(preheader)
      ? `<p style="margin:0 0 10px 0;font-size:12px;line-height:18px;color:#4b5563">${escapeHtml(preheader)}</p>${resolved.htmlBody}`
      : resolved.htmlBody;
  const textWithPreheader =
    preheader && !resolved.textBody.includes(preheader) ? `${preheader}\n\n${resolved.textBody}` : resolved.textBody;
  const socialBaseUrl = appUrl.replace(/\/+$/, '');
  const inlineIcons = options?.inlineSocialIcons !== false;
  const { attachments, iconSrcByLabel } = inlineIcons
    ? input.prepared?.icons || await loadInlineSocialIconAttachments()
    : { attachments: [], iconSrcByLabel: {} as Record<string, string> };
  const isFullHtmlDocument = /<html[\s>]|<body[\s>]/i.test(htmlWithPreheader);
  const htmlBody = isFullHtmlDocument
    ? withHtmlFooter(htmlWithPreheader, unsubscribeUrl, { baseUrl: socialBaseUrl, iconSrcByLabel })
    : buildBrandedEmailHtml({
        previewText: preheader || subject,
        heading,
        siteName,
        appUrl,
        logoUrl,
        bodyHtml: withHtmlFooter(htmlWithPreheader, unsubscribeUrl, { baseUrl: socialBaseUrl, iconSrcByLabel }),
        headingFontSizePx: headingSize.fontSize,
        headingLineHeightPx: headingSize.lineHeight
      });
  const textBody = withTextFooter(textWithPreheader, unsubscribeUrl);
  const allAttachments = [...attachments, ...(input.prepared?.attachments || [])];
  assertNewsletterMessageSize({ htmlBody, textBody, subject, attachments: allAttachments });

  return {
    toEmail: recipient,
    subject,
    preheader,
    htmlBody,
    textBody,
    unsubscribeUrl,
    oneClickUnsubscribeUrl,
    attachments: allAttachments
  };
}

export type PreparedNewsletterEmail = {
  htmlBody: string;
  textBody: string;
  attachments: PostmarkAttachment[];
  icons: Awaited<ReturnType<typeof loadInlineSocialIconAttachments>>;
};

/** Resolve shared body directives and read icon files once per batch. */
export async function prepareNewsletterCampaignEmail(
  input: { htmlBody: string; textBody: string; attachments?: PostmarkAttachment[] },
  loadIcons = loadInlineSocialIconAttachments
): Promise<PreparedNewsletterEmail> {
  const appUrl = resolveNewsletterBaseUrl();
  if (input.htmlBody.includes('/api/newsletter/media/')) {
    let valid = false;
    try { const url = new URL(appUrl); valid = url.protocol === 'https:' && !url.username && !url.password; } catch { /* Missing origin is an actionable configuration error. */ }
    if (!valid) throw new Error('Configure this site’s public HTTPS origin before previewing or sending newsletter images.');
  }
  const resolved = await resolveNewsletterHighlightDirectives({ htmlBody: input.htmlBody, textBody: input.textBody, appUrl });
  const icons = await loadIcons();
  const attachments = input.attachments || [];
  assertNewsletterMessageSize({ ...resolved, attachments: [...icons.attachments, ...attachments] });
  return { ...resolved, attachments, icons };
}
