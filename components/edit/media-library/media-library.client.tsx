/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Copy, Grid2X2, List, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildAssetUrl,
  createAssetFolder,
  deleteAssets,
  isDemoEditorAssetMode,
  listAssets,
  listAssetFolders,
  updateAssetMetadata,
  uploadFile,
  type AssetFolderItem
} from '@/lib/uploads';
import { MediaLibraryAssets } from './media-library.assets';
import { MediaLibraryDialogs } from './media-library.dialogs';
import { MediaLibrarySidebar } from './media-library.sidebar';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import {
  FOLDER_ALL,
  FOLDER_ROOT,
  PAGE_SIZE,
  readImageDimensions,
  resolveFolderParam,
  resolveMimePrefix,
  type AssetListItem,
  type MimeFilter,
  type SortMode,
  type ViewMode
} from './media-library.types';

export function MediaLibraryClient() {
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<MimeFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [folderFilter, setFolderFilter] = useState<string>(FOLDER_ALL);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadBatch, setUploadBatch] = useState<{ current: number; total: number } | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[] | null>(null);
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadFolder, setUploadFolder] = useState<string>(FOLDER_ROOT);

  const [folders, setFolders] = useState<AssetFolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderLabel, setNewFolderLabel] = useState('');

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [bulkFolder, setBulkFolder] = useState<string>(FOLDER_ROOT);

  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const [draftFolder, setDraftFolder] = useState<string>(FOLDER_ROOT);
  const [saving, setSaving] = useState(false);

  const [confirmDeleteKeys, setConfirmDeleteKeys] = useState<string[] | null>(null);
  const [backToEditorHref, setBackToEditorHref] = useState('/edit');

  const mimePrefix = useMemo(() => resolveMimePrefix(filter), [filter]);

  const loadFolders = useCallback(async () => {
    setFoldersLoading(true);
    try {
      setFolders(await listAssetFolders());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load folders');
    } finally {
      setFoldersLoading(false);
    }
  }, []);

  const fetchAssets = useCallback(
    async (options?: { reset?: boolean; q?: string; cursor?: string | null }) => {
      const reset = Boolean(options?.reset);
      setLoading(true);
      try {
        const qValue = typeof options?.q === 'string' ? options.q : query;
        const folderValue = resolveFolderParam(folderFilter) ?? undefined;
        const data = await listAssets({
          q: qValue.trim() || undefined,
          mimePrefix: mimePrefix || undefined,
          folder: typeof folderValue === 'string' ? folderValue : null,
          limit: PAGE_SIZE,
          sort,
          cursor: !reset && typeof options?.cursor === 'string' && options.cursor ? options.cursor : null
        });
        setItems((prev) => (reset ? data.items || [] : [...prev, ...(data.items || [])]));
        setCursor(data.nextCursor || null);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    },
    [folderFilter, mimePrefix, query, sort]
  );

  const didInitialLoad = useRef(false);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    void fetchAssets({ reset: true, cursor: null });
  }, [fetchAssets]);

  useEffect(() => {
    if (!isDemoEditorAssetMode()) return;
    const pathname = window.location.pathname;
    setBackToEditorHref(pathname.startsWith('/demo/') ? '/demo/new' : '/new');
  }, []);

  // Debounced reload for search/filter/sort/folder.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCursor(null);
      void fetchAssets({ reset: true, cursor: null });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, folderFilter, filter, sort, fetchAssets]);

  const uploadSingle = async (file: File, options: { allowCustomName: boolean }) => {
    const name =
      options.allowCustomName && uploadName.trim()
        ? uploadName.trim()
        : file.name.replace(/\.[^/.]+$/, '');
    const caption = uploadCaption.trim() || undefined;
    const alt = uploadAlt.trim() || undefined;
    const folderValue = resolveFolderParam(uploadFolder);
    const dims = await readImageDimensions(file);
    const uploaded = await uploadFile(file, {
      name,
      caption,
      alt,
      folder: folderValue && typeof folderValue === 'string' ? folderValue : undefined,
      width: dims.width,
      height: dims.height,
      onProgress: (progress) => setUploadProgress(progress)
    });
    setItems((prev) => [
      {
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
      },
      ...prev.filter((item) => item.key !== uploaded.key)
    ]);
  };

  const runQueuedUpload = async () => {
    const files = queuedFiles || [];
    if (files.length === 0) {
      toast.error('Choose files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadBatch({ current: 1, total: files.length });

    try {
      for (let index = 0; index < files.length; index += 1) {
        setUploadBatch({ current: index + 1, total: files.length });
        setUploadProgress(0);
        await uploadSingle(files[index], { allowCustomName: files.length === 1 });
      }
      toast.success(files.length === 1 ? 'Uploaded to media library' : `Uploaded ${files.length} files`);
      setQueuedFiles(null);
      setUploadName('');
      setUploadCaption('');
      setUploadAlt('');
      setCursor(null);
      await fetchAssets({ reset: true, q: '', cursor: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(null);
      setUploadBatch(null);
    }
  };

  const handleCopy = async (key: string) => {
    await navigator.clipboard.writeText(buildAssetUrl(key));
    toast.success('Copied asset URL');
  };

  const toggleSelected = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const clearSelection = () => setSelectedKeys(new Set());

  const startEditing = (item: AssetListItem) => {
    setEditKey(item.key);
    setDraftName(item.name || '');
    setDraftCaption(item.caption || '');
    setDraftAlt(item.alt || '');
    setDraftFolder(item.folder ? item.folder : FOLDER_ROOT);
  };

  const saveEditing = async () => {
    if (!editKey) return;
    setSaving(true);
    try {
      const folderValue = draftFolder === FOLDER_ROOT ? '' : draftFolder;
      const payload = await updateAssetMetadata(editKey, {
        name: draftName.trim(),
        caption: draftCaption.trim(),
        alt: draftAlt.trim(),
        folder: folderValue
      });
      setItems((prev) =>
        prev.map((item) =>
          item.key === editKey
            ? { ...item, name: payload.name, caption: payload.caption, alt: payload.alt, folder: payload.folder }
            : item
        )
      );
      setEditKey(null);
      toast.success('Updated asset');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async () => {
    const keys = confirmDeleteKeys || [];
    if (!keys.length) return;
    setConfirmDeleteKeys(null);
    try {
      await deleteAssets(keys);
      setItems((prev) => prev.filter((item) => !keys.includes(item.key)));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const key of keys) next.delete(key);
        return next;
      });
      toast.success(keys.length === 1 ? 'Deleted asset' : `Deleted ${keys.length} assets`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const runBulkMove = async () => {
    const keys = Array.from(selectedKeys.values());
    if (!keys.length) return;
    const folderValue = bulkFolder === FOLDER_ROOT ? '' : bulkFolder;
    try {
      await Promise.all(keys.map((key) => updateAssetMetadata(key, { folder: folderValue })));
      setItems((prev) =>
        prev.map((item) =>
          keys.includes(item.key) ? { ...item, folder: folderValue || undefined } : item
        )
      );
      toast.success(keys.length === 1 ? 'Moved asset' : `Moved ${keys.length} assets`);
      clearSelection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk move failed');
    }
  };

  const handleCreateFolder = async () => {
    const rawPath = newFolderPath.trim();
    if (!rawPath) {
      toast.error('Folder path required');
      return;
    }
    setCreatingFolder(true);
    try {
      const created = await createAssetFolder({ path: rawPath, label: newFolderLabel.trim() || undefined });
      setNewFolderPath('');
      setNewFolderLabel('');
      setShowCreateFolder(false);
      await loadFolders();
      setFolderFilter(created.path);
      setUploadFolder(created.path);
      toast.success('Folder created');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create folder');
    } finally {
      setCreatingFolder(false);
    }
  };

  const activeFolderLabel = useMemo(() => {
    if (folderFilter === FOLDER_ALL) return 'All files';
    if (folderFilter === FOLDER_ROOT) return 'Root';
    const folder = folders.find((item) => item.path === folderFilter);
    return folder?.label ? `${folder.label} (${folder.path})` : folderFilter;
  }, [folderFilter, folders]);

  const selectedArray = useMemo(() => Array.from(selectedKeys.values()), [selectedKeys]);

  return (
    <div className="container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--vd-fg)]">Media Library</h1>
        <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Upload, organize, and reuse assets across your site.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <MediaLibrarySidebar
          folderFilter={folderFilter}
          onFolderChange={setFolderFilter}
          folders={folders}
          foldersLoading={foldersLoading}
          onCreateFolder={() => setShowCreateFolder(true)}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--vd-border)] bg-white/70 p-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--vd-muted-fg)]">Browsing</p>
              <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{activeFolderLabel}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-[220px]"
                placeholder="Search by name, caption, key"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={filter} onValueChange={(value) => setFilter(value as MimeFilter)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(value) => setSort(value as SortMode)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
              <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
                <TabsList>
                  <TabsTrigger value="grid" aria-label="Grid view">
                    <Grid2X2 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger value="list" aria-label="List view">
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Card>
            <CardHeader className="space-y-3">
              <CardTitle className="text-sm">Uploads</CardTitle>
              {selectedArray.length ? (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">{selectedArray.length} selected</Badge>
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={bulkFolder} onValueChange={setBulkFolder}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Move to folder" />
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
                    <Button variant="outline" size="sm" onClick={() => void runBulkMove()}>
                      Move
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setConfirmDeleteKeys(selectedArray)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              ) : null}

              {uploadProgress !== null ? (
                <div className="flex items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadBatch ? `Uploading ${uploadBatch.current}/${uploadBatch.total} ` : null}
                  {uploadProgress}%
                </div>
              ) : null}

              <Dropzone
                src={queuedFiles || undefined}
                onDrop={(acceptedFiles) => setQueuedFiles(acceptedFiles)}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'],
                  'application/pdf': ['.pdf']
                }}
                maxSize={25 * 1024 * 1024}
                maxFiles={30}
                disabled={uploading}
                onError={(error) => toast.error(error.message)}
                className="bg-white"
              >
                <DropzoneContent />
                <DropzoneEmptyState />
              </Dropzone>

              <div className="grid gap-2 sm:grid-cols-3">
                <Input
                  placeholder={queuedFiles && queuedFiles.length > 1 ? 'File name (single file only)' : 'File name (library)'}
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  disabled={uploading || Boolean(queuedFiles && queuedFiles.length > 1)}
                />
                <Input
                  placeholder="Caption (optional)"
                  value={uploadCaption}
                  onChange={(e) => setUploadCaption(e.target.value)}
                  disabled={uploading}
                />
                <Input
                  placeholder="Alt text (recommended)"
                  value={uploadAlt}
                  onChange={(e) => setUploadAlt(e.target.value)}
                  disabled={uploading}
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={uploadFolder} onValueChange={setUploadFolder} disabled={uploading}>
                  <SelectTrigger className="w-[260px]">
                    <SelectValue placeholder="Upload folder" />
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
                <Button variant="outline" onClick={() => void loadFolders()} disabled={foldersLoading}>
                  Refresh folders
                </Button>
                <Button onClick={() => void runQueuedUpload()} disabled={uploading || !queuedFiles?.length}>
                  {uploading ? 'Uploading…' : queuedFiles?.length ? `Upload ${queuedFiles.length}` : 'Upload'}
                </Button>
                {queuedFiles?.length ? (
                  <Button variant="ghost" onClick={() => setQueuedFiles(null)} disabled={uploading}>
                    Clear selection
                  </Button>
                ) : null}
              </div>
              <p className="text-xs text-[var(--vd-muted-fg)]">
                Tip: keep names and alt text human. It improves search, accessibility, and reuse.
              </p>
            </CardHeader>
            <CardContent>
              {items.length === 0 && !loading ? (
                <p className="text-sm text-[var(--vd-muted-fg)]">No uploads found.</p>
              ) : (
                <MediaLibraryAssets
                  items={items}
                  viewMode={viewMode}
                  selectedKeys={selectedKeys}
                  onToggleSelected={toggleSelected}
                  onPreview={setPreviewKey}
                  onCopy={(key) => void handleCopy(key)}
                  onEdit={startEditing}
                  onDelete={(key) => setConfirmDeleteKeys([key])}
                />
              )}

              <div className="mt-6 flex items-center justify-center">
                {cursor ? (
                  <Button variant="outline" onClick={() => void fetchAssets({ reset: false, cursor })} disabled={loading}>
                    {loading ? 'Loading…' : 'Load more'}
                  </Button>
                ) : items.length ? (
                  <p className="text-xs text-[var(--vd-muted-fg)]">No more results.</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader className="space-y-1">
              <CardTitle className="text-sm">Quick actions</CardTitle>
              <p className="text-xs text-[var(--vd-muted-fg)]">
                Copy the raw URL for embedding, or open the file in a new tab.
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => void loadFolders()} disabled={foldersLoading}>
                Refresh folders
              </Button>
              <Button variant="outline" onClick={() => void fetchAssets({ reset: true })} disabled={loading}>
                Refresh assets
              </Button>
              <Button variant="outline" asChild>
                <Link href={backToEditorHref} prefetch={false}>
                  Back to page editor
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <MediaLibraryDialogs
        folders={folders}
        showCreateFolder={showCreateFolder}
        setShowCreateFolder={setShowCreateFolder}
        creatingFolder={creatingFolder}
        newFolderPath={newFolderPath}
        setNewFolderPath={setNewFolderPath}
        newFolderLabel={newFolderLabel}
        setNewFolderLabel={setNewFolderLabel}
        onCreateFolder={() => void handleCreateFolder()}
        editKey={editKey}
        setEditKey={setEditKey}
        draftName={draftName}
        setDraftName={setDraftName}
        draftCaption={draftCaption}
        setDraftCaption={setDraftCaption}
        draftAlt={draftAlt}
        setDraftAlt={setDraftAlt}
        draftFolder={draftFolder}
        setDraftFolder={setDraftFolder}
        saving={saving}
        onSaveEdit={() => void saveEditing()}
        previewKey={previewKey}
        setPreviewKey={setPreviewKey}
        onCopy={(key) => void handleCopy(key)}
        onEditFromPreview={(key) => {
          const item = items.find((i) => i.key === key);
          if (item) startEditing(item);
          else setEditKey(key);
        }}
        onDeleteFromPreview={(key) => setConfirmDeleteKeys([key])}
        confirmDeleteKeys={confirmDeleteKeys}
        setConfirmDeleteKeys={setConfirmDeleteKeys}
        onConfirmDelete={() => void runDelete()}
      />
    </div>
  );
}
