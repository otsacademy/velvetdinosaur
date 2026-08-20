import { normalizeAssetTags } from '@/lib/assets/tags';

export type AssetListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  tags?: string[];
  altSource?: 'manual' | 'auto' | null;
  altGeneratedAt?: string | null;
  altModel?: string | null;
  altNeedsReview?: boolean | null;
  folder?: string;
  mime?: string;
  size?: number;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
  deletedAt?: string | null;
  createdAt?: string;
};

export type ViewMode = 'grid' | 'list';
export type MimeFilter = 'all' | 'image' | 'document';
export type SortMode = 'newest' | 'oldest';

export const PAGE_SIZE = 30;
export const FOLDER_ALL = '__all__';
export const FOLDER_ROOT = '__root__';
export const FOLDER_TRASH = '__trash__';
export const TAG_FILTER_ALL = '__all_tags__';

export function formatSize(value?: number) {
  if (!value || value <= 0) return '—';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(date);
}

export function resolveMimePrefix(filter: MimeFilter) {
  if (filter === 'image') return 'image/';
  if (filter === 'document') return 'application/';
  return '';
}

export function resolveFolderParam(value: string) {
  if (value === FOLDER_ALL) return null;
  if (value === FOLDER_ROOT) return '';
  return value;
}

export async function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {};
  try {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height };
  } catch {
    return {};
  }
}

function toSafeText(value: unknown) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
  return '';
}

export function assetLabel(asset: AssetListItem) {
  return toSafeText(asset.name) || toSafeText(asset.caption) || asset.key;
}

export function assetAlt(asset: AssetListItem) {
  return toSafeText(asset.alt) || toSafeText(asset.caption) || toSafeText(asset.name) || 'Image';
}

export function parseTagInput(input: string) {
  return normalizeAssetTags(input);
}

export function isCaptionMissing(asset: AssetListItem) {
  return !toSafeText(asset.caption);
}

export function isAltMissing(asset: AssetListItem) {
  return !toSafeText(asset.alt);
}

export function isLikelyMachineName(value: string | undefined) {
  const text = toSafeText(value).toLowerCase();
  if (!text) return false;
  if (text.length >= 32 && /^[a-f0-9-]+$/.test(text)) return true;
  return /^[a-f0-9]{24,}(?:-[a-f0-9]{8,})?$/.test(text);
}

function hashTag(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const TAG_TONES = ['var(--primary)', 'var(--accent)', 'var(--ring)', 'var(--secondary-foreground)', 'var(--muted-foreground)'];

export function tagBadgeStyle(tag: string) {
  const tone = TAG_TONES[hashTag(tag) % TAG_TONES.length];
  return {
    backgroundColor: `color-mix(in oklch, ${tone} 14%, var(--background))`,
    borderColor: `color-mix(in oklch, ${tone} 34%, var(--border))`,
    color: `color-mix(in oklch, ${tone} 66%, var(--foreground))`
  };
}
