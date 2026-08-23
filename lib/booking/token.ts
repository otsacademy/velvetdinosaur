import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/booking/token.ts');

import { createHash, randomBytes, timingSafeEqual } from 'crypto';

/** Generate a raw manage token (emailed once) plus the hash we store. */
export function generateManageToken(ttlDays: number) {
  const raw = randomBytes(32).toString('base64url');
  return {
    raw,
    hash: hashManageToken(raw),
    expiresAt: new Date(Date.now() + Math.max(1, ttlDays) * 86_400_000)
  };
}

export function hashManageToken(raw: string) {
  return createHash('sha256').update(raw.trim()).digest('hex');
}

export function manageTokenMatches(raw: string, storedHash: string) {
  const candidate = Buffer.from(hashManageToken(raw), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}
