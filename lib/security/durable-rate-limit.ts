import { createHash } from 'node:crypto';
import type { ClientSession } from 'mongoose';
import { requireNewsletterDatabase } from '@/lib/newsletter/database';
import { RequestLimit } from '@/models/RequestLimit';

export async function checkDurableRateLimit(input: { id: string; key: string; limit: number; windowMs: number }, session?: ClientSession) {
  if (!session) await requireNewsletterDatabase();
  const now = Date.now();
  const windowMs = Math.max(1000, input.windowMs);
  const bucket = Math.floor(now / windowMs);
  const resetAt = (bucket + 1) * windowMs;
  const id = createHash('sha256').update(`${input.id}:${input.key}:${bucket}`).digest('hex');
  // Seed separately so reaching the limit cannot cause an upsert duplicate-key
  // error that aborts the caller's transaction.
  await RequestLimit.updateOne({ _id: id }, { $setOnInsert: { count: 0, expiresAt: new Date(resetAt) } }, { upsert: true, session });
  const result = await RequestLimit.updateOne({ _id: id, count: { $lt: input.limit } }, { $inc: { count: 1 } }, { session });
  return { ok: result.modifiedCount === 1, retryAfterSeconds: Math.max(1, Math.ceil((resetAt - now) / 1000)), key: id };
}
