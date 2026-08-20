import { render } from '@react-email/render';
import { GoogleAccountStatusEmail } from '@/components/email/google-account-status-email';
import { resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { renderTemplateWithStoredOverrides } from '@/lib/system-email-templates';

type UserLike = {
  id: string;
  email: string;
  name?: string | null;
};

type GoogleAccountStatusPayload = {
  user: UserLike;
  siteName?: string;
  appUrl?: string;
  logoUrl?: string;
};

const POSTMARK_API = 'https://api.postmarkapp.com/email';
const DEFAULT_FROM_NAME = 'The ASAP Global Team';

function normalizeNonEmpty(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || '';
}

function normalizeBaseUrl(value: string | undefined | null) {
  return normalizeNonEmpty(value).replace(/\/+$/, '');
}

function resolveAccountStatusAppUrl(payload: GoogleAccountStatusPayload) {
  return (
    normalizeBaseUrl(payload.appUrl) ||
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.PUBLIC_BASE_URL)
  );
}

function inferFirstNameFromEmail(email: string) {
  const localPart = (email.split('@')[0] || '').toLowerCase();
  const cleaned = localPart.replace(/[._-]+/g, ' ').replace(/\d+/g, ' ').trim();
  const [first = ''] = cleaned.split(/\s+/);
  if (!first) return 'there';
  return `${first.charAt(0).toUpperCase()}${first.slice(1)}`;
}

function inferFirstNameFromNameOrEmail(name: string | undefined | null, email: string) {
  const normalizedName = normalizeNonEmpty(name);
  if (normalizedName) {
    const [first = ''] = normalizedName.split(/\s+/);
    if (first) return first;
  }
  return inferFirstNameFromEmail(email);
}

function extractEmailAddress(from: string) {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim();
}

function formatFromAddress(from: string, fromName?: string) {
  const name = normalizeNonEmpty(fromName);
  if (!name) return from;
  const email = extractEmailAddress(from);
  return `${name} <${email}>`;
}

function getPostmarkConfig() {
  const token = process.env.POSTMARK_SERVER_TOKEN;
  const from =
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    'hello@example.com';
  return { token: token?.trim() || '', from: from.trim() };
}

async function sendPostmark(to: string, subject: string, htmlBody: string, textBody: string) {
  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    console.warn('[postmark] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; logging instead');
    console.info({ to, subject, htmlBody, textBody, fromName: DEFAULT_FROM_NAME });
    return;
  }

  const response = await fetch(POSTMARK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token
    },
    body: JSON.stringify({
      From: formatFromAddress(from, DEFAULT_FROM_NAME),
      To: to,
      Subject: subject,
      HtmlBody: htmlBody,
      TextBody: textBody,
      MessageStream: 'outbound'
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[postmark] send failed', response.status, body);
  }
}

export async function sendGoogleAccountLinkedEmail(payload: GoogleAccountStatusPayload) {
  const recipientEmail = normalizeNonEmpty(payload.user.email).toLowerCase();
  const siteName = resolveSiteName(payload.siteName);
  const appUrl = resolveAccountStatusAppUrl(payload);
  const logoUrl = resolveLogoUrl(payload.logoUrl, appUrl);
  const firstName = inferFirstNameFromNameOrEmail(payload.user.name, recipientEmail);
  const subject = 'Your Google account is linked to ASAP';
  const htmlBody = await render(
    GoogleAccountStatusEmail({
      subject,
      firstName,
      siteName,
      appUrl,
      logoUrl,
      status: 'linked'
    })
  );

  const textBody = [
    `Hi ${firstName},`,
    '',
    'Your Google account has been successfully linked to your Academics Stand Against Poverty profile.',
    'Going forward, you can simply use the "Log in with Google" button on the sign-in page for faster access to the platform.',
    'If you ever need to manage or remove this connection, you can unlink your Google account at any time from the Accounts page in your dashboard.',
    'If you did not authorize this change, please let us know immediately by replying to this email so we can secure your account.',
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'google-linked',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': firstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text);
}

export async function sendGoogleAccountUnlinkedEmail(payload: GoogleAccountStatusPayload) {
  const recipientEmail = normalizeNonEmpty(payload.user.email).toLowerCase();
  const siteName = resolveSiteName(payload.siteName);
  const appUrl = resolveAccountStatusAppUrl(payload);
  const logoUrl = resolveLogoUrl(payload.logoUrl, appUrl);
  const firstName = inferFirstNameFromNameOrEmail(payload.user.name, recipientEmail);
  const subject = 'Your Google account is unlinked from ASAP';
  const htmlBody = await render(
    GoogleAccountStatusEmail({
      subject,
      firstName,
      siteName,
      appUrl,
      logoUrl,
      status: 'unlinked'
    })
  );

  const textBody = [
    `Hi ${firstName},`,
    '',
    'Your Google account has been successfully unlinked from your Academics Stand Against Poverty profile.',
    'You will no longer be able to use the "Log in with Google" button. Going forward, please use your registered email address and password to sign in to the platform.',
    'If you ever want to reconnect your account, you can do so at any time from the Accounts page in your dashboard.',
    'If you did not authorize this change, please reply to this email immediately so we can secure your account.',
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'google-unlinked',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': firstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmark(recipientEmail, subject, resolvedTemplate.html, resolvedTemplate.text);
}
