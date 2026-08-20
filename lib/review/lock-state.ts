export function getReviewLockState(
  deadlineAt: Date | string | number,
  overrideLock: boolean,
  now = Date.now()
) {
  const deadlineMs =
    deadlineAt instanceof Date ? deadlineAt.getTime() : new Date(deadlineAt).getTime();
  const expired = Number.isNaN(deadlineMs) ? true : deadlineMs <= now;
  return {
    expired,
    isLocked: expired && !overrideLock,
    isReopened: expired && overrideLock
  };
}
