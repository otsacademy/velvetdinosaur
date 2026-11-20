import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { EmailNotification } from '@/models/EmailNotification';
import { EventRegistrationDelivery } from '@/models/EventRegistrationDelivery';
import { EventRegistrationCampaign } from '@/models/EventRegistrationCampaign';

// Confirmation and receipt emails held in the outbox (lib/email/notification-outbox.ts),
// and event campaign deliveries whose Postmark outcome is unclear: still queued, failed,
// or waiting for a person to check Postmark before any retry.
const noStore = { 'Cache-Control': 'private, no-store' };
export async function GET(request: Request) {
  if (!await requireAdminFromHeaders(request.headers)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  await requireNewsletterDatabase();
  const [notifications, events, counts] = await Promise.all([
    EmailNotification.find({ status: { $in: ['failed', 'needs_review', 'pending', 'processing'] } })
      .select({ kind: 1, 'payload.email': 1, status: 1, attempts: 1, error: 1, messageId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).lean(),
    EventRegistrationDelivery.find({ status: 'needs_review' }).select({ email: 1, status: 1, error: 1, attempts: 1, postmarkMessageId: 1, createdAt: 1 }).sort({ createdAt: -1 }).limit(100).lean(),
    EmailNotification.aggregate<{ _id: string; count: number }>([{ $group: { _id: '$status', count: { $sum: 1 } } }])
  ]);
  const items = [
    ...notifications.map((row) => ({ id: String(row._id), resource: 'notification', kind: row.kind, email: row.payload?.email || '', status: row.status, error: row.error, attempts: row.attempts })),
    ...events.map((row) => ({ id: String(row._id), resource: 'event-campaign', kind: 'event-campaign', email: row.email, status: row.status, error: row.error, attempts: row.attempts }))
  ];
  return NextResponse.json({ items, counts: Object.fromEntries(counts.map((row) => [row._id, row.count])) }, { headers: noStore });
}

const Review = z.object({ id: z.string().regex(/^[a-f\d]{24}$/i), resource: z.enum(['notification', 'event-campaign']),
  resolution: z.enum(['accepted', 'not-accepted']), evidence: z.string().trim().min(8).max(1000), messageId: z.string().trim().max(200).optional() });
export async function PATCH(request: Request) {
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const parsed = Review.safeParse(await request.json().catch(() => null));
  if (!parsed.success || (parsed.data.resolution === 'accepted' && !parsed.data.messageId)) {
    return NextResponse.json({ error: 'Record your Postmark check and the message ID for accepted mail.' }, { status: 400 });
  }
  await requireNewsletterDatabase();
  const { id, resource, resolution, evidence, messageId } = parsed.data;
  const accepted = resolution === 'accepted';
  const update = { status: accepted ? 'sent' : 'pending', error: '', claimToken: null,
    reviewedBy: admin.id, reviewNote: evidence, reviewedAt: new Date(),
    ...(accepted ? { sentAt: new Date() } : { availableAt: new Date() }) };
  if (resource === 'notification') {
    const result = await EmailNotification.updateOne({ _id: id, status: { $in: ['needs_review', 'failed'] } }, { $set: { ...update, messageId: messageId || '' } });
    if (!result.matchedCount) return NextResponse.json({ error: 'Delivery changed. Refresh before reviewing.' }, { status: 409 });
  } else {
    const session = await EventRegistrationCampaign.startSession();
    try {
      const changed = await session.withTransaction(async () => {
        const row = await EventRegistrationDelivery.findOneAndUpdate({ _id: id, status: 'needs_review' }, { $set: { ...update, postmarkMessageId: messageId || '' } }, { new: true, session }).lean() as { campaignId?: string } | null;
        if (!row) return false;
        const needsReviewCount = await EventRegistrationDelivery.countDocuments({ campaignId: row.campaignId, status: 'needs_review' }).session(session);
        await EventRegistrationCampaign.updateOne({ _id: row.campaignId }, { $set: { needsReviewCount, lastError: needsReviewCount ? 'Delivery outcomes need review.' : '' } }, { session });
        return true;
      });
      if (!changed) return NextResponse.json({ error: 'Delivery changed. Refresh before reviewing.' }, { status: 409 });
    } finally { await session.endSession(); }
  }
  return NextResponse.json({ ok: true }, { headers: noStore });
}
