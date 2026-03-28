'use client';

import { useCallback, useMemo, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { buildAssetUrl, listAssets, uploadFile } from '@/lib/uploads';
import {
  inferAssetLabel,
  NEWS_MEDIA_FOLDER,
} from '@/components/edit/news-editor/news-editor-media-utils';
import { type MediaAssetItem } from '@/components/edit/news-editor/news-editor-command-dialogs';

type UseDemoNewsMediaArgs = {
  insertImageNode: (url: string, options?: { alt?: string; caption?: string }) => void;
  insertFileLinkNode: (url: string, name?: string) => void;
};

export function useDemoNewsMedia({ insertImageNode, insertFileLinkNode }: UseDemoNewsMediaArgs) {
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [mediaPickerMode, setMediaPickerMode] = useState<'image' | 'file'>('image');
  const [mediaQuery, setMediaQuery] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaAssetItem[]>([]);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaBusy, setMediaBusy] = useState(false);

  const mediaList = useMemo(() => {
    const query = mediaQuery.trim().toLowerCase();
    return mediaItems
      .filter((item) => (mediaPickerMode === 'image' ? item.mime?.startsWith('image/') : !item.mime?.startsWith('image/')))
      .filter((item) => (!query ? true : [item.name, item.caption, item.key].some((value) => value?.toLowerCase().includes(query))));
  }, [mediaItems, mediaPickerMode, mediaQuery]);

  const loadMedia = useCallback(async () => {
    setMediaLoading(true);
    try {
      const result = await listAssets({ folder: NEWS_MEDIA_FOLDER, limit: 80, sort: 'newest' });
      setMediaItems(result.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load demo media.');
    } finally {
      setMediaLoading(false);
    }
  }, []);

  const uploadMedia = useCallback(async (file: File, mode: 'image' | 'file') => {
    setMediaBusy(true);
    try {
      const uploaded = await uploadFile(file, {
        folder: NEWS_MEDIA_FOLDER,
        name: file.name.replace(/\.[^/.]+$/, ''),
      });
      if (mode === 'image') {
        insertImageNode(uploaded.url, { alt: uploaded.alt || uploaded.name, caption: uploaded.caption });
        toast.success('Image uploaded for this demo session only.');
      } else {
        insertFileLinkNode(uploaded.url, uploaded.name || file.name);
        toast.success('Attachment uploaded for this demo session only.');
      }
      await loadMedia();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed.');
    } finally {
      setMediaBusy(false);
    }
  }, [insertFileLinkNode, insertImageNode, loadMedia]);

  const openMediaPicker = useCallback(async (mode: 'image' | 'file') => {
    setMediaPickerMode(mode);
    setMediaQuery('');
    setMediaPickerOpen(true);
    await loadMedia();
  }, [loadMedia]);

  const onSelectMediaItem = useCallback((item: MediaAssetItem) => {
    const label = inferAssetLabel(item);
    const url = buildAssetUrl(item.key);
    if (mediaPickerMode === 'image') {
      insertImageNode(url, { alt: item.alt || label, caption: item.caption });
    } else {
      insertFileLinkNode(url, label);
    }
    setMediaPickerOpen(false);
  }, [insertFileLinkNode, insertImageNode, mediaPickerMode]);

  const onImageInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void uploadMedia(file, 'image');
  }, [uploadMedia]);

  const onFileInputChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    void uploadMedia(file, 'file');
  }, [uploadMedia]);

  return {
    mediaBusy,
    mediaPickerOpen,
    setMediaPickerOpen,
    mediaPickerMode,
    mediaQuery,
    setMediaQuery,
    mediaLoading,
    mediaList,
    loadMedia,
    openMediaPicker,
    onSelectMediaItem,
    onImageInputChange,
    onFileInputChange,
  };
}
