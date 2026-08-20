'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { insertMediaEmbed } from '@platejs/media'
import { ImagePlugin } from '@platejs/media/react'
import { KEYS } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'
import {
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Article } from '@/lib/articles'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { slugifyArticleTitle } from '@/lib/news-slug'
import { uploadFile } from '@/lib/uploads'
import { cn } from '@/lib/utils'
import { EditorKit } from '@/registry/components/editor/editor-kit'
import { Editor, EditorContainer } from '@/registry/ui/editor'
import { TocSidebar } from '@/registry/ui/toc-sidebar'
import { NewsEditorSettingsPanel, NewsPublishMode } from '@/components/edit/news-editor/news-editor-settings-panel'
import {
  DEFAULT_AUTHOR_IMAGE,
  DEFAULT_IMAGE,
  EMPTY_CONTENT,
  articleToInitialContent,
  dateStringToInput,
  normalizeInitialNewsHeroImage,
} from '@/components/edit/news-editor/news-editor-plate-utils'
import { NEWS_MEDIA_FOLDER, extractTextFromPlateNode, readImageDimensions, stripExtension } from '@/components/edit/news-editor/news-editor-media-utils'
import { NewsEditorImageElement } from '@/components/edit/news-editor/news-editor-image-element'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { londonDateTimeToUtc, toLondonDateTimeInput } from '@/lib/news/scheduling'
import { NewsLinkWarning, NewsLinkWarningsDialog, parseNewsLinkWarningPayload } from '@/components/edit/news-link-warnings-dialog'

const NEWS_POTION_EDITOR_PLUGINS = [
  ...EditorKit.filter((plugin) => plugin.key !== ImagePlugin.key),
  ImagePlugin.withComponent(NewsEditorImageElement),
]

type NewsArticleEditorProps = {
  returnPath?: string
  initialArticle?: Article | null
  activeAuthor?: {
    name: string
    image: string
    userId?: string | null
    primaryChapterSlug?: string
    chapterSlugs?: string[]
  } | null
}

type NewsPublishPayload = {
  title: string
  slug: string
  tag: string
  desc: string
  img: string
  imageCaption: string
  authorName: string
  authorImage: string
  primaryChapterSlug: string
  chapterSlugs: string[]
  publishDate: string
  content: unknown
  action: 'draft' | 'publish'
  publishMode: NewsPublishMode
  publishAt: string
  forcePublish?: boolean
  openGraphTitle: string
  openGraphDescription: string
  openGraphImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
}

type NewsPublishWarningsState = {
  open: boolean
  warnings: NewsLinkWarning[]
  checkedInternal: number
  checkedExternal: number
  payload: NewsPublishPayload | null
}

export function NewsArticleEditorPotion({
  returnPath = '/edit',
  initialArticle = null,
  activeAuthor = null,
}: NewsArticleEditorProps) {
  const isEditing = Boolean(initialArticle)
  const initialContent = useMemo(() => articleToInitialContent(initialArticle), [initialArticle])

  const [title, setTitle] = useState(initialArticle?.title || 'Untitled article')
  const [slug, setSlug] = useState(initialArticle?.slug || '')
  const [slugDirty, setSlugDirty] = useState(false)
  const [tag, setTag] = useState(initialArticle?.tag || 'Announcements')
  const [desc, setDesc] = useState(initialArticle?.desc || '')
  const [heroImage, setHeroImage] = useState(() => normalizeInitialNewsHeroImage(initialArticle?.img) || DEFAULT_IMAGE)
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || '')
  const [authorName, setAuthorName] = useState(
    activeAuthor?.name || initialArticle?.author?.name || 'Editorial'
  )
  const [authorImage, setAuthorImage] = useState(
    activeAuthor?.image || initialArticle?.author?.img || DEFAULT_AUTHOR_IMAGE
  )
  const [primaryChapterSlug, setPrimaryChapterSlug] = useState(() =>
    normalizeChapterSlug(initialArticle?.primaryChapterSlug || activeAuthor?.primaryChapterSlug)
  )
  const [chapterSlugs, setChapterSlugs] = useState<string[]>(() =>
    normalizeChapterSlugs(
      initialArticle?.chapterSlugs || activeAuthor?.chapterSlugs,
      initialArticle?.primaryChapterSlug || activeAuthor?.primaryChapterSlug,
    )
  )
  const [publishDate, setPublishDate] = useState(() => dateStringToInput(initialArticle?.date))
  const [publishMode, setPublishMode] = useState<NewsPublishMode>(
    initialArticle?.status === 'scheduled'
      ? 'scheduled'
      : initialArticle?.status === 'published'
        ? 'publish'
        : 'draft',
  )
  const [publishAt, setPublishAt] = useState(() => toLondonDateTimeInput(initialArticle?.publishAt))
  const [openGraphTitle, setOpenGraphTitle] = useState(initialArticle?.openGraphTitle || '')
  const [openGraphDescription, setOpenGraphDescription] = useState(initialArticle?.openGraphDescription || '')
  const [openGraphImage, setOpenGraphImage] = useState(initialArticle?.openGraphImage || '')
  const [twitterTitle, setTwitterTitle] = useState(initialArticle?.twitterTitle || '')
  const [twitterDescription, setTwitterDescription] = useState(initialArticle?.twitterDescription || '')
  const [twitterImage, setTwitterImage] = useState(initialArticle?.twitterImage || '')
  const [content, setContent] = useState<unknown[]>(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [publishWarnings, setPublishWarnings] = useState<NewsPublishWarningsState>({
    open: false,
    warnings: [],
    checkedInternal: 0,
    checkedExternal: 0,
    payload: null,
  })

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const stats = useMemo(() => {
    const text = extractTextFromPlateNode(content).replace(/\s+/g, ' ').trim()
    const words = text ? text.split(' ').length : 0
    return {
      words,
      characters: text.length,
    }
  }, [content])

  const editor = usePlateEditor(
    {
      plugins: NEWS_POTION_EDITOR_PLUGINS,
      value: initialContent,
    },
    [initialContent],
  )

  useEffect(() => {
    if (slugDirty) return
    if (isEditing && slug.trim()) return
    setSlug(slugifyArticleTitle(title))
  }, [isEditing, slug, title, slugDirty])

  useEffect(() => {
    if (!activeAuthor) return
    if (activeAuthor.name && activeAuthor.name !== authorName) {
      setAuthorName(activeAuthor.name)
    }
    if (activeAuthor.image && activeAuthor.image !== authorImage) {
      setAuthorImage(activeAuthor.image)
    }
  }, [activeAuthor, authorImage, authorName])

  useEffect(() => {
    if (!activeAuthor) return
    if (primaryChapterSlug || chapterSlugs.length > 0) return

    const nextPrimaryChapterSlug = normalizeChapterSlug(activeAuthor.primaryChapterSlug)
    const nextChapterSlugs = normalizeChapterSlugs(activeAuthor.chapterSlugs, nextPrimaryChapterSlug)
    if (!nextPrimaryChapterSlug && nextChapterSlugs.length === 0) return

    setPrimaryChapterSlug(nextPrimaryChapterSlug)
    setChapterSlugs(nextChapterSlugs)
  }, [activeAuthor, chapterSlugs.length, primaryChapterSlug])

  const buildPublishPayload = (forcePublish?: boolean): NewsPublishPayload => {
    const action = publishMode === 'draft' ? 'draft' : 'publish'
    const parsedPublishAt = publishMode === 'scheduled' ? londonDateTimeToUtc(publishAt) : null
    const normalizedPrimaryChapterSlug = normalizeChapterSlug(primaryChapterSlug)
    const normalizedChapterSlugs = normalizeChapterSlugs(chapterSlugs, normalizedPrimaryChapterSlug)

    return {
      title,
      slug: slugifyArticleTitle(slug || title),
      tag,
      desc,
      img: heroImage,
      imageCaption,
      authorName,
      authorImage,
      primaryChapterSlug: normalizedPrimaryChapterSlug,
      chapterSlugs: normalizedChapterSlugs,
      publishDate,
      content,
      action,
      publishMode,
      publishAt: parsedPublishAt ? parsedPublishAt.toISOString() : '',
      openGraphTitle,
      openGraphDescription,
      openGraphImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      forcePublish: forcePublish ? true : undefined,
    }
  }

  const submitPublishPayload = async (requestPayload: NewsPublishPayload) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/news/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const responsePayload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 409 && !requestPayload.forcePublish) {
          const warningsResult = parseNewsLinkWarningPayload(responsePayload)
          if (warningsResult.warnings.length || warningsResult.checkedInternal || warningsResult.checkedExternal) {
            setPublishWarnings({
              open: true,
              warnings: warningsResult.warnings,
              checkedInternal: warningsResult.checkedInternal,
              checkedExternal: warningsResult.checkedExternal,
              payload: {
                ...requestPayload,
                forcePublish: true,
              },
            })
            return
          }
        }

        const message =
          responsePayload && typeof responsePayload === 'object' && 'error' in responsePayload
            ? String((responsePayload as { error?: unknown }).error || 'Could not publish article')
            : 'Could not publish article'
        toast.error(message)
        return
      }

      const nextSlug =
        typeof responsePayload === 'object' && responsePayload && typeof (responsePayload as { slug?: unknown }).slug === 'string'
          ? ((responsePayload as { slug?: unknown }).slug as string)
          : requestPayload.slug
      toast.success('Article published')
      window.location.assign(`/news/${encodeURIComponent(nextSlug)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not publish article')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishWarnings = () => {
    setPublishWarnings((current) => ({ ...current, open: false }))
    const warningPayload = publishWarnings.payload
    if (!warningPayload) return
    void submitPublishPayload(warningPayload)
  }

  const insertVideoUrl = useCallback(
    (raw?: string) => {
      const url = raw?.trim() || window.prompt('Paste a video URL (YouTube/Vimeo/etc.)', 'https://')?.trim()
      if (!url) return

      insertMediaEmbed(editor, { url })
      editor.tf.focus()
    },
    [editor],
  )

  const insertFileLinkNode = useCallback(
    (url: string, name?: string) => {
      editor.tf.insertNodes(
        {
          type: KEYS.file,
          url,
          name: name || 'Attachment',
          children: [{ text: '' }],
        } as never,
        { select: true },
      )
      editor.tf.focus()
    },
    [editor],
  )

  const insertImageNode = useCallback(
    (url: string, options?: { alt?: string; caption?: string; width?: number; height?: number }) => {
      editor.tf.insertNodes(
        {
          id: crypto.randomUUID(),
          type: KEYS.img,
          url,
          alt: options?.alt,
          caption: options?.caption ? [{ text: options.caption }] : undefined,
          initialWidth: options?.width,
          initialHeight: options?.height,
          width: options?.width,
          children: [{ text: '' }],
        } as never,
        { select: true },
      )
      editor.tf.focus()
    },
    [editor],
  )

  const runUploadImage = useCallback(
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
          width: uploaded.width,
          height: uploaded.height,
        })
        toast.success('Image uploaded to R2 and inserted')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Image upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertImageNode],
  )

  const runUploadFile = useCallback(
    async (file: File) => {
      setMediaBusy(true)

      try {
        const uploaded = await uploadFile(file, {
          folder: NEWS_MEDIA_FOLDER,
          name: stripExtension(file.name),
        })

        insertFileLinkNode(uploaded.url, uploaded.name || file.name)
        toast.success('Attachment uploaded to R2 and inserted')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'File upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertFileLinkNode],
  )

  const onImageInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      await runUploadImage(file)
    },
    [runUploadImage],
  )

  const onFileInputChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      event.target.value = ''
      if (!file) return
      await runUploadFile(file)
    },
    [runUploadFile],
  )

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    if (!authorName.trim()) {
      toast.error('Author name is required')
      return
    }

    if (!Array.isArray(content) || content.length === 0) {
      toast.error('Article body is empty')
      return
    }

    const resolvedSlug = slugifyArticleTitle(slug || title)
    if (!resolvedSlug) {
      toast.error('A valid slug is required')
      return
    }

    const parsedPublishAt = publishMode === 'scheduled' ? londonDateTimeToUtc(publishAt) : null
    if (publishMode === 'scheduled' && !parsedPublishAt) {
      toast.error('Valid scheduled publish date and time is required')
      return
    }

    const requestPayload = buildPublishPayload(false)
    if (requestPayload.slug !== resolvedSlug) {
      requestPayload.slug = resolvedSlug
    }
    if (!requestPayload.slug) {
      toast.error('A valid slug is required')
      return
    }
    await submitPublishPayload(requestPayload)
  }

  return (
    <main className="min-h-screen bg-muted/20">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageInputChange} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInputChange} />

      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-[1500px] flex-wrap items-center justify-between gap-2 px-3 py-2 lg:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href={returnPath}>
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <span className="text-xs text-muted-foreground">
              {isEditing ? 'Editing article draft (Potion template)' : 'New article draft (Potion template)'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={mediaBusy}>
              <ImageIcon className="h-4 w-4" />
              Add image
            </Button>
            <Button variant="outline" size="sm" onClick={() => insertVideoUrl()}>
              <Video className="h-4 w-4" />
              Add video
            </Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={mediaBusy}>
              <Paperclip className="h-4 w-4" />
              Add file
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowSettings((prev) => !prev)}>
              {showSettings ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
              {showSettings ? 'Hide settings' : 'Show settings'}
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || mediaBusy}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Update article' : 'Publish article'}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-[1500px] gap-6 px-3 py-6 lg:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={cn('min-w-0', !showSettings && 'xl:col-span-2')}>
          <Plate
            editor={editor}
            onChange={({ value }) => {
              setContent(Array.isArray(value) ? value : EMPTY_CONTENT)
            }}
          >
            <div className="mx-auto w-full max-w-[860px] rounded-lg bg-background/80 px-5 py-6">
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled article"
                className="h-auto border-none bg-transparent px-0 text-4xl font-semibold tracking-tight shadow-none focus-visible:ring-0 md:text-5xl"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span>{authorName}</span>
                <span>•</span>
                <span>{new Date(publishDate).toLocaleDateString('en-US')}</span>
                <span>•</span>
                <span>{tag}</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[1200px] pb-16">
              <TocSidebar className="top-[96px]" topOffset={24} />
              <EditorContainer className="min-h-[72vh] rounded-lg border border-border/60 bg-background shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
                <Editor placeholder="Type '/' for Potion commands, or start writing your story..." />
              </EditorContainer>
              <div className="mt-3 flex items-center justify-between px-1 text-xs text-muted-foreground">
                <span>
                  {stats.words} words • {stats.characters} characters
                </span>
                <span className="hidden md:inline">Potion slash menu: type &apos;/&apos; anywhere in the editor</span>
              </div>
            </div>
          </Plate>
        </section>

        <aside className={cn('w-full shrink-0', !showSettings && 'hidden')}>
          <NewsEditorSettingsPanel
            slug={slug}
            title={title}
            tag={tag}
            desc={desc}
            heroImage={heroImage}
            imageCaption={imageCaption}
            authorName={authorName}
            authorImage={authorImage}
            primaryChapterSlug={primaryChapterSlug}
            chapterSlugs={chapterSlugs}
            publishDate={publishDate}
            publishMode={publishMode}
            publishAt={publishAt}
            openGraphTitle={openGraphTitle}
            openGraphDescription={openGraphDescription}
            openGraphImage={openGraphImage}
            twitterTitle={twitterTitle}
            twitterDescription={twitterDescription}
            twitterImage={twitterImage}
            onSlugChange={(nextSlug) => {
              setSlugDirty(true)
              setSlug(nextSlug)
            }}
            onTagChange={setTag}
            onDescChange={setDesc}
            onHeroImageChange={setHeroImage}
            onImageCaptionChange={setImageCaption}
            onAuthorNameChange={setAuthorName}
            onAuthorImageChange={setAuthorImage}
            onPrimaryChapterChange={(value) => {
              setPrimaryChapterSlug(value)
              setChapterSlugs((current) => normalizeChapterSlugs(current, value))
            }}
            onChapterToggle={(slugValue, checked) => {
              setChapterSlugs((current) => {
                const next = checked
                  ? [...current, slugValue]
                  : current.filter((value) => value !== slugValue)
                return normalizeChapterSlugs(next, primaryChapterSlug)
              })
            }}
            authorLocked
            onPublishDateChange={setPublishDate}
            onPublishModeChange={setPublishMode}
            onPublishAtChange={(value) => {
              setPublishAt(value)
              setPublishMode('scheduled')
            }}
            onOpenGraphTitleChange={setOpenGraphTitle}
            onOpenGraphDescriptionChange={setOpenGraphDescription}
            onOpenGraphImageChange={setOpenGraphImage}
            onTwitterTitleChange={setTwitterTitle}
            onTwitterDescriptionChange={setTwitterDescription}
            onTwitterImageChange={setTwitterImage}
          />
        </aside>
      </div>

      <NewsLinkWarningsDialog
        open={publishWarnings.open}
        warnings={publishWarnings.warnings}
        checkedInternal={publishWarnings.checkedInternal}
        checkedExternal={publishWarnings.checkedExternal}
        isSubmitting={isSubmitting}
        onPublishAnyway={() => handlePublishWarnings()}
        onOpenChange={(open) => {
          if (open) return
          setPublishWarnings((previous) => ({ ...previous, open: false }))
        }}
      />
    </main>
  )
}
