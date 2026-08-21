/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Grid2X2, List, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  buildAssetUrl,
  createAssetFolder,
  deleteAssetFolder,
  deleteAssets,
  listAssetFolders,
  listAssetTags,
  listAssetUsage,
  replaceAssetFile,
  restoreAssets,
  updateAssetFolder,
  updateAssetMetadata,
  uploadFile,
  type AssetFolderItem,
  type AssetUsageItem,
  type AssetTagItem
} from '@/lib/uploads';
import { formatAssetTags } from '@/lib/assets/tags';
import { MediaLibraryAssets } from './media-library.assets';
import { MediaLibraryBulkEditDialog, type BulkMetadataPayload } from './media-library.bulk-edit-dialog';
import { MediaLibraryDialogs } from './media-library.dialogs';
import { MediaLibrarySidebar } from './media-library.sidebar';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import {
  FOLDER_ALL,
  FOLDER_ROOT,
  FOLDER_TRASH,
  PAGE_SIZE,
  TAG_FILTER_ALL,
  parseTagInput,
  readImageDimensions,
  resolveFolderParam,
  resolveMimePrefix,
  type AssetListItem,
  type MimeFilter,
  type SortMode,
  type ViewMode
} from './media-library.types';

type MetadataFilter = 'all' | 'missing-caption' | 'missing-alt' | 'missing-metadata';

export function MediaLibraryClient() {
  const [items, setItems] = useState<AssetListItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [query, setQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filter, setFilter] = useState<MimeFilter>('all');
  const [sort, setSort] = useState<SortMode>('newest');
  const [folderFilter, setFolderFilter] = useState<string>(FOLDER_ALL);
  const [tagFilter, setTagFilter] = useState<string>(TAG_FILTER_ALL);
  const [metadataFilter, setMetadataFilter] = useState<MetadataFilter>('all');
  const inTrashView = folderFilter === FOLDER_TRASH;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadBatch, setUploadBatch] = useState<{ current: number; total: number } | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[] | null>(null);
  const [uploadPanelOpen, setUploadPanelOpen] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFolder, setUploadFolder] = useState<string>(FOLDER_ROOT);

  const [folders, setFolders] = useState<AssetFolderItem[]>([]);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [tags, setTags] = useState<AssetTagItem[]>([]);
  const [tagsLoading, setTagsLoading] = useState(false);

  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [newFolderLabel, setNewFolderLabel] = useState('');
  const [newFolderDescription, setNewFolderDescription] = useState('');
  const [showBulkMetadataEdit, setShowBulkMetadataEdit] = useState(false);
  const [bulkMetadataSaving, setBulkMetadataSaving] = useState(false);
  const [emptyingTrash, setEmptyingTrash] = useState(false);

  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(() => new Set());
  const [draggingKeys, setDraggingKeys] = useState<string[]>([]);
  const [bulkFolder, setBulkFolder] = useState<string>(FOLDER_ROOT);
  const lastSelectedIndexRef = useRef<number | null>(null);

  const [usageByKey, setUsageByKey] = useState<Record<string, AssetUsageItem>>({});
  const [usageDialogKey, setUsageDialogKey] = useState<string | null>(null);
  const [usageDialogLoading, setUsageDialogLoading] = useState(false);
  const [usagePrefetching, setUsagePrefetching] = useState(false);
  const [deleteUsageLoading, setDeleteUsageLoading] = useState(false);

  const [previewKey, setPreviewKey] = useState<string | null>(null);

  const [editKey, setEditKey] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<AssetListItem | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCaption, setDraftCaption] = useState('');
  const [draftAlt, setDraftAlt] = useState('');
  const [draftTags, setDraftTags] = useState('');
  const [draftFolder, setDraftFolder] = useState<string>(FOLDER_ROOT);
  const [draftFocalX, setDraftFocalX] = useState<number | undefined>(undefined);
  const [draftFocalY, setDraftFocalY] = useState<number | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [replacingFile, setReplacingFile] = useState(false);

  const [confirmDeleteKeys, setConfirmDeleteKeys] = useState<string[] | null>(null);
  const [altProviderInfo, setAltProviderInfo] = useState<{ configured: boolean; envVar: string } | null>(null);
  const [altGenerationLoading, setAltGenerationLoading] = useState(false);
  const [altApplying, setAltApplying] = useState(false);
  const [altGenerationPreview, setAltGenerationPreview] = useState('');
  const [altGenerationError, setAltGenerationError] = useState('');

  const mimePrefix = useMemo(() => resolveMimePrefix(filter), [filter]);

  const handleFolderFilterChange = useCallback((nextFolder: string) => {
    setFolderFilter(nextFolder);
    // Keep upload target aligned with the folder being browsed to avoid accidental root uploads.
    if (nextFolder !== FOLDER_ALL && nextFolder !== FOLDER_TRASH) {
      setUploadFolder(nextFolder);
    }
  }, []);

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

  const loadTags = useCallback(
    async (statusOverride?: 'active' | 'trashed' | 'all') => {
      setTagsLoading(true);
      try {
        const folderParam = folderFilter === FOLDER_ALL || folderFilter === FOLDER_TRASH ? undefined : resolveFolderParam(folderFilter) ?? undefined;
        const items = await listAssetTags({
          status: statusOverride || (inTrashView ? 'trashed' : 'active'),
          folder: folderParam
        });
        setTags(items);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load tags');
      } finally {
        setTagsLoading(false);
      }
    },
    [folderFilter, inTrashView]
  );

  const mergeUsageItems = useCallback((usageItems: AssetUsageItem[]) => {
    if (!usageItems.length) return;
    setUsageByKey((prev) => {
      const next = { ...prev };
      for (const item of usageItems) {
        if (!item?.key) continue;
        next[item.key] = item;
      }
      return next;
    });
  }, []);

  const fetchUsageForKeys = useCallback(
    async (keys: string[]) => {
      const unique = Array.from(new Set(keys.map((key) => key.trim()).filter((key) => key.startsWith('uploads/'))));
      if (!unique.length || inTrashView) return;
      const usageItems = await listAssetUsage(unique);
      mergeUsageItems(usageItems);
    },
    [inTrashView, mergeUsageItems]
  );

  const fetchAssets = useCallback(
    async (options?: { reset?: boolean; q?: string; cursor?: string | null }) => {
      const reset = Boolean(options?.reset);
      setLoading(true);
      try {
        const url = new URL('/api/assets/list', window.location.origin);
        const liveCaptureParams = new URLSearchParams(window.location.search);
        if (liveCaptureParams.get('capture') === '1' && liveCaptureParams.get('live') === '1') {
          const video = liveCaptureParams.get('video');
          if (video) {
            url.searchParams.set('capture', '1');
            url.searchParams.set('live', '1');
            url.searchParams.set('video', video);
          }
        }
        const qValue = typeof options?.q === 'string' ? options.q : query;
        const isTrashFolder = folderFilter === FOLDER_TRASH;
        const folderValue = isTrashFolder ? undefined : resolveFolderParam(folderFilter) ?? undefined;
        const tagValue = tagFilter === TAG_FILTER_ALL ? '' : tagFilter;
        if (qValue.trim()) url.searchParams.set('q', qValue.trim());
        if (mimePrefix) url.searchParams.set('mimePrefix', mimePrefix);
        if (tagValue) url.searchParams.set('tag', tagValue);
        if (metadataFilter === 'missing-caption') url.searchParams.set('missing', 'caption');
        if (metadataFilter === 'missing-alt') url.searchParams.set('missing', 'alt');
        if (metadataFilter === 'missing-metadata') url.searchParams.set('missing', 'metadata');
        url.searchParams.set('status', isTrashFolder ? 'trashed' : 'active');
        if (typeof folderValue === 'string') url.searchParams.set('folder', folderValue);
        url.searchParams.set('limit', String(PAGE_SIZE));
        url.searchParams.set('sort', sort);
        if (!reset && typeof options?.cursor === 'string' && options.cursor) {
          url.searchParams.set('cursor', options.cursor);
        }
        const res = await fetch(url.toString(), { cache: 'no-store' });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error || 'Failed to load assets');
        setItems((prev) => (reset ? data.items || [] : [...prev, ...(data.items || [])]));
        setCursor(data.nextCursor || null);
        if (typeof data?.total === 'number' && Number.isFinite(data.total) && data.total >= 0) {
          setTotalCount(data.total);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load assets');
      } finally {
        setLoading(false);
      }
    },
    [folderFilter, metadataFilter, mimePrefix, query, sort, tagFilter]
  );

  const didInitialLoad = useRef(false);

  useEffect(() => {
    void loadFolders();
  }, [loadFolders]);

  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  useEffect(() => {
    if (didInitialLoad.current) return;
    didInitialLoad.current = true;
    void fetchAssets({ reset: true, cursor: null });
  }, [fetchAssets]);

  // Debounced reload for search/filter/sort/folder.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setCursor(null);
      void fetchAssets({ reset: true, cursor: null });
    }, 350);
    return () => window.clearTimeout(handle);
  }, [query, folderFilter, filter, sort, tagFilter, metadataFilter, fetchAssets]);

  useEffect(() => {
    if (tagFilter === TAG_FILTER_ALL) return;
    if (tags.some((item) => item.tag === tagFilter)) return;
    setTagFilter(TAG_FILTER_ALL);
  }, [tagFilter, tags]);

  useEffect(() => {
    setSelectedKeys((prev) => {
      if (prev.size === 0) return prev;
      const visible = new Set(items.map((item) => item.key));
      const next = new Set(Array.from(prev).filter((key) => visible.has(key)));
      if (next.size === prev.size) return prev;
      return next;
    });
  }, [items]);

  useEffect(() => {
    if (inTrashView || items.length === 0) {
      setUsagePrefetching(false);
      return;
    }
    const keys = items.map((item) => item.key);
    let canceled = false;
    setUsagePrefetching(true);
    void (async () => {
      try {
        const usageItems = await listAssetUsage(keys);
        if (canceled) return;
        mergeUsageItems(usageItems);
      } catch {
        // Non-blocking; usage badges are best effort.
      } finally {
        if (!canceled) {
          setUsagePrefetching(false);
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [inTrashView, items, mergeUsageItems]);

  useEffect(() => {
    if (uploading || uploadProgress !== null || (queuedFiles?.length ?? 0) > 0) {
      setUploadPanelOpen(true);
    }
  }, [queuedFiles, uploadProgress, uploading]);

  useEffect(() => {
    if (inTrashView && showBulkMetadataEdit) {
      setShowBulkMetadataEdit(false);
    }
  }, [inTrashView, showBulkMetadataEdit]);

  useEffect(() => {
    if (!usageDialogKey) {
      setUsageDialogLoading(false);
    }
  }, [usageDialogKey]);

  useEffect(() => {
    if (!usageDialogKey || inTrashView || usageByKey[usageDialogKey]) return;
    let canceled = false;
    setUsageDialogLoading(true);
    void (async () => {
      try {
        await fetchUsageForKeys([usageDialogKey]);
      } catch {
        // Keep dialog usable even if usage lookups fail.
      } finally {
        if (!canceled) {
          setUsageDialogLoading(false);
        }
      }
    })();
    return () => {
      canceled = true;
    };
  }, [fetchUsageForKeys, inTrashView, usageByKey, usageDialogKey]);

  const uploadSingle = async (file: File, options: { allowCustomName: boolean }) => {
    const name =
      options.allowCustomName && uploadName.trim()
        ? uploadName.trim()
        : file.name.replace(/\.[^/.]+$/, '');
    const caption = uploadCaption.trim() || undefined;
    const alt = uploadAlt.trim() || undefined;
    const tagsValue = parseTagInput(uploadTags);
    const folderValue = resolveFolderParam(uploadFolder);
    const dims = await readImageDimensions(file);
    const uploaded = await uploadFile(file, {
      name,
      caption,
      alt,
      tags: tagsValue,
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
        tags: uploaded.tags,
        altSource: uploaded.altSource,
        altGeneratedAt: uploaded.altGeneratedAt,
        altModel: uploaded.altModel,
        altNeedsReview: uploaded.altNeedsReview,
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
      setUploadTags('');
      setCursor(null);
      await fetchAssets({ reset: true, q: '', cursor: null });
      await loadFolders();
      await loadTags();
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

  const toggleSelected = useCallback(
    (key: string, options: { index: number; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => {
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        const index = options.index;
        const hasAnchor = typeof lastSelectedIndexRef.current === 'number';
        const shouldRangeSelect = options.shiftKey && hasAnchor && index >= 0;
        const shouldToggle = options.metaKey || options.ctrlKey;
        if (shouldRangeSelect) {
          const anchor = lastSelectedIndexRef.current as number;
          const start = Math.min(anchor, index);
          const end = Math.max(anchor, index);
          if (!shouldToggle) {
            next.clear();
          }
          for (let i = start; i <= end; i += 1) {
            const item = items[i];
            if (item?.key) next.add(item.key);
          }
        } else {
          if (shouldToggle) {
            if (next.has(key)) next.delete(key);
            else next.add(key);
          } else {
            next.clear();
            next.add(key);
          }
        }
        if (index >= 0) {
          lastSelectedIndexRef.current = index;
        }
        return next;
      });
    },
    [items]
  );

  const clearSelection = useCallback(() => {
    setSelectedKeys(new Set());
    lastSelectedIndexRef.current = null;
  }, []);

  const closeEditing = useCallback(() => {
    setEditKey(null);
    setEditItem(null);
    setDraftName('');
    setDraftCaption('');
    setDraftAlt('');
    setDraftTags('');
    setDraftFolder(FOLDER_ROOT);
    setDraftFocalX(undefined);
    setDraftFocalY(undefined);
    setAltProviderInfo(null);
    setAltGenerationLoading(false);
    setAltGenerationError('');
    setAltGenerationPreview('');
    setAltApplying(false);
    setReplacingFile(false);
  }, []);

  const startEditing = (item: AssetListItem) => {
    setEditKey(item.key);
    setEditItem(item);
    setDraftName(item.name || '');
    setDraftCaption(item.caption || '');
    setDraftAlt(item.alt || '');
    setDraftTags(formatAssetTags(item.tags));
    setDraftFolder(item.folder ? item.folder : FOLDER_ROOT);
    setDraftFocalX(item.focalX);
    setDraftFocalY(item.focalY);
    const isImage = (item.mime || '').startsWith('image/');
    if (isImage) {
      void (async () => {
        setAltProviderInfo(null);
        setAltGenerationPreview('');
        setAltGenerationError('');
        try {
          const res = await fetch(`/api/assets/${encodeURIComponent(item.key)}/generate-alt`);
          const payload = await res.json().catch(() => ({}));
          setAltProviderInfo({
            configured: payload?.configured === true && res.ok,
            envVar: typeof payload?.envVar === 'string' ? payload.envVar : 'OPENAI_API_KEY'
          });
        } catch {
          setAltProviderInfo({ configured: false, envVar: 'OPENAI_API_KEY' });
        }
      })();
    } else {
      setAltProviderInfo(null);
    }
  };

  const saveEditing = async () => {
    if (!editKey) return;
    setSaving(true);
    try {
      const folderValue = draftFolder === FOLDER_ROOT ? '' : draftFolder;
      const isEditingImage = (editItem?.mime || '').startsWith('image/');
      const payload = await updateAssetMetadata(editKey, {
        name: draftName.trim(),
        caption: draftCaption.trim(),
        alt: draftAlt.trim(),
        tags: parseTagInput(draftTags),
        folder: folderValue,
        ...(isEditingImage ? { focalX: draftFocalX, focalY: draftFocalY } : {})
      });
      setItems((prev) =>
        prev.map((item) =>
          item.key === editKey
            ? {
                ...item,
                name: payload.name,
                caption: payload.caption,
                alt: payload.alt,
                tags: payload.tags,
                altSource: payload.altSource,
                altGeneratedAt: payload.altGeneratedAt,
                altModel: payload.altModel,
                altNeedsReview: payload.altNeedsReview,
                folder: payload.folder,
                focalX: payload.focalX,
                focalY: payload.focalY
              }
            : item
        )
      );
      closeEditing();
      await loadFolders();
      await loadTags();
      toast.success('Updated asset');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleReplaceFile = async (file: File) => {
    if (!editKey) return;
    setReplacingFile(true);
    try {
      const dimensions = await readImageDimensions(file);
      const payload = await replaceAssetFile(editKey, file, {
        width: dimensions.width,
        height: dimensions.height
      });
      setItems((prev) =>
        prev.map((item) =>
          item.key === editKey
            ? {
                ...item,
                name: payload.name,
                caption: payload.caption,
                alt: payload.alt,
                tags: payload.tags,
                altSource: payload.altSource,
                altGeneratedAt: payload.altGeneratedAt,
                altModel: payload.altModel,
                altNeedsReview: payload.altNeedsReview,
                folder: payload.folder,
                mime: payload.mime,
                size: payload.size,
                width: payload.width,
                height: payload.height,
                focalX: payload.focalX,
                focalY: payload.focalY
              }
            : item
        )
      );
      setEditItem((prev) =>
        prev && prev.key === editKey
          ? {
              ...prev,
              name: payload.name,
              caption: payload.caption,
              alt: payload.alt,
              tags: payload.tags,
              altSource: payload.altSource,
              altGeneratedAt: payload.altGeneratedAt,
              altModel: payload.altModel,
              altNeedsReview: payload.altNeedsReview,
              folder: payload.folder,
              mime: payload.mime,
              size: payload.size,
              width: payload.width,
              height: payload.height,
              focalX: payload.focalX,
              focalY: payload.focalY
            }
          : prev
      );
      toast.success('Replaced file. Existing URL references were preserved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to replace file');
    } finally {
      setReplacingFile(false);
    }
  };

  const handleGenerateAlt = async () => {
    if (!editKey || !activeEditIsImage) return;
    if (!altProviderInfo?.configured) {
      const envVar = altProviderInfo?.envVar || 'OPENAI_API_KEY';
      toast.error(`Generate alt text unavailable. Configure ${envVar} to enable.`);
      return;
    }
    setAltGenerationLoading(true);
    setAltGenerationError('');
    setAltGenerationPreview('');
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(editKey)}/generate-alt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apply: false })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to generate alt text');
      }
      if (typeof payload?.alt === 'string' && payload.alt.trim()) {
        setAltGenerationPreview(payload.alt.trim());
        toast.success('Alt text preview generated');
      } else {
        throw new Error('No alt text returned');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate alt text';
      setAltGenerationError(message);
      toast.error(message);
    } finally {
      setAltGenerationLoading(false);
    }
  };

  const applyGeneratedAlt = async () => {
    if (!editKey || !activeEditIsImage || !altGenerationPreview.trim()) return;
    setAltApplying(true);
    setAltGenerationError('');
    try {
      const res = await fetch(`/api/assets/${encodeURIComponent(editKey)}/generate-alt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ apply: true, alt: altGenerationPreview })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'Failed to apply generated alt text');
      }
      const alt = typeof payload?.alt === 'string' ? payload.alt : altGenerationPreview;
      setItems((prev) =>
        prev.map((item) =>
          item.key === editKey
            ? {
                ...item,
                alt,
                altSource: payload?.altSource || item.altSource,
                altGeneratedAt: payload?.altGeneratedAt,
                altModel: payload?.altModel,
                altNeedsReview: payload?.altNeedsReview
              }
            : item
        )
      );
      setDraftAlt(alt);
      setAltGenerationPreview('');
      toast.success('Applied generated alt text');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply generated alt text';
      setAltGenerationError(message);
      toast.error(message);
    } finally {
      setAltApplying(false);
    }
  };

  const runDelete = async () => {
    const keys = confirmDeleteKeys || [];
    if (!keys.length) return;
    setConfirmDeleteKeys(null);
    try {
      await deleteAssets(keys, { permanent: inTrashView });
      setItems((prev) => prev.filter((item) => !keys.includes(item.key)));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const key of keys) next.delete(key);
        return next;
      });
      setUsageByKey((prev) => {
        const next = { ...prev };
        for (const key of keys) delete next[key];
        return next;
      });
      if (inTrashView) {
        toast.success(keys.length === 1 ? 'Deleted permanently' : `Deleted ${keys.length} assets permanently`);
      } else {
        toast.success(keys.length === 1 ? 'Moved asset to trash' : `Moved ${keys.length} assets to trash`);
      }
      await loadFolders();
      await loadTags();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed');
    }
  };

  const runRestore = async (keys: string[]) => {
    if (!keys.length) return;
    try {
      await restoreAssets(keys);
      setItems((prev) => prev.filter((item) => !keys.includes(item.key)));
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        for (const key of keys) next.delete(key);
        return next;
      });
      toast.success(keys.length === 1 ? 'Restored asset' : `Restored ${keys.length} assets`);
      await loadFolders();
      await loadTags();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Restore failed');
    }
  };

  const runEmptyTrash = async () => {
    if (!inTrashView) return;
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm('Empty Trash permanently? This cannot be undone.');
      if (!confirmed) return;
    }
    setEmptyingTrash(true);
    try {
      await deleteAssets([], { permanent: true, emptyTrash: true });
      setItems([]);
      clearSelection();
      setCursor(null);
      await fetchAssets({ reset: true, cursor: null });
      await loadFolders();
      await loadTags();
      toast.success('Trash emptied');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to empty trash');
    } finally {
      setEmptyingTrash(false);
    }
  };

  const runBulkMetadataEdit = async (payload: BulkMetadataPayload) => {
    const keys = Array.from(selectedKeys.values());
    if (!keys.length) return;
    if (!payload.applyCaption && !payload.applyAlt && !payload.applyTags) {
      toast.error('Choose at least one metadata field to update');
      return;
    }
    const normalizedTags = parseTagInput(payload.tags);
    if (payload.applyTags && payload.tagMode !== 'replace' && normalizedTags.length === 0) {
      toast.error('Enter at least one tag to add or remove');
      return;
    }

    const itemByKey = new Map(items.map((item) => [item.key, item] as const));

    setBulkMetadataSaving(true);
    try {
      const results = await Promise.all(
        keys.map(async (key) => {
          const updates: { caption?: string; alt?: string; tags?: string[] } = {};
          if (payload.applyCaption) updates.caption = payload.caption.trim();
          if (payload.applyAlt) updates.alt = payload.alt.trim();
          if (payload.applyTags) {
            const existingTags = parseTagInput((itemByKey.get(key)?.tags || []).join(','));
            if (payload.tagMode === 'replace') {
              updates.tags = normalizedTags;
            } else if (payload.tagMode === 'add') {
              updates.tags = parseTagInput([...existingTags, ...normalizedTags].join(','));
            } else {
              const removed = new Set(normalizedTags);
              updates.tags = existingTags.filter((tag) => !removed.has(tag));
            }
          }
          const updated = await updateAssetMetadata(key, updates);
          return [key, updated] as const;
        })
      );
      const resultMap = new Map(results);
      setItems((prev) =>
        prev.map((item) => {
          const updated = resultMap.get(item.key);
          if (!updated) return item;
          return {
            ...item,
            caption: updated.caption,
            alt: updated.alt,
            tags: updated.tags,
            altSource: updated.altSource,
            altGeneratedAt: updated.altGeneratedAt,
            altModel: updated.altModel,
            altNeedsReview: updated.altNeedsReview
          };
        })
      );
      setShowBulkMetadataEdit(false);
      clearSelection();
      await loadTags();
      toast.success(keys.length === 1 ? 'Updated metadata' : `Updated metadata for ${keys.length} assets`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Bulk metadata update failed');
    } finally {
      setBulkMetadataSaving(false);
    }
  };

  const runBulkMove = async (options?: { keys?: string[]; folder?: string; preserveSelection?: boolean }) => {
    const keys = options?.keys?.length ? options.keys : Array.from(selectedKeys.values());
    if (!keys.length) return;
    const destination = options?.folder ?? bulkFolder;
    const folderValue = destination === FOLDER_ROOT ? '' : destination;
    try {
      await Promise.all(keys.map((key) => updateAssetMetadata(key, { folder: folderValue })));
      setItems((prev) =>
        prev.map((item) =>
          keys.includes(item.key) ? { ...item, folder: folderValue || undefined } : item
        )
      );
      await loadFolders();
      await loadTags();
      toast.success(keys.length === 1 ? 'Moved asset' : `Moved ${keys.length} assets`);
      if (!options?.preserveSelection) {
        clearSelection();
      }
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
      const created = await createAssetFolder({
        path: rawPath,
        label: newFolderLabel.trim() || undefined,
        description: newFolderDescription.trim() || undefined
      });
      setNewFolderPath('');
      setNewFolderLabel('');
      setNewFolderDescription('');
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

  const handleEditFolder = async (folder: AssetFolderItem) => {
    if (typeof window === 'undefined') return;
    const nextPathInput = window.prompt('Folder path', folder.path);
    if (nextPathInput === null) return;
    const nextLabelInput = window.prompt('Folder label (optional)', folder.label || '');
    if (nextLabelInput === null) return;
    const nextDescriptionInput = window.prompt('Folder description (optional)', folder.description || '');
    if (nextDescriptionInput === null) return;

    try {
      const updated = await updateAssetFolder({
        path: folder.path,
        nextPath: nextPathInput,
        label: nextLabelInput,
        description: nextDescriptionInput
      });
      await loadFolders();
      if (folderFilter === folder.path) {
        setFolderFilter(updated.path);
      }
      if (uploadFolder === folder.path) {
        setUploadFolder(updated.path);
      }
      toast.success('Folder updated');
      await fetchAssets({ reset: true, cursor: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update folder');
    }
  };

  const handleDeleteFolder = async (folder: AssetFolderItem) => {
    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(`Delete folder "${folder.path}"? The folder must be empty.`);
      if (!confirmed) return;
    }
    try {
      await deleteAssetFolder(folder.path);
      await loadFolders();
      if (folderFilter === folder.path) {
        setFolderFilter(FOLDER_ALL);
      }
      if (uploadFolder === folder.path) {
        setUploadFolder(FOLDER_ROOT);
      }
      toast.success('Folder deleted');
      await fetchAssets({ reset: true, cursor: null });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete folder');
    }
  };

  const handleDropToFolder = async (path: string) => {
    if (inTrashView) return;
    const keys = draggingKeys.length ? draggingKeys : Array.from(selectedKeys.values());
    if (!keys.length) return;
    await runBulkMove({ keys, folder: path, preserveSelection: true });
    setDraggingKeys([]);
    clearSelection();
  };

  const handleAssetDragStart = (key: string) => {
    if (selectedKeys.has(key) && selectedKeys.size > 1) {
      setDraggingKeys(Array.from(selectedKeys.values()));
      return;
    }
    setDraggingKeys([key]);
  };

  const ensureUsageForKeys = useCallback(
    async (keys: string[]) => {
      const missing = keys.filter((key) => !usageByKey[key]);
      if (!missing.length) return;
      await fetchUsageForKeys(missing);
    },
    [fetchUsageForKeys, usageByKey]
  );

  const openUsageDialog = useCallback(
    async (key: string) => {
      setUsageDialogKey(key);
      if (usageByKey[key]) {
        setUsageDialogLoading(false);
        return;
      }
      setUsageDialogLoading(true);
      try {
        await fetchUsageForKeys([key]);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Failed to load references');
      } finally {
        setUsageDialogLoading(false);
      }
    },
    [fetchUsageForKeys, usageByKey]
  );

  const openDeleteConfirm = useCallback(
    async (keys: string[]) => {
      if (!keys.length) return;
      setDeleteUsageLoading(true);
      try {
        await ensureUsageForKeys(keys);
      } catch {
        // Do not block destructive actions if usage hints fail to load.
      } finally {
        setDeleteUsageLoading(false);
        setConfirmDeleteKeys(keys);
      }
    },
    [ensureUsageForKeys]
  );

  const activeFolderLabel = useMemo(() => {
    if (folderFilter === FOLDER_ALL) return 'All files';
    if (folderFilter === FOLDER_ROOT) return 'Root';
    if (folderFilter === FOLDER_TRASH) return 'Trash';
    const folder = folders.find((item) => item.path === folderFilter);
    return folder?.label ? `${folder.label} (${folder.path})` : folderFilter;
  }, [folderFilter, folders]);
  const usageCountByKey = useMemo(() => {
    const next: Record<string, number> = {};
    for (const item of items) {
      next[item.key] = usageByKey[item.key]?.count || 0;
    }
    return next;
  }, [items, usageByKey]);
  const previewIndex = useMemo(
    () => (previewKey ? items.findIndex((item) => item.key === previewKey) : -1),
    [items, previewKey]
  );
  const previewPrevKey = previewIndex > 0 ? items[previewIndex - 1]?.key || null : null;
  const previewNextKey =
    previewIndex >= 0 && previewIndex < items.length - 1 ? items[previewIndex + 1]?.key || null : null;
  const activeUsageDialogItem = usageDialogKey ? usageByKey[usageDialogKey] || null : null;
  const deleteUsageReferences = useMemo(() => {
    const keys = confirmDeleteKeys || [];
    const merged = new Map<
      string,
      { id: string; title: string; type: 'page' | 'article'; status?: string; url: string; assets: string[] }
    >();
    for (const key of keys) {
      const usage = usageByKey[key];
      if (!usage) continue;
      for (const reference of usage.references) {
        const existing = merged.get(reference.id);
        if (existing) {
          if (!existing.assets.includes(key)) {
            existing.assets.push(key);
          }
          continue;
        }
        merged.set(reference.id, {
          id: reference.id,
          title: reference.title,
          type: reference.type,
          status: reference.status,
          url: reference.url,
          assets: [key]
        });
      }
    }
    return Array.from(merged.values()).sort((a, b) => {
      if (a.type !== b.type) return a.type.localeCompare(b.type);
      return a.title.localeCompare(b.title);
    });
  }, [confirmDeleteKeys, usageByKey]);

  const selectedArray = useMemo(() => Array.from(selectedKeys.values()), [selectedKeys]);
  const visibleKeys = useMemo(() => items.map((item) => item.key), [items]);
  const selectedVisibleCount = useMemo(
    () => visibleKeys.reduce((count, key) => (selectedKeys.has(key) ? count + 1 : count), 0),
    [selectedKeys, visibleKeys]
  );
  const allVisibleSelected = visibleKeys.length > 0 && selectedVisibleCount === visibleKeys.length;
  const someVisibleSelected = selectedVisibleCount > 0 && !allVisibleSelected;
  const setSelectAllVisible = useCallback(
    (checked: boolean | 'indeterminate') => {
      const shouldSelectAll = checked === true;
      setSelectedKeys((prev) => {
        const next = new Set(prev);
        if (shouldSelectAll) {
          for (const key of visibleKeys) next.add(key);
        } else {
          for (const key of visibleKeys) next.delete(key);
        }
        return next;
      });
      if (shouldSelectAll && items.length > 0) {
        lastSelectedIndexRef.current = items.length - 1;
      }
    },
    [items, visibleKeys]
  );
  const activeEditItem = useMemo(() => items.find((item) => item.key === editKey) ?? editItem, [editItem, editKey, items]);
  const activeEditIsImage = (activeEditItem?.mime || '').startsWith('image/');
  const hasUnsavedFocalChanges =
    activeEditIsImage &&
    (Number((activeEditItem?.focalX ?? 0.5).toFixed(4)) !== Number((draftFocalX ?? 0.5).toFixed(4)) ||
      Number((activeEditItem?.focalY ?? 0.5).toFixed(4)) !== Number((draftFocalY ?? 0.5).toFixed(4)));

  return (
    <div className="mx-auto w-full max-w-[1280px] py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--vd-fg)]">Media Library</h1>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Upload, organize, and reuse assets across your site.</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/edit" prefetch={false}>
            Back to editor
          </Link>
        </Button>
      </div>
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <MediaLibrarySidebar
          folderFilter={folderFilter}
          onFolderChange={handleFolderFilterChange}
          folders={folders}
          foldersLoading={foldersLoading}
          onCreateFolder={() => setShowCreateFolder(true)}
          onEditFolder={(folder) => void handleEditFolder(folder)}
          onDeleteFolder={(folder) => void handleDeleteFolder(folder)}
          onDropToFolder={(path) => void handleDropToFolder(path)}
        />

        <div className="space-y-4">
          <div className="flex flex-col gap-3 rounded-xl bg-white/80 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--vd-muted-fg)]">Browsing</p>
              <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{activeFolderLabel}</p>
              <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                Showing {items.length} of {totalCount} assets
              </p>
              {usagePrefetching && !inTrashView ? (
                <p className="mt-1 text-[11px] text-[var(--vd-muted-fg)]">Updating usage references…</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Input
                className="w-full sm:w-[220px]"
                placeholder="Search by name, caption, tag, key"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <Select value={filter} onValueChange={(value) => setFilter(value as MimeFilter)}>
                <SelectTrigger className="w-[140px]" aria-label="Filter by file type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                </SelectContent>
              </Select>
              <Select value={tagFilter} onValueChange={setTagFilter} disabled={tagsLoading}>
                <SelectTrigger className="w-[180px]" aria-label="Filter by tag">
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TAG_FILTER_ALL}>All tags</SelectItem>
                  {tags.map((tagItem) => (
                    <SelectItem key={tagItem.tag} value={tagItem.tag}>
                      {tagItem.tag} ({tagItem.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={metadataFilter} onValueChange={(value) => setMetadataFilter(value as MetadataFilter)}>
                <SelectTrigger className="w-[200px]" aria-label="Filter by metadata completeness">
                  <SelectValue placeholder="Metadata" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All metadata</SelectItem>
                  <SelectItem value="missing-caption">Missing caption</SelectItem>
                  <SelectItem value="missing-alt">Missing alt text</SelectItem>
                  <SelectItem value="missing-metadata">Missing caption or alt</SelectItem>
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
                <TabsList className="h-auto gap-2 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="grid"
                    aria-label="Grid view"
                    className="rounded-none border-b-2 border-b-transparent px-1 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
                  >
                    <Grid2X2 className="h-4 w-4" />
                  </TabsTrigger>
                  <TabsTrigger
                    value="list"
                    aria-label="List view"
                    className="rounded-none border-b-2 border-b-transparent px-1 py-1.5 data-[state=active]:border-b-[var(--vd-ring)] data-[state=active]:bg-transparent"
                  >
                    <List className="h-4 w-4" />
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>

          <Card className="border-transparent shadow-sm">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="text-sm">{inTrashView ? 'Trash' : 'Uploads'}</CardTitle>
                {!inTrashView ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadPanelOpen((prev) => !prev)}
                    disabled={uploading}
                  >
                    {uploadPanelOpen ? 'Hide upload panel' : 'Upload'}
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--vd-border)]/60 bg-white/70 p-3">
                <div className="flex items-center gap-3 text-sm">
                  <Checkbox
                    checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                    onCheckedChange={setSelectAllVisible}
                    aria-label="Select all in current view"
                  />
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{selectedArray.length} selected</Badge>
                  {selectedArray.length ? (
                    <Button variant="ghost" size="sm" onClick={clearSelection}>
                      Clear
                    </Button>
                  ) : null}
                </div>
                {selectedArray.length ? (
                  <div className="flex flex-wrap items-center gap-2">
                    {inTrashView ? (
                      <>
                        <Button variant="outline" size="sm" onClick={() => void runRestore(selectedArray)}>
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Restore
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => void openDeleteConfirm(selectedArray)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete permanently
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowBulkMetadataEdit(true)}
                        >
                          Bulk edit
                        </Button>
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
                        <Button variant="outline" size="sm" onClick={() => void openDeleteConfirm(selectedArray)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Move to trash
                        </Button>
                      </>
                    )}
                  </div>
                ) : inTrashView ? (
                  <Button variant="outline" size="sm" onClick={() => void runEmptyTrash()} disabled={emptyingTrash || items.length === 0}>
                    {emptyingTrash ? 'Emptying…' : 'Empty trash'}
                  </Button>
                ) : null}
              </div>

              {inTrashView ? (
                <p className="text-xs text-[var(--vd-muted-fg)]">
                  Items in Trash can be restored anytime until they are permanently deleted.
                </p>
              ) : (
                <>
                  {!uploadPanelOpen ? (
                    <p className="text-xs text-[var(--vd-muted-fg)]">
                      Upload panel is collapsed. Click Upload to add files.
                    </p>
                  ) : (
                    <>
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

                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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
                        <Input
                          placeholder="Tags (comma separated)"
                          value={uploadTags}
                          onChange={(e) => setUploadTags(e.target.value)}
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
                    </>
                  )}
                </>
              )}
            </CardHeader>
            <CardContent>
              {items.length === 0 && !loading ? (
                <p className="text-sm text-[var(--vd-muted-fg)]">{inTrashView ? 'Trash is empty.' : 'No uploads found.'}</p>
              ) : (
                <MediaLibraryAssets
                  items={items}
                  viewMode={viewMode}
                  selectedKeys={selectedKeys}
                  onToggleSelected={toggleSelected}
                  onPreview={setPreviewKey}
                  onCopy={(key) => void handleCopy(key)}
                  onEdit={startEditing}
                  onRestore={(key) => void runRestore([key])}
                  inTrashView={inTrashView}
                  onDelete={(key) => void openDeleteConfirm([key])}
                  onDragStart={handleAssetDragStart}
                  usageCountByKey={usageCountByKey}
                  onOpenUsage={(key) => void openUsageDialog(key)}
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
        </div>
      </div>

      <MediaLibraryBulkEditDialog
        key={showBulkMetadataEdit ? 'bulk-edit-open' : 'bulk-edit-closed'}
        open={showBulkMetadataEdit}
        onOpenChange={setShowBulkMetadataEdit}
        selectedCount={selectedArray.length}
        saving={bulkMetadataSaving}
        onApply={(payload) => void runBulkMetadataEdit(payload)}
      />

      <MediaLibraryDialogs
        folders={folders}
        showCreateFolder={showCreateFolder}
        setShowCreateFolder={setShowCreateFolder}
        creatingFolder={creatingFolder}
        newFolderPath={newFolderPath}
        setNewFolderPath={setNewFolderPath}
        newFolderLabel={newFolderLabel}
        setNewFolderLabel={setNewFolderLabel}
        newFolderDescription={newFolderDescription}
        setNewFolderDescription={setNewFolderDescription}
        onCreateFolder={() => void handleCreateFolder()}
        editKey={editKey}
        setEditKey={closeEditing}
        editItem={activeEditItem}
        draftName={draftName}
        setDraftName={setDraftName}
        draftCaption={draftCaption}
        setDraftCaption={setDraftCaption}
        draftAlt={draftAlt}
        setDraftAlt={setDraftAlt}
        draftTags={draftTags}
        setDraftTags={setDraftTags}
        draftFolder={draftFolder}
        setDraftFolder={setDraftFolder}
        draftFocalX={draftFocalX}
        draftFocalY={draftFocalY}
        setDraftFocalX={setDraftFocalX}
        setDraftFocalY={setDraftFocalY}
        activeEditIsImage={activeEditIsImage}
        hasUnsavedFocalChanges={hasUnsavedFocalChanges}
        saving={saving}
        onSaveEdit={() => void saveEditing()}
        replacingFile={replacingFile}
        onReplaceFile={(file) => void handleReplaceFile(file)}
        altProviderInfo={altProviderInfo}
        altGenerationLoading={altGenerationLoading}
        altApplying={altApplying}
        altGenerationPreview={altGenerationPreview}
        altGenerationError={altGenerationError}
        onGenerateAlt={handleGenerateAlt}
        onApplyGeneratedAlt={applyGeneratedAlt}
        previewKey={previewKey}
        setPreviewKey={setPreviewKey}
        previewPrevKey={previewPrevKey}
        previewNextKey={previewNextKey}
        onNavigatePreview={setPreviewKey}
        previewUsageCount={previewKey ? usageByKey[previewKey]?.count || 0 : 0}
        onCopy={(key) => void handleCopy(key)}
        usageDialogKey={usageDialogKey}
        setUsageDialogKey={setUsageDialogKey}
        usageDialogItem={activeUsageDialogItem}
        usageDialogLoading={usageDialogLoading}
        onEditFromPreview={(key) => {
          const item = items.find((i) => i.key === key);
          if (item) startEditing(item);
          else {
            setEditKey(key);
            setEditItem(null);
            setDraftName('');
            setDraftCaption('');
            setDraftAlt('');
            setDraftTags('');
            setDraftFolder(FOLDER_ROOT);
            setDraftFocalX(undefined);
            setDraftFocalY(undefined);
          }
        }}
        onDeleteFromPreview={(key) => void openDeleteConfirm([key])}
        onRestoreFromPreview={(key) => void runRestore([key])}
        inTrashView={inTrashView}
        confirmDeleteKeys={confirmDeleteKeys}
        setConfirmDeleteKeys={setConfirmDeleteKeys}
        deleteUsageReferences={deleteUsageReferences}
        deleteUsageLoading={deleteUsageLoading}
        onConfirmDelete={() => void runDelete()}
      />
    </div>
  );
}
