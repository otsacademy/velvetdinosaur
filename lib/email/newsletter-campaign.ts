import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/newsletter-campaign.ts');

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ServerClient } from 'postmark';
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

type SendNewsletterCampaignEmailInput = {
  to: string;
  firstName?: string;
  subject: string;
  preheader?: string;
  htmlBody: string;
  textBody: string;
  campaignId: string;
  metadata?: Record<string, string>;
};

type SendNewsletterCampaignEmailResult = {
  ok: boolean;
  messageId: string;
  error: string;
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

type PostmarkAttachment = NonNullable<Parameters<ServerClient['sendEmail']>[0]['Attachments']>[number];

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

function resolveBaseUrl() {
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
  const base = resolveBaseUrl().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

function buildOneClickUnsubscribeUrl(email: string, campaignId: string) {
  const token = createNewsletterUnsubscribeToken({ email, campaignId });
  if (!token) return '';
  const base = resolveBaseUrl().replace(/\/+$/, '');
  if (!base) return '';
  return `${base}/api/newsletter/unsubscribe/one-click?token=${encodeURIComponent(token)}`;
}

type SocialLink = {
  label: string;
  href: string;
  iconPath: string;
};

const NEWSLETTER_SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/AcademicsStandAgainstPoverty',
    iconPath: '/images/email-social/facebook.png'
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/academicsstandagainstpoverty',
    iconPath: '/images/email-social/instagram.svg'
  },
  {
    label: 'X (AcademicsStand)',
    href: 'https://x.com/academicsstand',
    iconPath: '/images/email-social/x.png'
  },
  {
    label: 'Bluesky',
    href: 'https://bsky.app/profile/acadsap.bsky.social',
    iconPath: '/images/email-social/bluesky.svg'
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/academics-stand-against-poverty',
    iconPath: '/images/email-social/linkedin.png'
  }
];

async function loadInlineSocialIconAttachments() {
  const attachments: PostmarkAttachment[] = [];
  const iconSrcByLabel: Record<string, string> = {};
  const iconRoot = path.join(process.cwd(), 'public', 'images', 'email-social');

  for (const item of NEWSLETTER_SOCIAL_LINKS) {
    const fileName = item.iconPath.split('/').pop();
    if (!fileName) continue;
    const cid = `vd-social-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const iconPath = path.join(iconRoot, fileName);
    try {
      const content = await readFile(iconPath);
      attachments.push({
        Name: fileName,
        Content: content.toString('base64'),
        ContentType: fileName.toLowerCase().endsWith('.png')
          ? 'image/png'
          : fileName.toLowerCase().endsWith('.svg')
            ? 'image/svg+xml'
            : 'application/octet-stream',
        ContentID: `cid:${cid}`,
        Disposition: 'inline'
      });
      iconSrcByLabel[item.label] = `cid:${cid}`;
    } catch {
      continue;
    }
  }

  return { attachments, iconSrcByLabel };
}

function buildSocialLinksHtml(baseUrl: string, iconSrcByLabel: Record<string, string>) {
  const items = NEWSLETTER_SOCIAL_LINKS.map((item) => {
    const iconUrl = iconSrcByLabel[item.label] || (baseUrl ? `${baseUrl}${item.iconPath}` : item.iconPath);
    return `<a href="${escapeHtml(item.href)}" style="display:inline-block;margin:0 4px" aria-label="${escapeHtml(item.label)}"><img src="${escapeHtml(iconUrl)}" width="18" height="18" alt="${escapeHtml(item.label)}" style="display:block;border:0;width:18px;height:18px" /></a>`;
  }).join('');
  return `<div style="margin:12px 0 0 0;text-align:left"><p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#6b7280">Follow us</p><div style="margin:0">${items}</div></div>`;
}

function buildSocialLinksText() {
  return `Follow us: ${NEWSLETTER_SOCIAL_LINKS.map((item) => `${item.label}: ${item.href}`).join(' | ')}`;
}

function withHtmlFooter(
  html: string,
  unsubscribeUrl: string,
  options: { baseUrl: string; iconSrcByLabel: Record<string, string> }
) {
  if (!unsubscribeUrl) return html;
  if (html.includes('{{unsubscribeUrl}}') || html.includes(unsubscribeUrl)) return html;
  const socialHtml = buildSocialLinksHtml(options.baseUrl, options.iconSrcByLabel);
  const footer =
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />' +
    `<p style="margin:0;font-size:12px;line-height:18px;color:#6b7280">You are receiving this email because you opted in to updates. <a href="${unsubscribeUrl}" style="color:#1f2937">Unsubscribe</a>.</p>` +
    socialHtml;
  if (html.includes('</body>')) return html.replace('</body>', `${footer}</body>`);
  if (html.includes('</html>')) return html.replace('</html>', `${footer}</html>`);
  return `${html}${footer}`;
}

function withTextFooter(text: string, unsubscribeUrl: string) {
  if (!unsubscribeUrl) return text;
  if (text.includes('{{unsubscribeUrl}}') || text.includes(unsubscribeUrl)) return text;
  return `${text}\n\nYou can unsubscribe at any time: ${unsubscribeUrl}\n${buildSocialLinksText()}`;
}

export async function sendNewsletterCampaignEmail(
  input: SendNewsletterCampaignEmailInput
): Promise<SendNewsletterCampaignEmailResult> {
  const recipient = normalizeEmail(input.to);
  if (!recipient) {
    return { ok: false, messageId: '', error: 'missing-recipient' };
  }

  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    return { ok: false, messageId: '', error: 'missing-postmark-config' };
  }

  const rendered = await renderNewsletterCampaignEmail(input, { inlineSocialIcons: true });
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
    const response = await client.sendEmail(message);
    const messageId = clean((response as { MessageID?: string }).MessageID);
    return { ok: true, messageId, error: '' };
  } catch (error) {
    return {
      ok: false,
      messageId: '',
      error: error instanceof Error ? error.message : 'postmark-send-failed'
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
  const appUrl = resolveBaseUrl();
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
  const htmlBase = applyTemplateValues(input.htmlBody || '', values);
  const textBase = applyTemplateValues(input.textBody || '', values);
  const resolved = await resolveNewsletterHighlightDirectives({
    htmlBody: htmlBase,
    textBody: textBase,
    appUrl
  });

  const htmlWithPreheader =
    preheader && !resolved.htmlBody.includes(preheader)
      ? `<p style="margin:0 0 10px 0;font-size:12px;line-height:18px;color:#4b5563">${escapeHtml(preheader)}</p>${resolved.htmlBody}`
      : resolved.htmlBody;
  const textWithPreheader =
    preheader && !resolved.textBody.includes(preheader) ? `${preheader}\n\n${resolved.textBody}` : resolved.textBody;
  const socialBaseUrl = appUrl.replace(/\/+$/, '');
  const inlineIcons = options?.inlineSocialIcons !== false;
  const { attachments, iconSrcByLabel } = inlineIcons
    ? await loadInlineSocialIconAttachments()
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

  return {
    toEmail: recipient,
    subject,
    preheader,
    htmlBody,
    textBody,
    unsubscribeUrl,
    oneClickUnsubscribeUrl,
    attachments
  };
}
