import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import {
  sendNewsletterSubscribeConfirmationEmail,
  sendNewsletterUnsubscribeConfirmationEmail
} from '@/lib/email/newsletter-lifecycle';
import {
  ensureNewsletterPreferenceForUser,
  getNewsletterPreferenceForUser,
  setNewsletterConsentForUser
} from '@/lib/newsletter/consent';
import { clean } from '@/lib/newsletter/shared';

const UpdateSchema = z.object({
  subscribed: z.boolean(),
  source: z.string().trim().max(120).optional(),
  legalTextVersion: z.string().trim().max(32).optional()
});

function parseClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for') || '';
  const first = forwarded.split(',').map((part) => part.trim()).find(Boolean);
  return first || request.headers.get('x-real-ip') || '';
}

async function requireSessionUser(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const rawUser = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  const userId = clean(rawUser?.id);
  const email = clean(rawUser?.email).toLowerCase();
  if (!userId || !email) return null;
  return {
    id: userId,
    email,
    name: clean(rawUser?.name)
  };
}

export async function GET(request: Request) {
  unstable_noStore();
  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const preference = await ensureNewsletterPreferenceForUser({
    userId: user.id,
    email: user.email,
    firstName: user.name
  });
  return NextResponse.json({ preference });
}

export async function PATCH(request: Request) {
  unstable_noStore();
  const user = await requireSessionUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const prior = await getNewsletterPreferenceForUser(user.id);
  const preference = await setNewsletterConsentForUser({
    userId: user.id,
    email: user.email,
    firstName: user.name,
    status: parsed.data.subscribed ? 'subscribed' : 'unsubscribed',
    source: parsed.data.source || 'account-communications',
    legalTextVersion: parsed.data.legalTextVersion || 'v1',
    actorType: 'user',
    actorId: user.id,
    ip: parseClientIp(request),
    userAgent: request.headers.get('user-agent') || ''
  });

  const becameSubscribed = prior?.status !== 'subscribed' && preference?.status === 'subscribed';
  const becameUnsubscribed = prior?.status !== 'unsubscribed' && preference?.status === 'unsubscribed';

  if (becameSubscribed) {
    void sendNewsletterSubscribeConfirmationEmail({
      email: user.email,
      firstName: user.name
    }).catch((error) => {
      console.error('[newsletter] subscribe confirmation send failed', error);
    });
  }

  if (becameUnsubscribed) {
    void sendNewsletterUnsubscribeConfirmationEmail({
      email: user.email,
      firstName: user.name
    }).catch((error) => {
      console.error('[newsletter] unsubscribe confirmation send failed', error);
    });
  }

  return NextResponse.json({ preference });
}

export async function POST(request: Request) {
  return PATCH(request);
}
