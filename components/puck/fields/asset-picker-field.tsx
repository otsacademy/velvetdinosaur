/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CustomFieldRender } from '@puckeditor/core';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { isBlobMediaReference, isInlineImageDataUrl } from '@/lib/inline-media';
import { buildAssetUrlWithFocal, createAssetFolder, listAssetFolders, updateAssetMetadata, uploadFile as uploadAssetFile, type AssetFolderItem } from '@/lib/uploads';
import { AssetLibraryPanel } from './asset-picker-field/asset-library-panel';
import { AssetUploadControls } from './asset-picker-field/asset-upload-controls';
import { SelectedAssetSummary } from './asset-picker-field/selected-asset-summary';
import {
  FOLDER_ALL,
  FOLDER_ROOT,
  getSelectedAssetLabel,
  readImageDimensions,
  resolveFolderParam,
  type AssetPickerListItem
} from './asset-picker-field/shared';

function appendLiveCaptureQuery(url: URL) {
  const params = new URLSearchParams(window.location.search);
  if (params.get('capture') !== '1' || params.get('live') !== '1') return url;
  const video = params.get('video');
  if (!video) return url;
  url.searchParams.set('capture', '1');
  url.searchParams.set('live', '1');
  url.searchParams.set('video', video);
  return url;
}

export function AssetPickerField({ value, onChange, accept = 'image/*', compact = false, defaultUploadFolder = FOLDER_ROOT, showUrlInput = true, showAdvancedOptions = true, showSelectedAssetMeta = true, simple = false, autoUploadOnDrop = false, autoSelectSingleUpload = true, testIdBase }: {
  value: string;
  onChange: (value: string) => void;
  accept?: string;
  compact?: boolean;
  defaultUploadFolder?: string;
  showUrlInput?: boolean;
  showAdvancedOptions?: boolean;
  showSelectedAssetMeta?: boolean;
  simple?: boolean;
  autoUploadOnDrop?: boolean;
  autoSelectSingleUpload?: boolean;
  testIdBase?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState<string>(FOLDER_ALL);
  const [uploadFolder, setUploadFolder] = useState<string>(() => defaultUploadFolder.trim() || FOLDER_ROOT);
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
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const canPreviewImage = accept.startsWith('image/');
  const useCompactLayout = compact || simple;

  const mimePrefix = useMemo(() => {
    if (accept.startsWith('image/')) return 'image/';
    if (accept.startsWith('application/')) return 'application/';
    return '';
  }, [accept]);

  const selectedAssetLabel = useMemo(() => getSelectedAssetLabel(value), [value]);

  const commitValue = (nextValue: string) => {
    if (isBlobMediaReference(nextValue)) {
      toast.error('Blob preview URLs cannot be saved. Upload the file to the media library first.');
      return;
    }
    if (isInlineImageDataUrl(nextValue)) {
      toast.error('Inline image data URLs cannot be saved. Upload the image to the media library first.');
      return;
    }
    onChange(nextValue);
  };

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
    appendLiveCaptureQuery(url);
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

  const runQueuedUpload = async (
    providedFiles?: File[],
    options?: {
      autoSelectSingleUpload?: boolean;
      notifyMultipleNoSelection?: boolean;
    }
  ) => {
    const files = providedFiles || queuedFiles || [];
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

      const shouldAutoSelectSingle = options?.autoSelectSingleUpload ?? true;
      if (files.length === 1 && lastUploadedUrl && shouldAutoSelectSingle) {
        commitValue(lastUploadedUrl);
      }
      if (files.length > 1 && options?.notifyMultipleNoSelection) {
        toast.message(`${files.length} images uploaded to the library. Pick one to use for this field.`);
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

  const handleUploadDrop = (
    acceptedFiles: File[],
    options?: {
      autoUpload?: boolean;
      autoSelectSingleUpload?: boolean;
      notifyMultipleNoSelection?: boolean;
    }
  ) => {
    setQueuedFiles(acceptedFiles);
    if (acceptedFiles.length === 1 && !uploadName.trim()) {
      setUploadName(acceptedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
    if (options?.autoUpload && acceptedFiles.length > 0) {
      void runQueuedUpload(acceptedFiles, {
        autoSelectSingleUpload: options.autoSelectSingleUpload,
        notifyMultipleNoSelection: options.notifyMultipleNoSelection
      });
    }
  };

  const pasteSvg = async () => {
    const svg = window.prompt('Paste SVG code');
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const file = new File([blob], `svg-${Date.now()}.svg`, { type: 'image/svg+xml' });
    setQueuedFiles([file]);
    await runQueuedUpload([file]);
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
      <AssetUploadControls
        accept={accept}
        busy={busy}
        queuedFiles={queuedFiles}
        onDrop={(acceptedFiles) =>
          handleUploadDrop(acceptedFiles, {
            autoUpload: simple || autoUploadOnDrop,
            autoSelectSingleUpload,
            notifyMultipleNoSelection: autoUploadOnDrop
          })
        }
        onUpload={() => void runQueuedUpload()}
        onClearSelection={() => setQueuedFiles(null)}
        onPasteSvg={() => void pasteSvg()}
        uploadProgress={uploadProgress}
        uploadBatch={uploadBatch}
        uploadName={uploadName}
        setUploadName={setUploadName}
        uploadCaption={uploadCaption}
        setUploadCaption={setUploadCaption}
        uploadAlt={uploadAlt}
        setUploadAlt={setUploadAlt}
        uploadFolder={uploadFolder}
        setUploadFolder={setUploadFolder}
        folders={folders}
        value={value || ''}
        onValueChange={commitValue}
        showUrlInput={showUrlInput}
        showAdvancedOptions={showAdvancedOptions}
        useCompactLayout={useCompactLayout}
        advancedOpen={advancedOpen}
        onAdvancedOpenChange={setAdvancedOpen}
        testIdBase={testIdBase}
      />

      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setLibraryOpen(true)}
          disabled={busy}
          data-testid={testIdBase ? `puck-asset-browse-${testIdBase}` : undefined}
        >
          Browse
        </Button>
      </div>

      {error ? <p className="text-xs text-rose-600">{error}</p> : null}

      {value && canPreviewImage && showSelectedAssetMeta ? (
        <SelectedAssetSummary value={value} label={selectedAssetLabel} />
      ) : null}

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
              testIdBase={testIdBase}
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
              uploadControls={
                <AssetUploadControls
                  accept={accept}
                  busy={busy}
                  queuedFiles={queuedFiles}
                  onDrop={(acceptedFiles) => handleUploadDrop(acceptedFiles)}
                  onUpload={() => void runQueuedUpload()}
                  onClearSelection={() => setQueuedFiles(null)}
                  onPasteSvg={() => void pasteSvg()}
                  uploadProgress={uploadProgress}
                  uploadBatch={uploadBatch}
                  uploadName={uploadName}
                  setUploadName={setUploadName}
                  uploadCaption={uploadCaption}
                  setUploadCaption={setUploadCaption}
                  uploadAlt={uploadAlt}
                  setUploadAlt={setUploadAlt}
                  uploadFolder={uploadFolder}
                  setUploadFolder={setUploadFolder}
                  folders={folders}
                  showUrlInput={false}
                  useCompactLayout={false}
                  variant="library"
                />
              }
              onCreateFolder={() => void handleCreateFolder()}
              onRefresh={() => void refreshLibrary()}
              onLoadMore={() => {
                setBusy(true);
                setError('');
                loadLibrary({ reset: false })
                  .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load assets'))
                  .finally(() => setBusy(false));
              }}
              onUse={(item) => {
                commitValue(buildAssetUrlWithFocal(item.key, item.focalX, item.focalY));
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

export function assetPickerField(options?: {
  accept?: string;
  autoUploadOnDrop?: boolean;
  autoSelectSingleUpload?: boolean;
}) {
  const accept = options?.accept;
  const autoUploadOnDrop = options?.autoUploadOnDrop;
  const autoSelectSingleUpload = options?.autoSelectSingleUpload;
  const render: CustomFieldRender<string> = ({ value, onChange: fieldOnChange, name, id }) => {
    const base = String(name || id || '').trim();
    const safe = base ? base.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') : '';
    return (
      <AssetPickerField
        value={value || ''}
        onChange={(nextValue) => {
          if (isBlobMediaReference(nextValue)) {
            toast.error('Blob preview URLs cannot be saved. Upload the file to the media library first.');
            return;
          }
          if (isInlineImageDataUrl(nextValue)) {
            toast.error('Inline image data URLs cannot be saved. Upload the image to the media library first.');
            return;
          }
          fieldOnChange(nextValue);
        }}
        accept={accept}
        autoUploadOnDrop={autoUploadOnDrop}
        autoSelectSingleUpload={autoSelectSingleUpload}
        testIdBase={safe || undefined}
      />
    );
  };
  return {
    type: 'custom' as const,
    render
  };
}
