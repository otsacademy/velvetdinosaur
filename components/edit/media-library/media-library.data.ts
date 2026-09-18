/* eslint-disable react-hooks/exhaustive-deps -- State setters and refs come unchanged from useState/useRef in media-library.state; original effect dependencies are preserved. */
'use client';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { listAssetFolders, listAssetTags, listAssetUsage, type AssetUsageItem } from '@/lib/uploads';
import { FOLDER_ALL, FOLDER_ROOT, FOLDER_TRASH, PAGE_SIZE, TAG_FILTER_ALL, resolveFolderParam, resolveMimePrefix } from './media-library.types';
import type { MediaLibraryState } from './media-library.state';

export function useMediaLibraryData(state: MediaLibraryState) {
  const { items, setItems, cursor, setCursor, setTotalCount, setLoading, query, filter, sort, folderFilter, setFolderFilter, tagFilter, setTagFilter, metadataFilter, inTrashView, uploading, uploadProgress, queuedFiles, setUploadPanelOpen, setUploadFolder, folders, setFolders, setFoldersLoading, tags, setTags, setTagsLoading, showBulkMetadataEdit, setShowBulkMetadataEdit, setSelectedKeys, usageByKey, setUsageByKey, usageDialogKey, setUsageDialogKey, setUsageDialogLoading, setUsagePrefetching, setDeleteUsageLoading, previewKey, editKey, editItem, draftFocalX, draftFocalY, confirmDeleteKeys, setConfirmDeleteKeys } = state;
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
      { id: string; title: string; type: 'page' | 'article' | 'newsletter'; status?: string; url: string; assets: string[] }
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

  const activeEditItem = useMemo(() => items.find((item) => item.key === editKey) ?? editItem, [editItem, editKey, items]);
  const activeEditIsImage = (activeEditItem?.mime || '').startsWith('image/');
  const hasUnsavedFocalChanges =
    activeEditIsImage &&
    (Number((activeEditItem?.focalX ?? 0.5).toFixed(4)) !== Number((draftFocalX ?? 0.5).toFixed(4)) ||
      Number((activeEditItem?.focalY ?? 0.5).toFixed(4)) !== Number((draftFocalY ?? 0.5).toFixed(4)));

  return { mimePrefix, handleFolderFilterChange, loadFolders, loadTags, mergeUsageItems, fetchUsageForKeys, fetchAssets, didInitialLoad, ensureUsageForKeys, openUsageDialog, openDeleteConfirm, activeFolderLabel, usageCountByKey, previewIndex, previewPrevKey, previewNextKey, activeUsageDialogItem, deleteUsageReferences, activeEditItem, activeEditIsImage, hasUnsavedFocalChanges };
}
export type MediaLibraryData = ReturnType<typeof useMediaLibraryData>;
