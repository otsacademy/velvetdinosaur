'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { insertMediaEmbed } from '@platejs/media'
import { ImagePlugin } from '@platejs/media/react'
import { KEYS } from 'platejs'
import { Plate, usePlateEditor } from 'platejs/react'
import { toast } from 'sonner'

import type { Article } from '@/lib/articles'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { slugifyArticleTitle } from '@/lib/work-slug'
import { cn } from '@/lib/utils'
import { EditorKit } from '@/registry/components/editor/editor-kit'
import { Editor, EditorContainer } from '@/registry/ui/editor'
import { TocSidebar } from '@/registry/ui/toc-sidebar'
import { WorkEditorSettingsPanel, WorkPublishMode } from '@/components/edit/work-editor/work-editor-settings-panel'
import {
  DEFAULT_AUTHOR_IMAGE,
  DEFAULT_IMAGE,
  EMPTY_CONTENT,
  articleToInitialContent,
  dateStringToInput,
  normalizeInitialWorkHeroImage,
} from '@/components/edit/work-editor/work-editor-plate-utils'
import {
  extractTextFromPlateNode,
  inferAssetLabel,
} from '@/components/edit/work-editor/work-editor-media-utils'
import { WorkEditorImageElement } from '@/components/edit/work-editor/work-editor-image-element'
import {
  NewsEditorCommandDialogs,
} from '@/components/edit/news-editor/news-editor-command-dialogs'
import { WorkArticleEditorHeader } from '@/components/edit/work-editor/work-article-editor-header'
import { WorkProjectMetadataCard } from '@/components/edit/work-editor/work-project-metadata-card'
import { useWorkMediaLibrary } from '@/components/edit/work-editor/use-work-media-library'
import { Input } from '@/components/ui/input'
import { londonDateTimeToUtc, toLondonDateTimeInput } from '@/lib/work/scheduling'
import { WorkLinkWarning, WorkLinkWarningsDialog, parseWorkLinkWarningPayload } from '@/components/edit/work-link-warnings-dialog'

const NEWS_POTION_EDITOR_PLUGINS = [
  ...EditorKit.filter((plugin) => plugin.key !== ImagePlugin.key),
  ImagePlugin.withComponent(WorkEditorImageElement),
]

type WorkArticleEditorProps = {
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

type WorkPublishPayload = {
  title: string
  slug: string
  subtitle: string
  tag: string
  desc: string
  website: string
  outcome: string
  img: string
  imageCaption: string
  authorName: string
  authorImage: string
  primaryChapterSlug: string
  chapterSlugs: string[]
  publishDate: string
  content: unknown
  action: 'draft' | 'publish'
  publishMode: WorkPublishMode
  publishAt: string
  forcePublish?: boolean
  openGraphTitle: string
  openGraphDescription: string
  openGraphImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
}

type WorkPublishWarningsState = {
  open: boolean
  warnings: WorkLinkWarning[]
  checkedInternal: number
  checkedExternal: number
  payload: WorkPublishPayload | null
}

export function WorkArticleEditorPotion({
  returnPath = '/edit',
  initialArticle = null,
  activeAuthor = null,
}: WorkArticleEditorProps) {
  const isEditing = Boolean(initialArticle)
  const initialContent = useMemo(() => articleToInitialContent(initialArticle), [initialArticle])

  const [title, setTitle] = useState(initialArticle?.title || 'Untitled article')
  const [slug, setSlug] = useState(initialArticle?.slug || '')
  const [slugDirty, setSlugDirty] = useState(false)
  const [tag, setTag] = useState(initialArticle?.tag || 'Case Study')
  const [subtitle, setSubtitle] = useState(initialArticle?.subtitle || '')
  const [desc, setDesc] = useState(initialArticle?.desc || '')
  const [website, setWebsite] = useState(initialArticle?.website || '')
  const [outcome, setOutcome] = useState(initialArticle?.outcome || '')
  const [heroImage, setHeroImage] = useState(() => normalizeInitialWorkHeroImage(initialArticle?.img) || DEFAULT_IMAGE)
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || '')
  const [authorName, setAuthorName] = useState(
    activeAuthor?.name || initialArticle?.author?.name || 'Velvet Dinosaur'
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
  const [publishMode, setPublishMode] = useState<WorkPublishMode>(
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
  const [publishWarnings, setPublishWarnings] = useState<WorkPublishWarningsState>({
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

  const buildPublishPayload = (forcePublish?: boolean): WorkPublishPayload => {
    const action = publishMode === 'draft' ? 'draft' : 'publish'
    const parsedPublishAt = publishMode === 'scheduled' ? londonDateTimeToUtc(publishAt) : null
    const normalizedPrimaryChapterSlug = normalizeChapterSlug(primaryChapterSlug)
    const normalizedChapterSlugs = normalizeChapterSlugs(chapterSlugs, normalizedPrimaryChapterSlug)

    return {
      title,
      slug: slugifyArticleTitle(slug || title),
      subtitle,
      tag,
      desc,
      website,
      outcome,
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

  const submitPublishPayload = async (requestPayload: WorkPublishPayload) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/work/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const responsePayload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (response.status === 409 && !requestPayload.forcePublish) {
          const warningsResult = parseWorkLinkWarningPayload(responsePayload)
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
      const nextPath =
        requestPayload.publishMode === 'publish' && !(responsePayload as { pendingApproval?: unknown })?.pendingApproval
          ? `/work/${encodeURIComponent(nextSlug)}`
          : `/edit/work/${encodeURIComponent(nextSlug)}`
      toast.success('Article saved')
      window.location.assign(nextPath)
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
    (url: string, options?: { alt?: string; caption?: string }) => {
      editor.tf.insertNodes(
        {
          type: KEYS.img,
          url,
          alt: options?.alt,
          caption: options?.caption,
          children: [{ text: '' }],
        } as never,
        { select: true },
      )
      editor.tf.focus()
    },
    [editor],
  )
  const {
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
    mediaFolder,
  } = useWorkMediaLibrary({
    insertFileLinkNode,
    insertImageNode,
  })

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

  const previewSlug = slugifyArticleTitle(slug || title)

  return (
    <main className="work-article-editor min-h-screen bg-muted/20">
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageInputChange} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInputChange} />

      <WorkArticleEditorHeader
        returnPath={returnPath}
        isEditing={isEditing}
        mediaBusy={mediaBusy}
        showSettings={showSettings}
        previewHref={previewSlug ? `/preview/work/${encodeURIComponent(previewSlug)}` : null}
        isSubmitting={isSubmitting}
        onUploadImage={() => imageInputRef.current?.click()}
        onPickImage={() => void openMediaPicker('image')}
        onInsertVideo={() => insertVideoUrl()}
        onUploadFile={() => fileInputRef.current?.click()}
        onPickFile={() => void openMediaPicker('file')}
        onToggleSettings={() => setShowSettings((prev) => !prev)}
        onSubmit={() => void handleSubmit()}
      />

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
          <WorkProjectMetadataCard
            subtitle={subtitle}
            website={website}
            outcome={outcome}
            onSubtitleChange={setSubtitle}
            onWebsiteChange={setWebsite}
            onOutcomeChange={setOutcome}
          />
          <WorkEditorSettingsPanel
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

      <WorkLinkWarningsDialog
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

      <NewsEditorCommandDialogs
        slashOpen={false}
        onSlashOpenChange={() => {}}
        onRunSlashCommand={() => {}}
        mediaPickerOpen={mediaPickerOpen}
        onMediaPickerOpenChange={setMediaPickerOpen}
        mediaPickerMode={mediaPickerMode}
        mediaFolder={mediaFolder}
        mediaQuery={mediaQuery}
        onMediaQueryChange={setMediaQuery}
        mediaLoading={mediaLoading}
        mediaList={mediaList}
        onRefreshMedia={() => void loadWorkMedia()}
        onSelectMediaItem={handleSelectMediaItem}
        formatAssetLabel={inferAssetLabel}
      />
    </main>
  )
}
