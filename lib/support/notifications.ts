import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/notifications.ts');

const POSTMARK_API = 'https://api.postmarkapp.com/email';

type SupportNotificationInput = {
  ticketRef: string;
  organization: string;
  subject: string;
  categoryLabel: string;
  priorityLabel: string;
  moduleLabel: string;
  requestedDate: string | null;
  pageUrl: string;
  descriptionText: string;
  requesterName: string;
  requesterEmail: string;
  portalUrl: string;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toIsoDate(value: string | null) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  return parsed.toISOString().slice(0, 10);
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

function resolveRecipients() {
  const configured = clean(process.env.VD_SUPPORT_NOTIFICATION_TO);
  if (configured) {
    return configured
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .join(',');
  }
  return 'support@velvetdinosaur.com';
}

function formatText(input: SupportNotificationInput) {
  return [
    `New support request: ${input.ticketRef}`,
    '',
    `Subject: ${input.subject}`,
    `Requested by: ${input.requesterName || 'Customer'} <${input.requesterEmail}>`,
    `Site: ${input.organization}`,
    `Category: ${input.categoryLabel}`,
    `Priority: ${input.priorityLabel}`,
    `Website area: ${input.moduleLabel}`,
    `Requested date: ${toIsoDate(input.requestedDate) || 'Not specified'}`,
    `Page URL: ${input.pageUrl || 'Not provided'}`,
    '',
    'Details:',
    input.descriptionText || '(No details)',
    '',
    `Portal link: ${input.portalUrl || '(Unavailable)'}`
  ].join('\n');
}

function formatHtml(input: SupportNotificationInput) {
  const escapedDetails = (input.descriptionText || '(No details)')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.45;color:#111">
      <h2 style="margin:0 0 12px;">New support request: ${input.ticketRef}</h2>
      <p><strong>Subject:</strong> ${input.subject}</p>
      <p><strong>Requested by:</strong> ${input.requesterName || 'Customer'} &lt;${input.requesterEmail}&gt;</p>
      <p><strong>Site:</strong> ${input.organization}</p>
      <p><strong>Category:</strong> ${input.categoryLabel}</p>
      <p><strong>Priority:</strong> ${input.priorityLabel}</p>
      <p><strong>Website area:</strong> ${input.moduleLabel}</p>
      <p><strong>Requested date:</strong> ${toIsoDate(input.requestedDate) || 'Not specified'}</p>
      <p><strong>Page URL:</strong> ${input.pageUrl || 'Not provided'}</p>
      <p><strong>Details:</strong><br/>${escapedDetails}</p>
      <p><strong>Portal link:</strong> ${input.portalUrl || '(Unavailable)'}</p>
    </div>
  `;
}

export async function sendSupportTicketCreatedNotification(input: SupportNotificationInput) {
  const to = resolveRecipients();
  const { token, from } = getPostmarkConfig();
  if (!to) return { sent: false, reason: 'missing-recipient' };
  if (!token || !from) {
    console.warn('[support-notify] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL');
    return { sent: false, reason: 'missing-postmark-config' };
  }

  const subject = `[Support] ${input.ticketRef} ${input.subject}`;
  const response = await fetch(POSTMARK_API, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-postmark-server-token': token
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: subject,
      HtmlBody: formatHtml(input),
      TextBody: formatText(input),
      MessageStream: 'outbound',
      ReplyTo: input.requesterEmail || undefined
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[support-notify] postmark send failed', response.status, body);
    return { sent: false, reason: `http-${response.status}` };
  }

  return { sent: true, reason: '' };
}
