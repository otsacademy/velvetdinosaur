import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/video-live-capture/token.ts');

import crypto from 'node:crypto';
import { connectDB } from '@/lib/db';
import { assertSafeVideoSlug } from '@/lib/video-project/slug';
import { VideoLiveCaptureToken } from '@/models/VideoLiveCaptureToken';

function sha256Base64Url(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('base64url');
}

export async function createVideoLiveCaptureToken(input: {
  slug: string;
  createdByUserId: string;
  ttlMinutes?: number;
  allowedPrefix?: string;
}) {
  await connectDB();
  const slug = assertSafeVideoSlug(input.slug);
  const ttlMinutes = Number.isFinite(input.ttlMinutes) ? Number(input.ttlMinutes) : 10;
  const allowedPrefix = String(input.allowedPrefix || '/edit').trim() || '/edit';

  const token = crypto.randomBytes(32).toString('base64url');
  const tokenHash = sha256Base64Url(token);
  const expiresAt = new Date(Date.now() + Math.max(1, ttlMinutes) * 60_000);

  await VideoLiveCaptureToken.create({
    slug,
    tokenHash,
    createdByUserId: input.createdByUserId,
    allowedPrefix,
    expiresAt,
    usedAt: null
  });

  return { token, expiresAt, allowedPrefix };
}

export async function validateVideoLiveCaptureToken(input: {
  token: string;
  slug: string;
  path: string;
}) {
  await connectDB();
  const slug = assertSafeVideoSlug(input.slug);
  const token = String(input.token || '').trim();
  const path = String(input.path || '').trim();
  if (!token) return { ok: false as const, error: 'Missing token' };
  if (!path.startsWith('/')) return { ok: false as const, error: 'Invalid path' };

  const tokenHash = sha256Base64Url(token);
  const row = await VideoLiveCaptureToken.findOne({ tokenHash, slug }).lean();
  if (!row) return { ok: false as const, error: 'Invalid token' };

  const usedAt = (row as { usedAt?: Date | null }).usedAt || null;
  if (usedAt) return { ok: false as const, error: 'Token already used' };

  const expiresAt = (row as { expiresAt?: Date | null }).expiresAt || null;
  if (!(expiresAt instanceof Date) || expiresAt.getTime() <= Date.now()) {
    return { ok: false as const, error: 'Token expired' };
  }

  const allowedPrefix = String((row as { allowedPrefix?: string }).allowedPrefix || '/edit');
  if (!path.startsWith(allowedPrefix)) {
    return { ok: false as const, error: 'Route not allowed' };
  }

  return { ok: true as const, allowedPrefix };
}

export async function consumeVideoLiveCaptureToken(input: { token: string; slug: string }) {
  await connectDB();
  const slug = assertSafeVideoSlug(input.slug);
  const tokenHash = sha256Base64Url(String(input.token || '').trim());
  await VideoLiveCaptureToken.updateOne({ tokenHash, slug }, { $set: { usedAt: new Date() } });
}
