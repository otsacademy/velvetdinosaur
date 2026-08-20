import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  ensureNewsletterPreferencesForRegisteredUsers,
  listNewsletterPreferences,
  setNewsletterConsentForUser
} from '@/lib/newsletter/consent';
import { requireAdminFromHeaders } from '@/lib/newsletter/auth';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';

const UpdateSchema = z.object({
  userId: z.string().trim().min(1),
  email: z.string().trim().email(),
  firstName: z.string().trim().max(120).optional(),
  subscribed: z.boolean()
});

function parseClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',').map((part) => part.trim()).find(Boolean);
  return first || request.headers.get('x-real-ip') || '';
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureNewsletterPreferencesForRegisteredUsers(10000);
  const url = new URL(request.url);
  const statusRaw = clean(url.searchParams.get('status'));
  const status =
    statusRaw === 'subscribed' ||
    statusRaw === 'unsubscribed' ||
    statusRaw === 'not_consented' ||
    statusRaw === 'pending'
      ? statusRaw
      : 'all';
  const q = clean(url.searchParams.get('q'));
  const limit = Math.max(1, Math.min(1000, Number(url.searchParams.get('limit') || 200)));
  const items = await listNewsletterPreferences({ status, q, limit });
  return NextResponse.json({ items });
}

export async function PATCH(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const updated = await setNewsletterConsentForUser({
    userId: clean(parsed.data.userId),
    email: normalizeEmail(parsed.data.email),
    firstName: clean(parsed.data.firstName),
    status: parsed.data.subscribed ? 'subscribed' : 'unsubscribed',
    source: 'admin-subscriber-update',
    legalTextVersion: 'v1',
    actorType: 'admin',
    actorId: admin.id,
    ip: parseClientIp(request),
    userAgent: request.headers.get('user-agent') || '',
    reason: 'manual-admin-update'
  });

  return NextResponse.json({ item: updated });
}
