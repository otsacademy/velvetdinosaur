/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CustomFieldRender } from '@measured/puck';
import { Image as ImageIcon, Loader2, UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  buildAssetUrl,
  createAssetFolder,
  listAssetFolders,
  resolveAssetImageUrl,
  updateAssetMetadata,
  uploadFile as uploadAssetFile,
  type AssetFolderItem
} from '@/lib/uploads';
import { AssetLibraryPanel, type AssetPickerListItem, resolveFolderParam } from './asset-picker-field/asset-library-panel';

const FOLDER_ALL = '__all__';
const FOLDER_ROOT = '__root__';

async function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {};
  try {
    const bitmap = await createImageBitmap(file);
    return { width: bitmap.width, height: bitmap.height };
  } catch {
    return {};
  }
}

export function AssetPickerField({
  value,
  onChange,
  accept = 'image/*'
}: {
  value: string;
  onChange: (value: string) => void;
  accept?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>(FOLDER_ALL);
  const [uploadFolder, setUploadFolder] = useState<string>(FOLDER_ROOT);
  const [folders, setFolders] = useState<AssetFolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderLabel, setNewFolderLabel] = useState('');
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [queuedFiles, setQueuedFiles] = useState<File[] | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadBatch, setUploadBatch] = useState<{ current: number; total: number } | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [items, setItems] = useState<AssetPickerListItem[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const [draftFolder, setDraftFolder] = useState<string>(FOLDER_ROOT);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const canPreviewImage = accept.startsWith('image/');

  const mimePrefix = useMemo(() => {
    if (accept.startsWith('image/')) return 'image/';
    if (accept.startsWith('application/')) return 'application/';
    return '';
  }, [accept]);

  const loadFolders = async () => {
    setFoldersLoading(true);
    try {
      const next = await listAssetFolders();
      setFolders(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load folders');
    } finally {
      setFoldersLoading(false);
    }
  };

  const loadLibrary = async (options?: { reset?: boolean }) => {
    const reset = Boolean(options?.reset);
    const nextCursor = reset ? null : cursor;
    const url = new URL('/api/assets/list', window.location.origin);
    if (query) url.searchParams.set('q', query);
    if (mimePrefix) url.searchParams.set('mimePrefix', mimePrefix);
    const folderValue = resolveFolderParam(folderFilter);
    if (typeof folderValue === 'string') url.searchParams.set('folder', folderValue);
    url.searchParams.set('limit', '24');
    if (nextCursor) url.searchParams.set('cursor', nextCursor);
    const res = await fetch(url.toString(), { credentials: 'include', cache: 'no-store' });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to load assets');
    }
    setItems((prev) => (reset ? data.items || [] : [...prev, ...(data.items || [])]));
    setCursor(data.nextCursor || null);
  };

  const refreshLibrary = async (options?: { preserve?: boolean }) => {
    const preserve = options?.preserve ?? false;
    setBusy(true);
    setError('');
    setCursor(null);
    if (!preserve) {
      setItems([]);
    }
    try {
      await loadLibrary({ reset: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load assets');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!libraryOpen) return;
    void loadFolders();
    void refreshLibrary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libraryOpen, mimePrefix, folderFilter]);

  // Live search: refresh results as the user types (debounced).
  useEffect(() => {
    if (!libraryOpen) return;
    const handle = window.setTimeout(() => {
      void refreshLibrary();
    }, 350);
    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const uploadSingle = async (file: File, options: { allowCustomName: boolean }) => {
    const name =
      options.allowCustomName && uploadName.trim()
        ? uploadName.trim()
        : file.name.replace(/\.[^/.]+$/, '');
    const caption = uploadCaption.trim() || undefined;
    const alt = uploadAlt.trim() || undefined;
    const folderValue = resolveFolderParam(uploadFolder);
    const dims = await readImageDimensions(file);
    const uploaded = await uploadAssetFile(file, {
      name,
      caption,
      alt,
      folder: folderValue && typeof folderValue === 'string' ? folderValue : undefined,
      width: dims.width,
      height: dims.height,
      onProgress: (progress) => setUploadProgress(progress)
    });

    const nextItem: AssetPickerListItem = {
      key: uploaded.key,
      name: uploaded.name,
      caption: uploaded.caption,
      alt: uploaded.alt,
      folder: uploaded.folder,
      mime: uploaded.type,
      size: uploaded.size,
      width: uploaded.width,
      height: uploaded.height,
      createdAt: new Date().toISOString()
    };
    setItems((prev) => [nextItem, ...prev.filter((item) => item.key !== nextItem.key)]);
    return uploaded;
  };

  const runQueuedUpload = async () => {
    const files = queuedFiles || [];
    if (files.length === 0) {
      setError('Choose files to upload');
      return;
    }

    setBusy(true);
    setError('');
    setUploadProgress(0);
    setUploadBatch({ current: 1, total: files.length });

    try {
      let lastUploadedUrl: string | null = null;
      for (let index = 0; index < files.length; index += 1) {
        setUploadBatch({ current: index + 1, total: files.length });
        setUploadProgress(0);
        const uploaded = await uploadSingle(files[index], { allowCustomName: files.length === 1 });
        lastUploadedUrl = uploaded.url;
      }

      if (files.length === 1 && lastUploadedUrl) {
        onChange(lastUploadedUrl);
      }

      setQueuedFiles(null);
      setUploadName('');
      setUploadCaption('');
      setUploadAlt('');
      setCursor(null);
      if (libraryOpen) {
        await refreshLibrary({ preserve: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
      setUploadProgress(null);
      setUploadBatch(null);
    }
  };

  const pasteSvg = async () => {
    const svg = window.prompt('Paste SVG code');
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const file = new File([blob], `svg-${Date.now()}.svg`, { type: 'image/svg+xml' });
    setQueuedFiles([file]);
    await runQueuedUpload();
  };

  const startEditing = (item: AssetPickerListItem) => {
    setEditingKey(item.key);
    setDraftName(item.name || '');
    setDraftCaption(item.caption || '');
    setDraftAlt(item.alt || '');
    setDraftFolder(item.folder ? item.folder : FOLDER_ROOT);
  };

  const cancelEditing = () => {
    setEditingKey(null);
    setDraftName('');
    setDraftCaption('');
    setDraftAlt('');
    setDraftFolder(FOLDER_ROOT);
  };

  const saveEditing = async (key: string) => {
    setSavingKey(key);
    setError('');
    try {
      const folderValue = draftFolder === FOLDER_ROOT ? '' : draftFolder;
      const payload = await updateAssetMetadata(key, {
        name: draftName.trim(),
        caption: draftCaption.trim(),
        alt: draftAlt.trim(),
        folder: folderValue
      });
      setItems((prev) =>
        prev.map((item) =>
          item.key === key
            ? {
                ...item,
                name: payload.name,
                caption: payload.caption,
                alt: payload.alt,
                folder: payload.folder
              }
            : item
        )
      );
      cancelEditing();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSavingKey(null);
    }
  };

  const handleCreateFolder = async () => {
    const rawPath = newFolderPath.trim();
    if (!rawPath) {
      setError('Folder path required');
      return;
    }
    setCreatingFolder(true);
    setError('');
    try {
      const created = await createAssetFolder({
        path: rawPath,
        label: newFolderLabel.trim() || undefined
      });
      setNewFolderPath('');
      setNewFolderLabel('');
      setShowCreateFolder(false);
      await loadFolders();
      setFolderFilter(created.path);
      setUploadFolder(created.path);
      await refreshLibrary();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  return (
    <div className="space-y-2">
      <Dropzone
        src={queuedFiles ?? undefined}
        onDrop={(acceptedFiles) => {
          setQueuedFiles(acceptedFiles);
          if (acceptedFiles.length === 1 && !uploadName.trim()) {
            setUploadName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
          }
        }}
        accept={accept.startsWith('image/') ? { 'image/*': [] } : undefined}
        maxFiles={20}
        maxSize={10 * 1024 * 1024}
        disabled={busy}
        className="rounded-lg border-dashed bg-white/50 text-[var(--vd-muted-fg)]"
      >
        <DropzoneContent>
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
              <UploadIcon size={16} />
            </div>
            <p className="w-full truncate text-wrap text-center font-medium text-sm">
              {queuedFiles?.length
                ? `${queuedFiles.length} file${queuedFiles.length === 1 ? '' : 's'} selected`
                : 'Upload files'}
            </p>
            <p className="w-full truncate text-wrap text-center text-muted-foreground text-xs">
              Drag and drop or click to replace
            </p>
          </div>
        </DropzoneContent>
        <DropzoneEmptyState />
      </Dropzone>
      <div className="flex items-center gap-2">
        <Input
          placeholder="Paste a URL, upload, or pick from library"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        <Button
          variant="outline"
          onClick={() => onChange('')}
          disabled={busy || !value}
        >
          Clear
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          onClick={() => void runQueuedUpload()}
          disabled={busy || !(queuedFiles && queuedFiles.length > 0)}
        >
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            'Upload'
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => setLibraryOpen(true)}
          disabled={busy}
        >
          Browse
        </Button>
        <Button
          variant="outline"
          onClick={() => setQueuedFiles(null)}
          disabled={busy || !(queuedFiles && queuedFiles.length > 0)}
        >
          <X className="mr-2 h-4 w-4" />
          Clear selection
        </Button>
        <Button variant="outline" onClick={() => void pasteSvg()} disabled={busy}>
          Paste SVG
        </Button>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
      {uploadBatch ? (
        <p className="text-xs text-[var(--vd-muted-fg)]">
          Uploading {uploadBatch.current} of {uploadBatch.total}
          {typeof uploadProgress === 'number' ? ` (${Math.round(uploadProgress)}%)` : ''}
        </p>
      ) : null}

      {value && canPreviewImage ? (
        <div className="flex items-center gap-3 rounded-lg border border-[var(--vd-border)] bg-white/70 p-2">
          <div className="h-16 w-16 overflow-hidden rounded-md bg-[var(--vd-muted)]/50">
            <img
              src={resolveAssetImageUrl(value, { width: 160, height: 160, fit: 'cover' })}
              alt="Selected asset"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="min-w-0 text-[11px] text-[var(--vd-muted-fg)]">
            <p className="text-xs font-medium text-[var(--vd-fg)]">Selected asset</p>
            <p className="truncate">{value}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="File name (for library)"
          value={uploadName}
          onChange={(e) => setUploadName(e.target.value)}
          disabled={busy}
        />
        <Input
          placeholder="Caption (optional)"
          value={uploadCaption}
          onChange={(e) => setUploadCaption(e.target.value)}
          disabled={busy}
        />
      </div>
      <Input
        placeholder="Alt text (recommended)"
        value={uploadAlt}
        onChange={(e) => setUploadAlt(e.target.value)}
        disabled={busy}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-[var(--vd-muted-fg)]">Upload folder</p>
          <Select value={uploadFolder} onValueChange={setUploadFolder} disabled={busy}>
            <SelectTrigger>
              <SelectValue placeholder="Upload to folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FOLDER_ROOT}>Root</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.path} value={folder.path}>
                  {folder.label ? `${folder.label} (${folder.path})` : folder.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-[var(--vd-muted-fg)] flex items-end">
          Uploads are stored in R2. Folder assignment is for organization and search.
        </div>
      </div>
      <p className="text-xs text-[var(--vd-muted-fg)]">
        Names and captions are optional. They improve media library search and display only.
      </p>

      <Dialog open={libraryOpen} onOpenChange={setLibraryOpen}>
        <DialogContent className="h-[85vh] max-w-[min(1100px,95vw)] overflow-hidden p-0">
          <div className="border-b border-[var(--vd-border)] bg-white/70 p-4">
            <DialogHeader>
              <DialogTitle>Asset library</DialogTitle>
              <DialogDescription>Browse, search, edit, and reuse uploaded files.</DialogDescription>
            </DialogHeader>
          </div>
          <div className="h-[calc(85vh-72px)] overflow-auto p-4">
            <AssetLibraryPanel
              accept={accept}
              busy={busy}
              error={error}
              items={items}
              cursor={cursor}
              query={query}
              setQuery={setQuery}
              folderFilter={folderFilter}
              setFolderFilter={setFolderFilter}
              folders={folders}
              foldersLoading={foldersLoading}
              uploadFolder={uploadFolder}
              setUploadFolder={setUploadFolder}
              showCreateFolder={showCreateFolder}
              setShowCreateFolder={setShowCreateFolder}
              creatingFolder={creatingFolder}
              newFolderPath={newFolderPath}
              setNewFolderPath={setNewFolderPath}
              newFolderLabel={newFolderLabel}
              setNewFolderLabel={setNewFolderLabel}
              onCreateFolder={() => void handleCreateFolder()}
              onRefresh={() => void refreshLibrary()}
              onLoadMore={() => {
                setBusy(true);
                setError('');
                loadLibrary({ reset: false })
                  .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load assets'))
                  .finally(() => setBusy(false));
              }}
              onUse={(key) => {
                onChange(buildAssetUrl(key));
                setLibraryOpen(false);
              }}
              editingKey={editingKey}
              startEditing={startEditing}
              cancelEditing={cancelEditing}
              saveEditing={(key) => void saveEditing(key)}
              draftName={draftName}
              setDraftName={setDraftName}
              draftCaption={draftCaption}
              setDraftCaption={setDraftCaption}
              draftAlt={draftAlt}
              setDraftAlt={setDraftAlt}
              draftFolder={draftFolder}
              setDraftFolder={setDraftFolder}
              savingKey={savingKey}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function assetPickerField(options?: { accept?: string }) {
  const accept = options?.accept;
  const render: CustomFieldRender<string> = ({ value, onChange: fieldOnChange }) => (
    <AssetPickerField value={value || ''} onChange={fieldOnChange} accept={accept} />
  );
  return {
    type: 'custom' as const,
    render
  };
}
