import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/event-registration-lifecycle.ts');

import { render } from '@react-email/render';
import { EventRegistrationConfirmationEmail } from '@/components/email/event-registration-confirmation-email';
import { EventRegistrationVerificationEmail } from '@/components/email/event-registration-verification-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { sendPostmarkEmail } from '@/lib/email/postmark';
import { renderTemplateWithStoredOverrides } from '@/lib/system-email-templates';

const DEFAULT_FROM_NAME = 'The ASAP Global Team';

function normalizeNonEmpty(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || '';
}

function normalizeBaseUrl(value: string | undefined | null) {
  return normalizeNonEmpty(value).replace(/\/+$/, '');
}

function resolveFirstName(inputFirstName: string | undefined | null) {
  const firstName = normalizeNonEmpty(inputFirstName);
  if (!firstName) return '';
  return firstName.split(/\s+/).find(Boolean) || '';
}

function buildEventUrl(appUrl: string, eventSlug: string) {
  const base = normalizeBaseUrl(appUrl);
  const slug = normalizeNonEmpty(eventSlug);
  if (!base || !slug) return '';
  return `${base}/events/${encodeURIComponent(slug)}`;
}

function buildConfirmUrl(appUrl: string, token: string) {
  const base = normalizeBaseUrl(appUrl);
  const resolvedToken = normalizeNonEmpty(token);
  if (!base || !resolvedToken) return '';
  return `${base}/events/registration/confirm?token=${encodeURIComponent(resolvedToken)}`;
}

export async function sendEventRegistrationVerificationEmail(input: {
  email: string;
  firstName?: string | null;
  eventTitle: string;
  eventSlug: string;
  eventDateLabel: string;
  eventLocation: string;
  token: string;
  expiresInHours: number;
}) {
  const recipientEmail = normalizeNonEmpty(input.email).toLowerCase();
  if (!recipientEmail.includes('@')) return;

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const firstName = resolveFirstName(input.firstName);
  const fallbackFirstName = firstName || 'there';
  const confirmUrl = buildConfirmUrl(appUrl, input.token);
  if (!confirmUrl) return;
  const subject = `Please confirm your registration for ${normalizeNonEmpty(input.eventTitle) || siteName}`;

  const htmlBody = await render(
    EventRegistrationVerificationEmail({
      subject,
      firstName: firstName || undefined,
      siteName,
      appUrl,
      logoUrl,
      eventTitle: normalizeNonEmpty(input.eventTitle),
      eventDateLabel: normalizeNonEmpty(input.eventDateLabel),
      eventLocation: normalizeNonEmpty(input.eventLocation),
      confirmUrl,
      expiresInHours: Math.max(1, Math.round(input.expiresInHours || 24))
    })
  );

  const textBody = [
    firstName ? `Hi ${firstName},` : 'Hello,',
    '',
    `Please confirm your place for ${normalizeNonEmpty(input.eventTitle)}.`,
    `When: ${normalizeNonEmpty(input.eventDateLabel)}`,
    `Where: ${normalizeNonEmpty(input.eventLocation)}`,
    '',
    `Confirm here: ${confirmUrl}`,
    '',
    `This confirmation link expires in approximately ${Math.max(1, Math.round(input.expiresInHours || 24))} hour${Math.max(1, Math.round(input.expiresInHours || 24)) === 1 ? '' : 's'}.`,
    '',
    'Best,',
    'The ASAP Global Team'
  ].join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'event-registration-verification',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': fallbackFirstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl,
      '{{eventTitle}}': normalizeNonEmpty(input.eventTitle),
      '{{eventDate}}': normalizeNonEmpty(input.eventDateLabel),
      '{{eventLocation}}': normalizeNonEmpty(input.eventLocation),
      '{{confirmUrl}}': confirmUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmarkEmail({
    to: recipientEmail,
    subject,
    htmlBody: resolvedTemplate.html,
    textBody: resolvedTemplate.text,
    fromName: DEFAULT_FROM_NAME,
    tag: 'event-registration-verification',
    metadata: {
      eventSlug: normalizeNonEmpty(input.eventSlug)
    }
  });
}

export async function sendEventRegistrationConfirmationEmail(input: {
  email: string;
  firstName?: string | null;
  eventTitle: string;
  eventSlug: string;
  eventDateLabel: string;
  eventLocation: string;
}) {
  const recipientEmail = normalizeNonEmpty(input.email).toLowerCase();
  if (!recipientEmail.includes('@')) return;

  const siteName = resolveSiteName();
  const appUrl = resolveDefaultAppUrl();
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const firstName = resolveFirstName(input.firstName);
  const fallbackFirstName = firstName || 'there';
  const eventUrl = buildEventUrl(appUrl, input.eventSlug);
  const subject = `Your place is confirmed for ${normalizeNonEmpty(input.eventTitle) || siteName}`;

  const htmlBody = await render(
    EventRegistrationConfirmationEmail({
      subject,
      firstName: firstName || undefined,
      siteName,
      appUrl,
      logoUrl,
      eventTitle: normalizeNonEmpty(input.eventTitle),
      eventDateLabel: normalizeNonEmpty(input.eventDateLabel),
      eventLocation: normalizeNonEmpty(input.eventLocation),
      eventUrl: eventUrl || appUrl || '/'
    })
  );

  const textBody = [
    firstName ? `Hi ${firstName},` : 'Hello,',
    '',
    `Thank you for confirming your participation in ${normalizeNonEmpty(input.eventTitle)}.`,
    `When: ${normalizeNonEmpty(input.eventDateLabel)}`,
    `Where: ${normalizeNonEmpty(input.eventLocation)}`,
    '',
    eventUrl ? `View the event details: ${eventUrl}` : '',
    '',
    'We will send any event-specific updates to this email address.',
    '',
    'Best,',
    'The ASAP Global Team'
  ]
    .filter(Boolean)
    .join('\n');

  const resolvedTemplate = await renderTemplateWithStoredOverrides({
    key: 'event-registration-confirmation',
    values: {
      '{{subject}}': subject,
      '{{firstName}}': fallbackFirstName,
      '{{siteName}}': siteName,
      '{{appUrl}}': appUrl,
      '{{logoUrl}}': logoUrl,
      '{{eventTitle}}': normalizeNonEmpty(input.eventTitle),
      '{{eventDate}}': normalizeNonEmpty(input.eventDateLabel),
      '{{eventLocation}}': normalizeNonEmpty(input.eventLocation),
      '{{eventUrl}}': eventUrl
    },
    fallbackHtml: htmlBody,
    fallbackText: textBody
  });

  await sendPostmarkEmail({
    to: recipientEmail,
    subject,
    htmlBody: resolvedTemplate.html,
    textBody: resolvedTemplate.text,
    fromName: DEFAULT_FROM_NAME,
    tag: 'event-registration-confirmation',
    metadata: {
      eventSlug: normalizeNonEmpty(input.eventSlug)
    }
  });
}
