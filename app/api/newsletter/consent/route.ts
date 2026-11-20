import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAuth } from '@/lib/auth';
import {
  ensureNewsletterPreferenceForUser,
  setNewsletterConsentForUser
} from '@/lib/newsletter/consent';
import { clean } from '@/lib/newsletter/shared';
import { getRequestIp } from '@/lib/security/rate-limit';

const UpdateSchema = z.object({
  subscribed: z.boolean(),
  source: z.string().trim().max(120).optional(),
  legalTextVersion: z.string().trim().max(32).optional()
});

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

  const preference = await setNewsletterConsentForUser({
    userId: user.id,
    email: user.email,
    firstName: user.name,
    status: parsed.data.subscribed ? 'subscribed' : 'unsubscribed',
    source: parsed.data.source || 'account-communications',
    legalTextVersion: parsed.data.legalTextVersion || 'v1',
    actorType: 'user',
    actorId: user.id,
    ip: getRequestIp(request.headers),
    notify: true,
    userAgent: request.headers.get('user-agent') || ''
  });

  return NextResponse.json({ preference });
}

export async function POST(request: Request) {
  return PATCH(request);
}
