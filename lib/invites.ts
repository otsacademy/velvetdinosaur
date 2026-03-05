import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/invites.ts');

import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { Invite } from '@/models/Invite';

export const DEFAULT_INVITE_TTL_MS = 24 * 60 * 60 * 1000;

type InviteLike = {
  _id: { toString(): string };
  email: string;
  role: 'user' | 'admin';
  createdByUserId?: string | null;
  usedAt?: Date | null;
  revokedAt?: Date | null;
  expiresAt: Date;
};

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function isInviteUsable(invite: { usedAt?: Date | null; revokedAt?: Date | null; expiresAt: Date }) {
  const now = new Date();
  return !invite.usedAt && !invite.revokedAt && invite.expiresAt > now;
}

export function generateInviteToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashToken(token) };
}

export async function createInvite(params: {
  email: string;
  role: 'user' | 'admin';
  createdByUserId?: string | null;
  expiresAt?: Date;
}) {
  await connectDB();
  const { token, tokenHash } = generateInviteToken();
  const invite = await Invite.create({
    email: params.email.toLowerCase(),
    role: params.role,
    tokenHash,
    tokenShownAt: new Date(),
    expiresAt: params.expiresAt ?? new Date(Date.now() + DEFAULT_INVITE_TTL_MS),
    createdByUserId: params.createdByUserId ?? null
  });
  await logAudit({
    action: 'invite.create',
    actorUserId: params.createdByUserId ?? null,
    metadata: { inviteId: invite.id, email: invite.email, role: invite.role }
  });
  return { invite, token };
}

export async function revokeInvite(id: string, actorUserId?: string | null) {
  await connectDB();
  const revoked = await Invite.findOneAndUpdate(
    { _id: id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
    { new: true }
  );
  if (revoked) {
    await logAudit({
      action: 'invite.revoke',
      actorUserId: actorUserId ?? null,
      metadata: { inviteId: revoked.id }
    });
  }
  return revoked;
}

export async function validateInviteToken(rawToken: string) {
  await connectDB();
  const tokenHash = hashToken(rawToken);
  const invite = (await Invite.findOne({ tokenHash }).lean()) as InviteLike | null;
  if (invite && isInviteUsable(invite)) {
    return invite;
  }
  return null;
}

export async function markInviteUsed(inviteId: string, actorUserId?: string | null) {
  await connectDB();
  const updated = await Invite.findOneAndUpdate(
    { _id: inviteId, usedAt: null, revokedAt: null },
    { $set: { usedAt: new Date() } },
    { new: true }
  );
  if (updated) {
    await logAudit({
      action: 'invite.use',
      actorUserId: actorUserId ?? null,
      metadata: { inviteId: updated.id, email: updated.email }
    });
  }
  return updated;
}
