import { createDemoEditorAssetFolder, listDemoEditorAssets, uploadDemoEditorFile, listDemoEditorAssetFolders, resolveDemoEditorAssetUrl } from '@/lib/demo-editor-assets';
import { createAssetFolder, uploadFile, listAssetFolders, type UploadViaPresignOptions } from '@/lib/uploads';
import type { AssetPickerListItem } from './shared';

export async function listPickerAssets(url: URL, demo: boolean) {
  if (demo) { const data = await listDemoEditorAssets({ q: url.searchParams.get('q') || '', mimePrefix: url.searchParams.get('mimePrefix') || '', folder: url.searchParams.get('folder'), cursor: url.searchParams.get('cursor'), limit: 24 }); return { ...data, items: data.items.map((item) => ({ ...item, previewUrl: resolveDemoEditorAssetUrl(item.key) || undefined })) }; }
  const response = await fetch(url, { credentials: 'include', cache: 'no-store' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || 'Failed to load assets');
  return data as { items: AssetPickerListItem[]; nextCursor: string | null };
}
export function uploadPickerFile(file: File, options: UploadViaPresignOptions, demo: boolean) {
  return demo ? uploadDemoEditorFile(file, options) : uploadFile(file, options);
}
export function listPickerFolders(demo: boolean) { return demo ? listDemoEditorAssetFolders() : listAssetFolders(); }
export function pickerAssetUrl(item: AssetPickerListItem, demo: boolean) {
  return demo ? resolveDemoEditorAssetUrl(item.key) || item.key : '';
}

export function createPickerFolder(input: { path: string; label?: string }, demo: boolean) {
  return demo ? createDemoEditorAssetFolder(input) : createAssetFolder(input);
}
