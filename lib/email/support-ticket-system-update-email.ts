import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/email/support-ticket-system-update-email.ts');

import { render } from '@react-email/render';
import { ServerClient } from 'postmark';
import { SupportTicketSystemUpdateEmail } from '@/components/email/support-ticket-system-update-email';
import { resolveDefaultAppUrl, resolveLogoUrl, resolveSiteName } from '@/lib/email-branding';
import { listAdminRecipientEmails } from '@/lib/support/admin-recipients';

type SupportTicketSystemUpdateEmailInput = {
  ticketId: string;
  ticketRef: string;
  ticketSubject: string;
  messageText: string;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampText(value: string, max = 8000) {
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;
}

function normalizeHttpsBaseUrl(raw: string) {
  const value = clean(raw).replace(/\/+$/, '');
  if (!value) return '';
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    parsed.protocol = 'https:';
    parsed.pathname = parsed.pathname.replace(/\/+$/, '');
    return parsed.toString().replace(/\/$/, '');
  } catch {
    return '';
  }
}

function buildTicketUrl(appUrl: string, ticketId: string) {
  const base = normalizeHttpsBaseUrl(appUrl);
  if (!base) return '';
  return `${base}/edit/support?ticketId=${encodeURIComponent(ticketId)}`;
}

function getPostmarkConfig() {
  const token = clean(process.env.POSTMARK_SERVER_TOKEN);
  const from =
    clean(process.env.POSTMARK_FROM_EMAIL) ||
    clean(process.env.EMAIL_FROM) ||
    clean(process.env.NEXT_PUBLIC_EMAIL_FROM) ||
    '';
  return { token, from };
}

export async function sendSupportTicketSystemUpdateEmail(input: SupportTicketSystemUpdateEmailInput) {
  const recipients = await listAdminRecipientEmails();
  if (!recipients.length) {
    return { sent: false, reason: 'missing-admin-recipients', recipients: 0 };
  }

  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    console.warn('[support-update-email] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; skipping send');
    return { sent: false, reason: 'missing-postmark-config', recipients: recipients.length };
  }

  const siteName = resolveSiteName();
  const appUrl = normalizeHttpsBaseUrl(resolveDefaultAppUrl(process.env.BETTERAUTH_URL || ''));
  const logoUrl = resolveLogoUrl(undefined, appUrl);
  const ticketUrl = buildTicketUrl(appUrl, input.ticketId);
  if (!ticketUrl) {
    return { sent: false, reason: 'missing-app-url', recipients: recipients.length };
  }

  const messageText = clampText(clean(input.messageText) || '(No message body provided)');
  const senderName = 'Velvet Dinosaur Support';
  const subject = `[Support Update] ${clean(input.ticketRef)} has a new message`;
  const greeting = 'Hello ASAP admin team,';

  const htmlBody = await render(
    SupportTicketSystemUpdateEmail({
      subject,
      greeting,
      siteName,
      appUrl,
      logoUrl,
      ticketRef: clean(input.ticketRef),
      ticketSubject: clean(input.ticketSubject),
      messageText,
      ticketUrl
    })
  );

  const textBody = [
    greeting,
    '',
    `A new support message has arrived from ${senderName}.`,
    '',
    `Ticket: ${clean(input.ticketRef)}`,
    `Subject: ${clean(input.ticketSubject)}`,
    '',
    'Latest message:',
    messageText,
    '',
    `Open ticket: ${ticketUrl}`,
    '',
    'This notification was sent to admin users only.',
    '',
    'Best,',
    'The ASAP Global Team',
    siteName
  ].join('\n');

  const client = new ServerClient(token);
  await client.sendEmail({
    From: from,
    To: recipients.join(','),
    Subject: subject,
    HtmlBody: htmlBody,
    TextBody: textBody,
    MessageStream: 'outbound'
  });

  return { sent: true, reason: '', recipients: recipients.length };
}
