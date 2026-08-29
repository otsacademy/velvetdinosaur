const slugRe = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeVideoSlug(slug: string) {
  const s = String(slug || '').trim();
  return !!s && s.length <= 120 && slugRe.test(s);
}

export function assertSafeVideoSlug(slug: string) {
  const s = String(slug || '').trim();
  if (!isSafeVideoSlug(s)) {
    throw new Error(`Invalid slug: "${s}"`);
  }
  return s;
}
