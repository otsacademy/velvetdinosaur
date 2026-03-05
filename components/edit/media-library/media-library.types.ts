export type AssetListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  mime?: string;
  size?: number;
  width?: number;
  height?: number;
  createdAt?: string;
};

export type ViewMode = 'grid' | 'list';
export type MimeFilter = 'all' | 'image' | 'document';
export type SortMode = 'newest' | 'oldest';

export const PAGE_SIZE = 30;
export const FOLDER_ALL = '__all__';
export const FOLDER_ROOT = '__root__';

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

export function assetLabel(asset: AssetListItem) {
  return asset.name?.trim() || asset.caption?.trim() || asset.key;
}

export function assetAlt(asset: AssetListItem) {
  return asset.alt?.trim() || asset.caption?.trim() || asset.name?.trim() || 'Image';
}

