const REVIEW_TOKEN_STORAGE_PREFIX = 'review-token:';
const REVIEW_SUPPRESSED_STORAGE_PREFIX = 'review-token-suppressed:';
const REVIEW_TOKEN_PATTERN = /^[a-f\d]+\.[a-f\d]+$/i;
export const REVIEW_TOKEN_STORAGE_EVENT = 'review-token-storage-change';

function readFromStorage(key: string) {
  if (typeof window === 'undefined') return '';
  try {
    return (window.localStorage.getItem(key) || '').trim();
  } catch {
    return '';
  }
}

function writeToStorage(key: string, value: string) {
  if (typeof window === 'undefined') return;
  try {
    if (value) {
      window.localStorage.setItem(key, value);
      return;
    }
    window.localStorage.removeItem(key);
  } catch {
    // Ignore localStorage availability errors (private browsing, strict privacy settings).
  }
}

function dispatchTokenStorageChange(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(
      new CustomEvent(REVIEW_TOKEN_STORAGE_EVENT, {
        detail: { slug }
      })
    );
  } catch {
    // Ignore environments where CustomEvent dispatch fails.
  }
}

function buildStorageKey(slug: string) {
  const normalizedSlug = (slug || '').trim().toLowerCase();
  if (!normalizedSlug) return '';
  return `${REVIEW_TOKEN_STORAGE_PREFIX}${normalizedSlug}`;
}

function buildSuppressedStorageKey(slug: string) {
  const normalizedSlug = (slug || '').trim().toLowerCase();
  if (!normalizedSlug) return '';
  return `${REVIEW_SUPPRESSED_STORAGE_PREFIX}${normalizedSlug}`;
}

function normalizeToken(rawToken: string) {
  const token = (rawToken || '').trim();
  if (!token) return '';
  if (!REVIEW_TOKEN_PATTERN.test(token)) return '';
  return token;
}

export function getStoredReviewToken(slug: string) {
  const key = buildStorageKey(slug);
  if (!key) return '';
  const token = normalizeToken(readFromStorage(key));
  if (!token) {
    writeToStorage(key, '');
    return '';
  }
  return token;
}

export function setStoredReviewToken(slug: string, rawToken: string) {
  const key = buildStorageKey(slug);
  if (!key) return;
  const suppressedKey = buildSuppressedStorageKey(slug);
  if (suppressedKey) {
    writeToStorage(suppressedKey, '');
  }
  writeToStorage(key, normalizeToken(rawToken));
  dispatchTokenStorageChange(slug);
}

export function clearStoredReviewToken(slug: string) {
  const key = buildStorageKey(slug);
  if (!key) return;
  writeToStorage(key, '');
  dispatchTokenStorageChange(slug);
}

export function clearAllStoredReviewTokens() {
  if (typeof window === 'undefined') return;
  const affectedSlugs = new Set<string>();
  try {
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
      const key = window.localStorage.key(index);
      if (!key || !key.startsWith(REVIEW_TOKEN_STORAGE_PREFIX)) continue;
      keys.push(key);
    }
    for (const key of keys) {
      const slug = key.slice(REVIEW_TOKEN_STORAGE_PREFIX.length).trim().toLowerCase();
      if (slug) affectedSlugs.add(slug);
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore localStorage availability errors (private browsing, strict privacy settings).
    return;
  }
  for (const slug of affectedSlugs) {
    dispatchTokenStorageChange(slug);
  }
}

export function isReviewModeSuppressed(slug: string) {
  const key = buildSuppressedStorageKey(slug);
  if (!key) return false;
  return readFromStorage(key) === '1';
}

export function setReviewModeSuppressed(slug: string, suppressed: boolean) {
  const key = buildSuppressedStorageKey(slug);
  if (!key) return;
  writeToStorage(key, suppressed ? '1' : '');
  dispatchTokenStorageChange(slug);
}
