import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { sendInviteEmail } from '@/lib/email';
import { createInvite } from '@/lib/invites';
import { requireAdmin } from '@/lib/roles';
import { Invite } from '@/models/Invite';

function inferBaseURL(request: Request) {
  const url = new URL(request.url);
  const envBase = process.env.NEXT_PUBLIC_BASE_URL || process.env.PUBLIC_BASE_URL || '';
  return envBase || `${url.protocol}//${url.host}`;
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  if (!session || !(await requireAdmin(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await connectDB();
  const invites = await Invite.find({})
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const sanitized = invites.map((invite) => ({
    id: invite._id?.toString(),
    email: invite.email,
    role: invite.role,
    expiresAt: invite.expiresAt,
    usedAt: invite.usedAt,
    revokedAt: invite.revokedAt,
    createdAt: invite.createdAt,
    createdByUserId: invite.createdByUserId,
    tokenHash: invite.tokenHash
  }));

  return NextResponse.json({ invites: sanitized });
}

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  if (!session || !(await requireAdmin(userId))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const role = (body?.role as 'user' | 'admin' | undefined) || 'user';
  const sendEmail = body?.sendEmail !== false;
  const greeting =
    typeof body?.greeting === 'string' && body.greeting.trim() ? body.greeting.trim() : 'Hello';

  if (!email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 });
  }
  if (!['user', 'admin'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  const { invite, token } = await createInvite({
    email,
    role,
    createdByUserId: userId
  });

  const base = inferBaseURL(request).replace(/\/+$/, '');
  const inviteUrl = `${base}/sign-up?invite=${token}`;

  let emailSent = false;
  if (sendEmail) {
    try {
      await sendInviteEmail({
        email,
        inviteUrl,
        siteName: process.env.NEXT_PUBLIC_SITE_NAME || process.env.SITE_NAME,
        greeting
      });
      emailSent = true;
    } catch (error) {
      console.error('[invite-email] send failed', error);
    }
  }

  return NextResponse.json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      usedAt: invite.usedAt,
      revokedAt: invite.revokedAt,
      createdAt: invite.createdAt,
      createdByUserId: invite.createdByUserId
    },
    inviteUrl,
    emailSent
  });
}
