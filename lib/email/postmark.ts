import { normalizeNonEmpty } from '@/lib/email-branding';

const POSTMARK_API = 'https://api.postmarkapp.com/email';

export type PostmarkHeader = {
  Name: string;
  Value: string;
};

export function getPostmarkConfig() {
  const token = (process.env.POSTMARK_SERVER_TOKEN || '').trim();
  const from = (
    process.env.POSTMARK_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    process.env.NEXT_PUBLIC_EMAIL_FROM ||
    'hello@example.com'
  ).trim();
  return { token, from };
}

export function extractEmailAddress(from: string) {
  const trimmed = from.trim();
  const match = trimmed.match(/<([^>]+)>/);
  return (match?.[1] || trimmed).trim();
}

export function formatFromAddress(from: string, fromName?: string) {
  const name = normalizeNonEmpty(fromName);
  if (!name) return from;
  const email = extractEmailAddress(from);
  return `${name} <${email}>`;
}

export async function sendPostmarkEmail(input: {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  fromName?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
  headers?: PostmarkHeader[];
}) {
  const { token, from } = getPostmarkConfig();
  if (!token || !from) {
    console.warn('[postmark] missing POSTMARK_SERVER_TOKEN or POSTMARK_FROM_EMAIL; logging instead');
    console.info({
      to: input.to,
      subject: input.subject,
      htmlBody: input.htmlBody,
      textBody: input.textBody,
      tag: input.tag,
      metadata: input.metadata,
      headers: input.headers
    });
    return { ok: true, messageId: '' };
  }

  const response = await fetch(POSTMARK_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token
    },
    body: JSON.stringify({
      From: formatFromAddress(from, input.fromName),
      To: input.to,
      Subject: input.subject,
      HtmlBody: input.htmlBody,
      TextBody: input.textBody,
      MessageStream: 'outbound',
      ...(input.replyTo ? { ReplyTo: input.replyTo } : {}),
      ...(input.tag ? { Tag: input.tag } : {}),
      ...(input.metadata ? { Metadata: input.metadata } : {}),
      ...(input.headers?.length ? { Headers: input.headers } : {})
    })
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.error('[postmark] send failed', response.status, body);
    return { ok: false, messageId: '', error: body || `postmark-${response.status}` };
  }

  const payload = (await response.json().catch(() => ({}))) as { MessageID?: string };
  return {
    ok: true,
    messageId: typeof payload.MessageID === 'string' ? payload.MessageID.trim() : '',
    error: ''
  };
}
