import { NextResponse } from 'next/server';
import { createEmailVerificationToken } from 'better-auth/api';
import { getAuth } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';
import { connectDB } from '@/lib/db';
import { validateInviteToken } from '@/lib/invites';
import { setUserRole } from '@/lib/roles';
import { Invite } from '@/models/Invite';
import { logAudit } from '@/lib/audit';

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const token = (body?.token as string | undefined)?.trim();
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const password = body?.password as string | undefined;
  const name = body?.name as string | undefined;

  if (!token || !email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const invite = await validateInviteToken(token);
  if (!invite || Array.isArray(invite)) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 });
  }
  if (invite.email !== email) {
    return NextResponse.json({ error: 'Invite email does not match' }, { status: 400 });
  }

  await connectDB();
  // Reserve the invite atomically to enforce single-use semantics.
  const claimed = await Invite.findOneAndUpdate(
    { _id: invite._id, usedAt: null, revokedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (!claimed) {
    return NextResponse.json({ error: 'Invite already used or revoked' }, { status: 400 });
  }

  const auth = getAuth();
  const ctx = await auth.$context;

  const minLength = ctx.password.config.minPasswordLength ?? 8;
  const maxLength = ctx.password.config.maxPasswordLength ?? 128;
  if (password.length < minLength || password.length > maxLength) {
    await Invite.updateOne({ _id: invite._id, usedAt: claimed.usedAt }, { $set: { usedAt: null } });
    return NextResponse.json({ error: 'Password length not allowed' }, { status: 400 });
  }

  const existing = await ctx.internalAdapter.findUserByEmail(email, { includeAccounts: true });
  if (existing?.user) {
    await Invite.updateOne({ _id: invite._id, usedAt: claimed.usedAt }, { $set: { usedAt: null } });
    return NextResponse.json({ error: 'User already exists. Please sign in.' }, { status: 409 });
  }

  try {
    const hash = await ctx.password.hash(password);
    const createdUser = await ctx.internalAdapter.createUser({
      email,
      name,
      emailVerified: false
    });
    if (!createdUser) {
      throw new Error('Failed to create user');
    }

    await ctx.internalAdapter.linkAccount({
      userId: createdUser.id,
      providerId: 'credential',
      accountId: createdUser.id,
      password: hash
    });

    await setUserRole(createdUser.id, invite.role as 'user' | 'admin', invite.createdByUserId ?? createdUser.id);
    await logAudit({
      action: 'invite.use',
      actorUserId: createdUser.id,
      metadata: { inviteId: invite._id?.toString(), role: invite.role, email }
    });

    const verificationToken = await createEmailVerificationToken(
      ctx.secret,
      createdUser.email,
      undefined,
      ctx.options.emailVerification?.expiresIn
    );
    const callbackURL = encodeURIComponent('/');
    const verifyUrl = `${ctx.baseURL}/verify-email?token=${verificationToken}&callbackURL=${callbackURL}`;
    if (ctx.options.emailVerification?.sendVerificationEmail) {
      await sendVerificationEmail({ user: createdUser, url: verifyUrl, token: verificationToken });
    }

    return NextResponse.json({ ok: true, requiresEmailVerification: true });
  } catch (error) {
    await Invite.updateOne({ _id: invite._id }, { $set: { usedAt: null } });
    return NextResponse.json({ error: 'Unable to complete signup' }, { status: 500 });
  }
}
