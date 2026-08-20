import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/security/review-deadlines.ts');

const REVIEW_DEADLINE_MONTH_INDEX = 1; // February
const REVIEW_DEADLINE_DAY = 23;

export function getDefaultReviewDeadline(now = new Date()) {
  const year = now.getFullYear();
  const thisYearDeadline = new Date(year, REVIEW_DEADLINE_MONTH_INDEX, REVIEW_DEADLINE_DAY, 23, 59, 59, 999);
  if (thisYearDeadline.getTime() >= now.getTime()) {
    return thisYearDeadline;
  }
  return new Date(year + 1, REVIEW_DEADLINE_MONTH_INDEX, REVIEW_DEADLINE_DAY, 23, 59, 59, 999);
}

export function isReviewExpired(
  deadlineAt: Date | string | number,
  options?: { now?: Date; overrideLock?: boolean | null }
) {
  if (options?.overrideLock) {
    return false;
  }
  const deadline = deadlineAt instanceof Date ? deadlineAt : new Date(deadlineAt);
  if (Number.isNaN(deadline.getTime())) return true;
  const now = options?.now || new Date();
  return deadline.getTime() <= now.getTime();
}
