/* eslint-disable react-hooks/exhaustive-deps -- State setters and refs come unchanged from useState/useRef in media-library.state; original effect dependencies are preserved. */
'use client';
import { useCallback } from 'react';
import { toast } from 'sonner';
import { replaceAssetFile, updateAssetMetadata } from '@/lib/uploads';
import { formatAssetTags } from '@/lib/assets/tags';
import { FOLDER_ROOT, parseTagInput, readImageDimensions, type AssetListItem } from './media-library.types';
import type { MediaLibraryState } from './media-library.state';
import type { MediaLibraryData } from './media-library.data';

export function useMediaLibraryEditing(state: MediaLibraryState, data: MediaLibraryData) {
  const { setItems, tags, editKey, setEditKey, editItem, setEditItem, draftName, setDraftName, draftCaption, setDraftCaption, draftAlt, setDraftAlt, draftTags, setDraftTags, draftFolder, setDraftFolder, draftFocalX, setDraftFocalX, draftFocalY, setDraftFocalY, setSaving, setReplacingFile, altProviderInfo, setAltProviderInfo, setAltGenerationLoading, setAltApplying, altGenerationPreview, setAltGenerationPreview, setAltGenerationError } = state;
  const { loadFolders, loadTags, activeEditIsImage } = data;
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

  return { closeEditing, startEditing, saveEditing, handleReplaceFile, handleGenerateAlt, applyGeneratedAlt };
}
