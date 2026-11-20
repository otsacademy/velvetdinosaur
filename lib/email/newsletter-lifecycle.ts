import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/newsletter-lifecycle.ts');

import { render } from '@react-email/render';
import { NewsletterSubscribeConfirmationEmail } from '@/components/email/newsletter-subscribe-confirmation-email';
import { NewsletterSubscriptionVerificationEmail } from '@/components/email/newsletter-subscription-verification-email';
import { NewsletterUnsubscribeConfirmationEmail } from '@/components/email/newsletter-unsubscribe-confirmation-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName, resolveTeamName } from '@/lib/email-branding';
import { createNewsletterUnsubscribeToken } from '@/lib/newsletter/unsubscribe-token';
import { renderTemplateWithStoredOverrides } from '@/lib/system-email-templates';

import { sendPostmarkEmail } from './postmark';

function normalizeNonEmpty(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || '';
}

function normalizeBaseUrl(value: string | undefined | null) {
  const trimmed = normalizeNonEmpty(value);
  return trimmed.replace(/\/+$/, '');
}

function resolveFirstName(inputFirstName: string | undefined | null) {
  const firstName = normalizeNonEmpty(inputFirstName);
  if (!firstName) return '';
  return firstName.split(/\s+/).find(Boolean) || '';
}

function resolveNewsletterSignupUrl(appUrl: string) {
  const base = normalizeBaseUrl(appUrl);
  if (!base) return '/connect#newsletter';
  return `${base}/connect#newsletter`;
}

function resolveNewsletterConfirmUrl(appUrl: string, token: string) {
  const base = normalizeBaseUrl(appUrl);
  if (!base) return '';
  return `${base}/newsletter/confirm?token=${encodeURIComponent(token)}`;
}

function buildUnsubscribeUrl(email: string, appUrl: string) {
  const token = createNewsletterUnsubscribeToken({ email });
  if (!token) return '';
  const base = normalizeBaseUrl(appUrl);
  if (!base) return '';
  return `${base}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

export async function sendNewsletterSubscribeConfirmationEmail(input: {
  email: string;
  firstName?: string | null;
}) {
  const recipientEmail = normalizeNonEmpty(input.email).toLowerCase();
  if (!recipientEmail.includes('@')) throw new Error('Invalid recipient');

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const firstName = resolveFirstName(input.firstName);
  const fallbackFirstName = firstName || 'there';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const preferencesUrl = resolveNewsletterSignupUrl(appUrl);
  const unsubscribeUrl = buildUnsubscribeUrl(recipientEmail, appUrl) || preferencesUrl;
  const subject = `You are subscribed to ${siteName} updates`;

  const htmlBody = await render(
    NewsletterSubscribeConfirmationEmail({
      subject,
      firstName: firstName || undefined,
      siteName,
      appUrl,
      logoUrl,
      preferencesUrl,
      unsubscribeUrl
    })
  );

  const textBody = [
    greeting,
    '',
    `Thank you for subscribing to updates from ${siteName}.`,
    'We are glad to keep you informed about our news and events.',
    '',
    `If you prefer to stop receiving updates, you can unsubscribe here: ${unsubscribeUrl}`,
    '',
    'Best,',
    `The ${siteName} team`
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'newsletter-subscribe-confirmation',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': fallbackFirstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl,
      '{{preferencesUrl}}': preferencesUrl,
      '{{unsubscribeUrl}}': unsubscribeUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  return sendPostmarkEmail({ to: recipientEmail, subject, htmlBody: resolvedTemplate.html, textBody: resolvedTemplate.text,
    fromName: resolveTeamName(siteName)
  });
}

export async function sendNewsletterSubscriptionVerificationEmail(input: {
  email: string;
  firstName?: string | null;
  token: string;
  expiresInHours: number;
}) {
  const recipientEmail = normalizeNonEmpty(input.email).toLowerCase();
  if (!recipientEmail.includes('@')) throw new Error('Invalid recipient');
  const token = normalizeNonEmpty(input.token);
  if (!token) throw new Error('Missing confirmation token');

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const firstName = resolveFirstName(input.firstName);
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const expiresInHours = Math.max(1, Math.round(Number(input.expiresInHours || 24)));
  const confirmUrl = resolveNewsletterConfirmUrl(appUrl, token);
  if (!confirmUrl) throw new Error('Missing confirmation URL');
  const subject = `Please confirm your ${siteName} newsletter subscription`;

  const htmlBody = await render(
    NewsletterSubscriptionVerificationEmail({
      subject,
      firstName: firstName || undefined,
      siteName,
      appUrl,
      logoUrl,
      confirmUrl,
      expiresInHours
    })
  );

  const textBody = [
    greeting,
    '',
    `Please confirm your email address to receive newsletter updates from ${siteName}.`,
    `Confirm here: ${confirmUrl}`,
    '',
    `This confirmation link expires in approximately ${expiresInHours} hour${expiresInHours === 1 ? '' : 's'}.`,
    '',
    'Best,',
    `The ${siteName} team`
  ].join('\n');

  return sendPostmarkEmail({ to: recipientEmail, subject, htmlBody, textBody,
    fromName: resolveTeamName(siteName)
  });
}

export async function sendNewsletterUnsubscribeConfirmationEmail(input: {
  email: string;
  firstName?: string | null;
}) {
  const recipientEmail = normalizeNonEmpty(input.email).toLowerCase();
  if (!recipientEmail.includes('@')) throw new Error('Invalid recipient');

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const firstName = resolveFirstName(input.firstName);
  const fallbackFirstName = firstName || 'there';
  const greeting = firstName ? `Hi ${firstName},` : 'Hello,';
  const resubscribeUrl = resolveNewsletterSignupUrl(appUrl);
  const subject = `You are unsubscribed from ${siteName} updates`;

  const htmlBody = await render(
    NewsletterUnsubscribeConfirmationEmail({
      subject,
      firstName: fallbackFirstName,
      siteName,
      appUrl,
      logoUrl,
      resubscribeUrl
    })
  );

  const textBody = [
    greeting,
    '',
    `We have processed your request and you are unsubscribed from newsletter updates from ${siteName}.`,
    'We are sorry to see you go, and we appreciate your time with our community.',
    '',
    `If you change your mind, you can subscribe again from our newsletter page: ${resubscribeUrl}`,
    'If this was not requested by you, please reply to this email so we can help right away.',
    '',
    'Best,',
    `The ${siteName} team`
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'newsletter-unsubscribe-confirmation',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': fallbackFirstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl,
      '{{resubscribeUrl}}': resubscribeUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  return sendPostmarkEmail({ to: recipientEmail, subject, htmlBody: resolvedTemplate.html, textBody: resolvedTemplate.text,
    fromName: resolveTeamName(siteName)
  });
}
