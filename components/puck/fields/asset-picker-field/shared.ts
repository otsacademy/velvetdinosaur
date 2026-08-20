export type AssetPickerListItem = {
  key: string;
  name?: string;
  caption?: string;
  alt?: string;
  folder?: string;
  mime?: string;
  size?: number;
  focalX?: number;
  focalY?: number;
  width?: number;
  height?: number;
  createdAt?: string;
};

export const FOLDER_ALL = '__all__';
export const FOLDER_ROOT = '__root__';

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

export function getSelectedAssetLabel(value: string) {
  if (!value) return '';

  try {
    const parsed = new URL(value, 'https://placeholder.local');
    const keyParam = parsed.searchParams.get('key')?.trim();
    if (keyParam) {
      const keyFileName = keyParam.split('/').filter(Boolean).pop();
      if (keyFileName) return decodeURIComponent(keyFileName);
    }
    const pathValue = parsed.pathname.split('/').filter(Boolean).pop() || parsed.pathname;
    return decodeURIComponent(pathValue || value);
  } catch {
    const fallback = value.split('/').filter(Boolean).pop() || value;
    return decodeURIComponent(fallback);
  }
}

export function isAssetImage(item: AssetPickerListItem, accept: string) {
  return (item.mime || '').startsWith('image/') || (!item.mime && accept.startsWith('image/'));
}

export function assetPickerLabel(item: AssetPickerListItem) {
  return item.name?.trim() || item.caption?.trim() || item.key;
}

export function formatAssetPickerSize(value?: number) {
  if (!value || value <= 0) return '';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

