import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/review-access.ts');

const DEFAULT_GLOBAL_REVIEW_EMAIL = 'ian.wickens@ontourism.academy';

function normalizeEmail(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase();
}

export function getGlobalReviewEmail() {
  return normalizeEmail(process.env.GLOBAL_REVIEW_VIEWER_EMAIL || DEFAULT_GLOBAL_REVIEW_EMAIL);
}

export function canViewAllReviewComments(email: string | null | undefined) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  return normalized === getGlobalReviewEmail();
}
