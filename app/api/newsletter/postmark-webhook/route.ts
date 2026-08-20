import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { unsubscribeNewsletterByEmail } from '@/lib/newsletter/consent';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';
import { upsertNewsletterSuppression } from '@/lib/newsletter/suppression';

type PostmarkWebhookEvent = {
  RecordType?: string;
  Email?: string;
  Type?: string;
  MessageID?: string;
  Description?: string;
  Details?: string;
  SuppressSending?: boolean;
};

function configuredSecret() {
  return (process.env.POSTMARK_NEWSLETTER_WEBHOOK_SECRET || process.env.POSTMARK_WEBHOOK_SECRET || '').trim();
}

function readProvidedSecret(request: Request, url: URL) {
  const direct = request.headers.get('x-webhook-secret') || request.headers.get('x-postmark-webhook-secret');
  if (direct) return direct.trim();
  const bearer = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(bearer);
  if (match?.[1]) return match[1].trim();
  return clean(url.searchParams.get('secret'));
}

function shouldSuppress(rawType: string, event: PostmarkWebhookEvent) {
  const type = rawType.toLowerCase();
  if (type === 'bounce' || type === 'spamcomplaint') return true;
  if (type === 'subscriptionchange') return Boolean(event.SuppressSending);
  return false;
}

function toEvents(body: unknown): PostmarkWebhookEvent[] {
  if (Array.isArray(body)) return body as PostmarkWebhookEvent[];
  if (body && typeof body === 'object') return [body as PostmarkWebhookEvent];
  return [];
}

export async function POST(request: Request) {
  unstable_noStore();

  const expected = configuredSecret();
  if (!expected) {
    return NextResponse.json({ error: 'Webhook secret is not configured' }, { status: 500 });
  }

  const url = new URL(request.url);
  const provided = readProvidedSecret(request, url);
  if (!provided || provided !== expected) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const events = toEvents(body);

  const summary = {
    received: events.length,
    processed: 0,
    suppressed: 0,
    ignored: 0,
    details: [] as Array<{ email: string; type: string; updated: number }>
  };

  for (const event of events) {
    const email = normalizeEmail(event.Email);
    const type = clean(event.RecordType) || 'unknown';
    if (!email || !shouldSuppress(type, event)) {
      summary.ignored += 1;
      continue;
    }

    const result = await unsubscribeNewsletterByEmail({
      email,
      source: `postmark-webhook:${type.toLowerCase()}`,
      actorType: 'postmark-webhook',
      actorId: clean(event.MessageID),
      reason: clean(event.Type) || clean(event.Description) || clean(event.Details)
    });
    await upsertNewsletterSuppression({
      email,
      source: `postmark-webhook:${type.toLowerCase()}`,
      reason: clean(event.Type) || clean(event.Description) || clean(event.Details),
      eventType: type.toLowerCase(),
      messageId: clean(event.MessageID)
    });
    summary.processed += 1;
    if (result.updated > 0) {
      summary.suppressed += 1;
    }
    summary.details.push({ email, type, updated: result.updated });
  }

  return NextResponse.json(summary);
}
