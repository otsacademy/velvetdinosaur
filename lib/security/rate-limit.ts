import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/security/rate-limit.ts');

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitInput = {
  id: string;
  key: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  ok: boolean;
  limit: number;
  remaining: number;
  retryAfterSeconds: number;
  resetAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var vdRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore() {
  if (!globalThis.vdRateLimitStore) {
    globalThis.vdRateLimitStore = new Map();
  }
  return globalThis.vdRateLimitStore;
}

function clearExpiredEntries(now: number) {
  const store = getStore();
  if (store.size < 5000) return;
  for (const [entryKey, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(entryKey);
    }
  }
}

export function getRequestIp(headers: Headers) {
  const direct =
    headers.get('cf-connecting-ip') ||
    headers.get('x-real-ip') ||
    headers.get('true-client-ip') ||
    headers.get('x-client-ip') ||
    '';
  if (direct.trim()) return direct.trim();

  const forwarded = headers.get('x-forwarded-for') || '';
  const first = forwarded
    .split(',')
    .map((part) => part.trim())
    .find(Boolean);
  return first || '';
}

export function checkRateLimit(input: RateLimitInput): RateLimitResult {
  const limit = Math.max(1, Math.floor(input.limit));
  const windowMs = Math.max(1000, Math.floor(input.windowMs));
  const key = `${input.id}:${input.key || 'unknown'}`;
  const now = Date.now();

  if (process.env.NODE_ENV !== 'production') {
    return {
      ok: true,
      limit,
      remaining: limit,
      retryAfterSeconds: 0,
      resetAt: now + windowMs
    };
  }

  clearExpiredEntries(now);
  const store = getStore();
  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: 0,
      resetAt
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
      resetAt: existing.resetAt
    };
  }

  existing.count += 1;
  store.set(key, existing);
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: 0,
    resetAt: existing.resetAt
  };
}
