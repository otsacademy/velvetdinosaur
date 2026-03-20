'use client'

import { useCallback, useMemo, useState, type ChangeEvent } from 'react'
import { toast } from 'sonner'

import { buildAssetUrl, uploadFile } from '@/lib/uploads'
import {
  NEWS_MEDIA_FOLDER,
  inferAssetLabel,
  readImageDimensions,
  stripExtension,
} from '@/components/edit/work-editor/work-editor-media-utils'
import type { MediaAssetItem, MediaPickerMode } from '@/components/edit/news-editor/news-editor-command-dialogs'

type UseWorkMediaLibraryArgs = {
  insertFileLinkNode: (url: string, name?: string) => void
  insertImageNode: (url: string, options?: { alt?: string; caption?: string }) => void
}

export function useWorkMediaLibrary({ insertFileLinkNode, insertImageNode }: UseWorkMediaLibraryArgs) {
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [mediaPickerMode, setMediaPickerMode] = useState<MediaPickerMode>('image')
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaAssetItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)

  const mediaList = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase()

    return mediaItems
      .filter((item) => (mediaPickerMode === 'image' ? item.mime?.startsWith('image/') : !item.mime?.startsWith('image/')))
      .filter((item) => {
        if (!q) return true
        return [item.name, item.caption, item.key].some((value) => value?.toLowerCase().includes(q))
      })
  }, [mediaItems, mediaPickerMode, mediaQuery])

  const loadWorkMedia = useCallback(async () => {
    setMediaLoading(true)

    try {
      const url = new URL('/api/assets/list', window.location.origin)
      url.searchParams.set('folder', NEWS_MEDIA_FOLDER)
      url.searchParams.set('limit', '80')
      url.searchParams.set('sort', 'newest')

      const response = await fetch(url.toString(), { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error((payload as { error?: string })?.error || 'Failed to load media assets')
      }

      setMediaItems(Array.isArray((payload as { items?: unknown[] })?.items) ? ((payload as { items: MediaAssetItem[] }).items) : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load media assets')
    } finally {
      setMediaLoading(false)
    }
  }, [])

  const openMediaPicker = useCallback(
    async (mode: MediaPickerMode) => {
      setMediaPickerMode(mode)
      setMediaQuery('')
      setMediaPickerOpen(true)
      await loadWorkMedia()
    },
    [loadWorkMedia],
  )

  const handleSelectMediaItem = useCallback(
    (item: MediaAssetItem) => {
      const label = inferAssetLabel(item)
      const url = buildAssetUrl(item.key)

      if (mediaPickerMode === 'image') {
        insertImageNode(url, {
          alt: item.alt || label,
          caption: item.caption,
        })
      } else {
        insertFileLinkNode(url, label)
      }

      setMediaPickerOpen(false)
    },
    [insertFileLinkNode, insertImageNode, mediaPickerMode],
  )

  const uploadImage = useCallback(
    async (file: File) => {
      setMediaBusy(true)

      try {
        const dimensions = await readImageDimensions(file)
        const uploaded = await uploadFile(file, {
          folder: NEWS_MEDIA_FOLDER,
          name: stripExtension(file.name),
          alt: stripExtension(file.name),
          width: dimensions.width,
          height: dimensions.height,
        })

        insertImageNode(uploaded.url, {
          alt: uploaded.alt,
          caption: uploaded.caption,
        })
        toast.success('Image uploaded to R2 and inserted')
        await loadWorkMedia()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Image upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertImageNode, loadWorkMedia],
  )

  const uploadAttachment = useCallback(
    async (file: File) => {
      setMediaBusy(true)

      try {
        const uploaded = await uploadFile(file, {
          folder: NEWS_MEDIA_FOLDER,
          name: stripExtension(file.name),
        })

        insertFileLinkNode(uploaded.url, uploaded.name || file.name)
        toast.success('Attachment uploaded to R2 and inserted')
        await loadWorkMedia()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'File upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertFileLinkNode, loadWorkMedia],
  )

  const onImageInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      await uploadImage(file)
    },
    [uploadImage],
  )

  const onFileInputChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      await uploadAttachment(file)
    },
    [uploadAttachment],
  )

  return {
    mediaBusy,
    mediaPickerOpen,
    setMediaPickerOpen,
    mediaPickerMode,
    mediaQuery,
    setMediaQuery,
    mediaLoading,
    mediaList,
    loadWorkMedia,
    openMediaPicker,
    handleSelectMediaItem,
    onImageInputChange,
    onFileInputChange,
    mediaFolder: NEWS_MEDIA_FOLDER,
  }
}
