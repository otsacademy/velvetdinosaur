export function normalizeAssetTag(value: string, options?: { maxLength?: number }) {
  const maxLength = typeof options?.maxLength === 'number' && options.maxLength > 0 ? Math.floor(options.maxLength) : 40;
  const normalized = value.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return '';
  return normalized.slice(0, maxLength);
}

export function normalizeAssetTags(
  input: unknown,
  options?: { maxTags?: number; maxLength?: number }
) {
  const maxTags = typeof options?.maxTags === 'number' && options.maxTags > 0 ? Math.floor(options.maxTags) : 20;
  const rawValues = Array.isArray(input)
    ? input
    : typeof input === 'string'
      ? input.split(/[,\n;]/)
      : [];
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const raw of rawValues) {
    if (typeof raw !== 'string') continue;
    const next = normalizeAssetTag(raw, { maxLength: options?.maxLength });
    if (!next || seen.has(next)) continue;
    seen.add(next);
    tags.push(next);
    if (tags.length >= maxTags) break;
  }
  return tags;
}

export function formatAssetTags(tags: string[] | undefined | null) {
  if (!Array.isArray(tags) || tags.length === 0) return '';
  return tags.join(', ');
}
