/* eslint-disable react-hooks/exhaustive-deps -- State setters and refs come unchanged from useState/useRef in media-library.state; original effect dependencies are preserved. */
'use client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { buildAssetUrl, createAssetFolder, deleteAssetFolder, deleteAssets, restoreAssets, updateAssetFolder, updateAssetMetadata, uploadFile, type AssetFolderItem } from '@/lib/uploads';
import { FOLDER_ALL, FOLDER_ROOT, parseTagInput, readImageDimensions, resolveFolderParam } from './media-library.types';
import type { BulkMetadataPayload } from './media-library.bulk-edit-dialog';
import type { MediaLibraryState } from './media-library.state';
import type { MediaLibraryData } from './media-library.data';

export function useMediaLibraryActions(state: MediaLibraryState, data: MediaLibraryData) {
  const { items, setItems, cursor, setCursor, filter, folderFilter, setFolderFilter, inTrashView, setUploading, setUploadProgress, setUploadBatch, queuedFiles, setQueuedFiles, uploadName, setUploadName, uploadCaption, setUploadCaption, uploadAlt, setUploadAlt, uploadTags, setUploadTags, uploadFolder, setUploadFolder, tags, setShowCreateFolder, setCreatingFolder, newFolderPath, setNewFolderPath, newFolderLabel, setNewFolderLabel, newFolderDescription, setNewFolderDescription, setShowBulkMetadataEdit, setBulkMetadataSaving, setEmptyingTrash, selectedKeys, setSelectedKeys, draggingKeys, setDraggingKeys, bulkFolder, lastSelectedIndexRef, setUsageByKey, confirmDeleteKeys, setConfirmDeleteKeys } = state;
  const { loadFolders, loadTags, fetchAssets } = data;
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
  return { uploadSingle, runQueuedUpload, handleCopy, toggleSelected, clearSelection, runDelete, runRestore, runEmptyTrash, runBulkMetadataEdit, runBulkMove, handleCreateFolder, handleEditFolder, handleDeleteFolder, handleDropToFolder, handleAssetDragStart, selectedArray, visibleKeys, selectedVisibleCount, allVisibleSelected, someVisibleSelected, setSelectAllVisible };
}
