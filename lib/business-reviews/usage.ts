import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/business-reviews/usage.ts');

import { connectDB } from '@/lib/db';
import { ExternalReviewApiUsage } from '@/models/ExternalReviewApiUsage';

function boundedDailyLimit(value: string | undefined, fallback: number) {
  const configured = value === undefined || value.trim() === '' ? fallback : Number(value);
  if (!Number.isFinite(configured)) return fallback;
  return Math.max(0, Math.min(1000, Math.floor(configured)));
}

async function claimDailyRequest(provider: string, limit: number) {
  if (limit === 0) return { ok: false, limit, remaining: 0 };
  if (!(await connectDB())) return { ok: false, limit, remaining: 0 };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const expiresAt = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

  try {
    const record = await ExternalReviewApiUsage.findOneAndUpdate(
      { provider, day, count: { $lt: limit } },
      { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
      { upsert: true, new: true }
    ).lean();
    const count = Number((record as { count?: number } | null)?.count || 0);
    return { ok: true, limit, remaining: Math.max(0, limit - count) };
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) {
      return { ok: false, limit, remaining: 0 };
    }
    throw error;
  }
}

export function claimGoogleReviewRequest() {
  return claimDailyRequest(
    'google-places-reviews',
    boundedDailyLimit(process.env.GOOGLE_PLACES_DAILY_REVIEW_LIMIT, 30)
  );
}

export function claimGoogleSearchRequest() {
  return claimDailyRequest(
    'google-places-search',
    boundedDailyLimit(process.env.GOOGLE_PLACES_DAILY_SEARCH_LIMIT, 20)
  );
}
