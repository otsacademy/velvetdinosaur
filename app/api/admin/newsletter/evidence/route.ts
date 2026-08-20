import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { listNewsletterDeliveriesForRecipient } from '@/lib/newsletter/campaigns';
import {
  getNewsletterPreferenceByEmail,
  getNewsletterPreferenceForUser,
  listNewsletterConsentEventsForEmail,
  listNewsletterConsentEventsForUser
} from '@/lib/newsletter/consent';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';

function csvCell(value: unknown) {
  const raw = value == null ? '' : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

function buildEvidenceCsv(payload: {
  userId: string;
  email: string;
  preference: Awaited<ReturnType<typeof getNewsletterPreferenceForUser>>;
  events: Awaited<ReturnType<typeof listNewsletterConsentEventsForUser>>;
  deliveries: Awaited<ReturnType<typeof listNewsletterDeliveriesForRecipient>>;
}) {
  const lines: string[] = [];
  lines.push('Section,Field,Value');
  lines.push(`summary,userId,${csvCell(payload.userId)}`);
  lines.push(`summary,email,${csvCell(payload.email)}`);
  lines.push(`summary,status,${csvCell(payload.preference?.status || 'unknown')}`);
  lines.push(`summary,consentAt,${csvCell(payload.preference?.consentAt || '')}`);
  lines.push(`summary,unsubscribedAt,${csvCell(payload.preference?.unsubscribedAt || '')}`);
  lines.push(`summary,source,${csvCell(payload.preference?.source || '')}`);
  lines.push(`summary,legalTextVersion,${csvCell(payload.preference?.legalTextVersion || '')}`);

  lines.push('');
  lines.push(
    'Consent Events,' +
      [
        'eventId',
        'eventType',
        'source',
        'legalTextVersion',
        'actorType',
        'actorId',
        'ipHash',
        'userAgent',
        'reason',
        'createdAt'
      ].join(',')
  );
  for (const event of payload.events) {
    lines.push(
      [
        'event',
        csvCell(event.id),
        csvCell(event.eventType),
        csvCell(event.source),
        csvCell(event.legalTextVersion),
        csvCell(event.actorType),
        csvCell(event.actorId),
        csvCell(event.ipHash),
        csvCell(event.userAgent),
        csvCell(event.reason),
        csvCell(event.createdAt)
      ].join(',')
    );
  }

  lines.push('');
  lines.push(
    'Deliveries,' +
      ['deliveryId', 'campaignId', 'status', 'sentAt', 'postmarkMessageId', 'error', 'attempts', 'createdAt'].join(',')
  );
  for (const delivery of payload.deliveries) {
    lines.push(
      [
        'delivery',
        csvCell(delivery.id),
        csvCell(delivery.campaignId),
        csvCell(delivery.status),
        csvCell(delivery.sentAt),
        csvCell(delivery.postmarkMessageId),
        csvCell(delivery.error),
        csvCell(delivery.attempts),
        csvCell(delivery.createdAt)
      ].join(',')
    );
  }

  return lines.join('\n');
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const userId = clean(url.searchParams.get('userId'));
  const email = normalizeEmail(url.searchParams.get('email'));
  if (!userId && !email) {
    return NextResponse.json({ error: 'userId or email is required' }, { status: 400 });
  }

  const format = clean(url.searchParams.get('format')) === 'csv' ? 'csv' : 'json';
  const limit = Math.max(1, Math.min(5000, Number(url.searchParams.get('limit') || 1000)));

  const [preference, events, deliveries] = await Promise.all([
    userId ? getNewsletterPreferenceForUser(userId) : getNewsletterPreferenceByEmail(email),
    userId ? listNewsletterConsentEventsForUser(userId, limit) : listNewsletterConsentEventsForEmail(email, limit),
    listNewsletterDeliveriesForRecipient({ userId, email, limit })
  ]);

  const resolvedUserId = userId || preference?.userId || '';
  const resolvedEmail = email || preference?.email || '';

  if (format === 'csv') {
    const csv = buildEvidenceCsv({
      userId: resolvedUserId,
      email: resolvedEmail,
      preference,
      events,
      deliveries
    });
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="newsletter-evidence-${resolvedUserId || resolvedEmail || 'export'}.csv"`
      }
    });
  }

  return NextResponse.json({
    userId: resolvedUserId,
    email: resolvedEmail,
    preference,
    consentEvents: events,
    deliveries
  });
}
