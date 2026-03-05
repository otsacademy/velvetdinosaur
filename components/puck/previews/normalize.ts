export type StringLike =
  | string
  | number
  | { value?: string | number }
  | { slug?: string | number }
  | { id?: string | number }
  | null
  | undefined;

export function normalizeString(value: StringLike): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    return trimmed ? trimmed : null;
  }
  if (typeof value === 'object') {
    const record = value as { value?: unknown; slug?: unknown; id?: unknown };
    const candidate = record.value ?? record.slug ?? record.id;
    if (candidate === null || candidate === undefined) return null;
    const trimmed = String(candidate).trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

export function normalizeStringArray(values?: Array<StringLike>): string[] {
  if (!values || values.length === 0) return [];
  const normalized: string[] = [];
  for (const entry of values) {
    const value = normalizeString(entry);
    if (value) normalized.push(value);
  }
  return normalized;
}
