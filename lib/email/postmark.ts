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

export type PostmarkEmailInput = {
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  fromName?: string;
  replyTo?: string;
  tag?: string;
  metadata?: Record<string, string>;
  headers?: PostmarkHeader[];
};

export type PostmarkSendResult = { ok: boolean; messageId: string; error: string; ambiguous?: boolean; retryable?: boolean };

export async function sendPostmarkEmail(input: PostmarkEmailInput): Promise<PostmarkSendResult> {
  const { token, from } = getPostmarkConfig();
  if (!token || !from || from.endsWith('@example.com')) {
    return { ok: false, messageId: '', error: 'Email transport is not configured.', retryable: true };
  }
  try {
    const response = await fetch(POSTMARK_API, {
      method: 'POST', signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json', 'X-Postmark-Server-Token': token },
      body: JSON.stringify({
        From: formatFromAddress(from, input.fromName), To: input.to, Subject: input.subject,
        HtmlBody: input.htmlBody, TextBody: input.textBody, MessageStream: 'outbound',
        ...(input.replyTo ? { ReplyTo: input.replyTo } : {}), ...(input.tag ? { Tag: input.tag } : {}),
        ...(input.metadata ? { Metadata: input.metadata } : {}), ...(input.headers?.length ? { Headers: input.headers } : {})
      })
    });
    if (!response.ok) return {
      ok: false, messageId: '', error: `Postmark returned HTTP ${response.status}.`,
      ambiguous: response.status >= 500, retryable: response.status === 429
    };
    const payload = await response.json() as { MessageID?: string; ErrorCode?: number };
    if (payload.ErrorCode !== 0 || !payload.MessageID?.trim()) {
      return { ok: false, messageId: '', error: 'Postmark did not acknowledge the message.', ambiguous: true };
    }
    return { ok: true, messageId: payload.MessageID.trim(), error: '' };
  } catch {
    // A timeout cannot tell us whether Postmark accepted the message.
    return { ok: false, messageId: '', error: 'Delivery outcome is uncertain; check Postmark activity.', ambiguous: true };
  }
}
