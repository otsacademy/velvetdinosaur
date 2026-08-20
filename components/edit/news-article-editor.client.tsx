'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { insertMediaEmbed } from '@platejs/media'
import { KEYS } from 'platejs'
import { Plate, PlateContent, usePlateEditor } from 'platejs/react'
import {
  ArrowLeft,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Loader2,
  RotateCcw,
  Save,
  Send,
  Upload,
} from 'lucide-react'
import { toast } from 'sonner'

import type { Article } from '@/lib/articles'
import { normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters'
import { createArticleExcerpt } from '@/lib/news-presentation'
import { slugifyArticleTitle } from '@/lib/news-slug'
import { buildAssetUrl, buildAssetUrlWithFocal, uploadFile } from '@/lib/uploads'
import { cn } from '@/lib/utils'
import {
  NewsDocumentToolbar,
  NewsMagicMode,
  NEWS_EDITOR_PLUGINS,
} from '@/components/edit/news-editor/news-document-toolbar'
import { NewsEditorFloatingToolbar } from '@/components/edit/news-editor/news-editor-floating-toolbar'
import {
  NewsEditorCommandDialogs,
  type MediaAssetItem,
  type MediaPickerMode,
} from '@/components/edit/news-editor/news-editor-command-dialogs'
import { runNewsSlashCommand } from '@/components/edit/news-editor/news-editor-slash-actions'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NewsEditorSettingsPanel,
  NewsPublishMode,
} from '@/components/edit/news-editor/news-editor-settings-panel'
import {
  NewsEditorPreviewSheet,
  type NewsPreviewMode,
} from '@/components/edit/news-editor/news-editor-preview-sheet'
import {
  DEFAULT_AUTHOR_IMAGE,
  DEFAULT_IMAGE,
  EMPTY_CONTENT,
  articleToInitialContent,
  dateStringToInput,
  normalizeInitialNewsHeroImage,
} from '@/components/edit/news-editor/news-editor-plate-utils'
import {
  NEWS_MEDIA_FOLDER,
  extractTextFromPlateNode,
  inferAssetLabel,
  readImageDimensions,
  stripExtension,
} from '@/components/edit/news-editor/news-editor-media-utils'
import {
  exportEditorDocument,
  getCurrentEditorNodes,
  importEditorDocumentFromFile,
} from '@/components/edit/news-editor/news-editor-import-export'
import {
  NewsEditorRightRail,
  type NewsEditorRightPanelKey,
} from '@/components/edit/news-editor/news-editor-right-rail'
import { NewsEditorGettingStartedButton } from '@/components/edit/news-editor/news-editor-getting-started'
import {
  londonDateTimeToUtc,
  toLondonDateTimeInput,
} from '@/lib/news/scheduling'
import {
  type NewsEditorDocumentSettings,
  type NewsEditorFontFamily,
  getNewsEditorFontFamilyStack,
  normalizeNewsEditorDocumentSettings,
} from '@/lib/news-editor-document-settings'
import { analyzePlateStructure, stripLeadingHeroImageNode } from '@/lib/news-plate-transform'
import {
  applyEditorialFixesToPlateContent,
  suggestImageCaption,
  suggestSummaryFromPlateContent,
  summaryLooksIncomplete,
} from '@/lib/news-editorial-fixes'
import { Button } from '@/components/ui/button'
import {
  NewsLinkWarning,
  NewsLinkWarningsDialog,
  parseNewsLinkWarningPayload,
} from '@/components/edit/news-link-warnings-dialog'
import { useNewsUnsavedChangesGuard } from '@/components/edit/news-editor/use-news-unsaved-changes-guard'
import { TocSidebar } from '@/registry/ui/toc-sidebar'

type NewsArticleEditorProps = {
  returnPath?: string
  initialArticle?: Article | null
  isDuplicate?: boolean
  isAdmin?: boolean
  activeAuthor?: {
    name: string
    image: string
    userId?: string | null
    primaryChapterSlug?: string
    chapterSlugs?: string[]
  } | null
}

type NewsArticleHistoryItem = {
  id: string
  slug: string
  title: string
  status: 'draft' | 'scheduled' | 'published'
  actorUserId: string | null
  createdAt: string
  article?: Record<string, unknown>
}

type NewsPublishPayload = {
  title: string
  slug: string
  tag: string
  tags: string[]
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
  seoTitle: string
  seoDescription: string
  editorSettings: NewsEditorDocumentSettings
}

type NewsPublishWarningsState = {
  open: boolean
  warnings: NewsLinkWarning[]
  checkedInternal: number
  checkedExternal: number
  payload: NewsPublishPayload | null
}

type EditorDraftSnapshot = {
  title: string
  slug: string
  tag: string
  tags: string[]
  desc: string
  heroImage: string
  imageCaption: string
  authorName: string
  authorImage: string
  primaryChapterSlug: string
  chapterSlugs: string[]
  publishDate: string
  publishMode: NewsPublishMode
  publishAt: string
  openGraphTitle: string
  openGraphDescription: string
  openGraphImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  seoTitle: string
  seoDescription: string
  editorSettings: NewsEditorDocumentSettings
  content: unknown[]
}

type SeoProviderInfo = {
  configured: boolean
  envVar: string
}

type SubmitPublishResult = {
  ok: boolean
  message?: string
}

type MagicTextRangePoint = {
  path: number[]
  offset: number
}

type MagicTextRange = {
  anchor: MagicTextRangePoint
  focus: MagicTextRangePoint
}

type MagicTarget = {
  kind: 'selection'
  range: MagicTextRange
  text: string
}

type MagicBlockTarget = {
  kind: 'block'
  range: MagicTextRange
  path: number[]
  text: string
}

type MagicDocumentTarget = {
  kind: 'document'
  text: string
}

type MagicActionTarget = MagicTarget | MagicBlockTarget | MagicDocumentTarget

const SUMMARY_MAX_LENGTH = 200
const AUTO_SAVE_INTERVAL_MS = 45_000

function normalizeTagList(values: unknown): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const normalized: string[] = []
  for (const raw of values) {
    if (typeof raw !== 'string') continue
    const next = raw.trim()
    if (!next) continue
    const key = next.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(next)
  }

  return normalized
}

function cloneDraftValue<T>(value: T): T {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(value)
    }
  } catch {
    // fall through to JSON clone
  }

  if (value === undefined || value === null) {
    return value
  }

  return JSON.parse(JSON.stringify(value)) as T
}

function createSnapshotHash(snapshot: EditorDraftSnapshot) {
  return JSON.stringify(snapshot)
}

export function NewsArticleEditor({
  returnPath = '/edit',
  initialArticle = null,
  isDuplicate = false,
  isAdmin = false,
  activeAuthor = null,
}: NewsArticleEditorProps) {
  const isEditing = Boolean(initialArticle) && !isDuplicate
  const initialContent = useMemo(() => articleToInitialContent(initialArticle), [initialArticle])
  const initialEditorSettings = useMemo(
    () => normalizeNewsEditorDocumentSettings(initialArticle?.editorSettings),
    [initialArticle?.editorSettings],
  )

  const [title, setTitle] = useState(initialArticle?.title || 'Untitled article')
  const [slug, setSlug] = useState(initialArticle?.slug || '')
  const [slugDirty, setSlugDirty] = useState(false)
  const [tag, setTag] = useState(initialArticle?.tag || 'Announcements')
  const [tags, setTags] = useState<string[]>(() => normalizeTagList(initialArticle?.tags))
  const [desc, setDesc] = useState((initialArticle?.desc || '').slice(0, SUMMARY_MAX_LENGTH))
  const [heroImage, setHeroImage] = useState(() => normalizeInitialNewsHeroImage(initialArticle?.img) || DEFAULT_IMAGE)
  const [imageCaption, setImageCaption] = useState(initialArticle?.imageCaption || '')
  const [authorName, setAuthorName] = useState(
    initialArticle?.author?.name || activeAuthor?.name || 'Editorial'
  )
  const [authorImage, setAuthorImage] = useState(
    initialArticle?.author?.img || activeAuthor?.image || DEFAULT_AUTHOR_IMAGE
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
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [scheduleDialogValue, setScheduleDialogValue] = useState(() => toLondonDateTimeInput(initialArticle?.publishAt))
  const [pendingScheduleSuccessMessage, setPendingScheduleSuccessMessage] = useState('')
  const [editorFontFamily, setEditorFontFamily] = useState<NewsEditorFontFamily>(initialEditorSettings.fontFamily)
  const [editorFullWidth, setEditorFullWidth] = useState(initialEditorSettings.fullWidth)
  const [editorSmallText, setEditorSmallText] = useState(initialEditorSettings.smallText)
  const [editorLockPage, setEditorLockPage] = useState(initialEditorSettings.lockPage)
  const [openGraphTitle, setOpenGraphTitle] = useState(initialArticle?.openGraphTitle || '')
  const [openGraphDescription, setOpenGraphDescription] = useState(initialArticle?.openGraphDescription || '')
  const [openGraphImage, setOpenGraphImage] = useState(initialArticle?.openGraphImage || '')
  const [twitterTitle, setTwitterTitle] = useState(initialArticle?.twitterTitle || '')
  const [twitterDescription, setTwitterDescription] = useState(initialArticle?.twitterDescription || '')
  const [twitterImage, setTwitterImage] = useState(initialArticle?.twitterImage || '')
  const [seoTitle, setSeoTitle] = useState(initialArticle?.seoTitle || '')
  const [seoDescription, setSeoDescription] = useState(initialArticle?.seoDescription || '')
  const [seoSource, setSeoSource] = useState<'manual' | 'auto' | null>(initialArticle?.seoSource || null)
  const [seoNeedsReview, setSeoNeedsReview] = useState(initialArticle?.seoNeedsReview ?? false)
  const [seoProvider, setSeoProvider] = useState<SeoProviderInfo | null>(null)
  const [seoProviderLoading, setSeoProviderLoading] = useState(false)
  const [isGeneratingSeo, setIsGeneratingSeo] = useState(false)
  const [isApplyingSeo, setIsApplyingSeo] = useState(false)
  const [seoPreviewOpen, setSeoPreviewOpen] = useState(false)
  const [seoPreviewTitle, setSeoPreviewTitle] = useState('')
  const [seoPreviewDescription, setSeoPreviewDescription] = useState('')
  const [seoGenerateError, setSeoGenerateError] = useState('')
  const [content, setContent] = useState<unknown[]>(initialContent)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState<NewsArticleHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [restoringHistoryId, setRestoringHistoryId] = useState<string | null>(null)
  const [publishWarnings, setPublishWarnings] = useState<NewsPublishWarningsState>({
    open: false,
    warnings: [],
    checkedInternal: 0,
    checkedExternal: 0,
    payload: null,
  })

  const [slashOpen, setSlashOpen] = useState(false)
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false)
  const [mediaPickerMode, setMediaPickerMode] = useState<MediaPickerMode>('image')
  const [mediaQuery, setMediaQuery] = useState('')
  const [mediaItems, setMediaItems] = useState<MediaAssetItem[]>([])
  const [mediaLoading, setMediaLoading] = useState(false)
  const [mediaBusy, setMediaBusy] = useState(false)
  const [magicProvider, setMagicProvider] = useState<SeoProviderInfo | null>(null)
  const [magicBusy, setMagicBusy] = useState(false)
  const [magicPreviewOpen, setMagicPreviewOpen] = useState(false)
  const [magicOriginalText, setMagicOriginalText] = useState('')
  const [magicSuggestedText, setMagicSuggestedText] = useState('')
  const [magicApplying, setMagicApplying] = useState(false)
  const [magicUndoSnapshot, setMagicUndoSnapshot] = useState<unknown[] | null>(null)
  const [magicCanUndo, setMagicCanUndo] = useState(false)
  const [magicUndoBusy, setMagicUndoBusy] = useState(false)
  const [magicTarget, setMagicTarget] = useState<MagicActionTarget | null>(null)
  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null)
  const [hasPersistedSave, setHasPersistedSave] = useState(Boolean(initialArticle))
  const [hasLiveVersion, setHasLiveVersion] = useState(initialArticle?.status === 'published')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => (initialArticle ? new Date() : null))
  const [savePulseActive, setSavePulseActive] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<NewsPreviewMode>('draft')
  const [previewRefreshToken, setPreviewRefreshToken] = useState(0)
  const [rightRailPanel, setRightRailPanel] = useState<NewsEditorRightPanelKey | null>(null)
  const [isImportingDocument, setIsImportingDocument] = useState(false)
  const [isExportingDocument, setIsExportingDocument] = useState(false)

  const imageInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const documentImportInputRef = useRef<HTMLInputElement | null>(null)
  const magicUndoTimeoutRef = useRef<number | null>(null)

  const stats = useMemo(() => {
    const text = extractTextFromPlateNode(content).replace(/\s+/g, ' ').trim()
    const words = text ? text.split(' ').length : 0
    return {
      words,
      characters: text.length,
    }
  }, [content])
  const contentStructure = useMemo(() => analyzePlateStructure(content), [content])
  const previewSlug = useMemo(() => slugifyArticleTitle(slug || title), [slug, title])
  const editorFontFamilyStack = useMemo(
    () => getNewsEditorFontFamilyStack(editorFontFamily),
    [editorFontFamily],
  )
  const documentStatusLabel =
    publishMode === 'scheduled' ? 'Scheduled' : publishMode === 'publish' ? 'Published' : 'Draft'
  const publishDateLabel = useMemo(() => {
    if (!publishDate) return 'Unscheduled date'
    const parsed = new Date(`${publishDate}T00:00:00`)
    if (Number.isNaN(parsed.getTime())) return 'Unscheduled date'
    return parsed.toLocaleDateString('en-US')
  }, [publishDate])
  const bylineTags = useMemo(() => {
    const categoryKey = tag.trim().toLowerCase()
    return tags.filter((value) => {
      const next = value.trim()
      if (!next) return false
      return next.toLowerCase() !== categoryKey
    })
  }, [tag, tags])

  const createDraftSnapshot = useCallback((): EditorDraftSnapshot => {
    return {
      title,
      slug,
      tag,
      tags,
      desc,
      heroImage,
      imageCaption,
      authorName,
      authorImage,
      primaryChapterSlug,
      chapterSlugs,
      publishDate,
      publishMode,
      publishAt,
      openGraphTitle,
      openGraphDescription,
      openGraphImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      seoTitle,
      seoDescription,
      editorSettings: {
        fontFamily: editorFontFamily,
        fullWidth: editorFullWidth,
        smallText: editorSmallText,
        lockPage: editorLockPage,
      },
      content: cloneDraftValue(Array.isArray(content) ? content : EMPTY_CONTENT),
    }
  }, [
    authorImage,
    authorName,
    chapterSlugs,
    content,
    desc,
    heroImage,
    imageCaption,
    openGraphDescription,
    openGraphImage,
    openGraphTitle,
    primaryChapterSlug,
    publishAt,
    publishDate,
    publishMode,
    editorFontFamily,
    editorFullWidth,
    editorSmallText,
    editorLockPage,
    seoDescription,
    seoTitle,
    slug,
    tag,
    tags,
    title,
    twitterDescription,
    twitterImage,
    twitterTitle,
  ])

  const applyDraftSnapshot = useCallback((snapshot: EditorDraftSnapshot) => {
    setTitle(snapshot.title)
    setSlug(snapshot.slug)
    setTag(snapshot.tag)
    setTags(normalizeTagList(snapshot.tags))
    setDesc(snapshot.desc.slice(0, SUMMARY_MAX_LENGTH))
    setHeroImage(snapshot.heroImage)
    setImageCaption(snapshot.imageCaption)
    setAuthorName(activeAuthor?.name || snapshot.authorName)
    setAuthorImage(activeAuthor?.image || snapshot.authorImage)
    setPrimaryChapterSlug(snapshot.primaryChapterSlug)
    setChapterSlugs(normalizeChapterSlugs(snapshot.chapterSlugs, snapshot.primaryChapterSlug))
    setPublishDate(snapshot.publishDate)
    setPublishMode(snapshot.publishMode)
    setPublishAt(snapshot.publishAt)
    setOpenGraphTitle(snapshot.openGraphTitle)
    setOpenGraphDescription(snapshot.openGraphDescription)
    setOpenGraphImage(snapshot.openGraphImage)
    setTwitterTitle(snapshot.twitterTitle)
    setTwitterDescription(snapshot.twitterDescription)
    setTwitterImage(snapshot.twitterImage)
    setSeoTitle(snapshot.seoTitle)
    setSeoDescription(snapshot.seoDescription)
    const normalizedSettings = normalizeNewsEditorDocumentSettings(snapshot.editorSettings)
    setEditorFontFamily(normalizedSettings.fontFamily)
    setEditorFullWidth(normalizedSettings.fullWidth)
    setEditorSmallText(normalizedSettings.smallText)
    setEditorLockPage(normalizedSettings.lockPage)
    setContent(cloneDraftValue(snapshot.content))
    setSlugDirty(true)
  }, [activeAuthor?.image, activeAuthor?.name])

  const baselineSnapshotRef = useRef<EditorDraftSnapshot | null>(null)
  const currentSnapshot = useMemo(() => createDraftSnapshot(), [createDraftSnapshot])
  const currentSnapshotHash = useMemo(() => createSnapshotHash(currentSnapshot), [currentSnapshot])
  const currentSnapshotHashRef = useRef(currentSnapshotHash)
  const baselineSnapshotHashRef = useRef('')

  if (!baselineSnapshotRef.current) {
    baselineSnapshotRef.current = cloneDraftValue(currentSnapshot)
    baselineSnapshotHashRef.current = currentSnapshotHash
  }

  useEffect(() => {
    currentSnapshotHashRef.current = currentSnapshotHash
  }, [currentSnapshotHash])

  useEffect(() => {
    if (!activeAuthor || isEditing) return
    if (activeAuthor.name && activeAuthor.name !== authorName) {
      setAuthorName(activeAuthor.name)
    }
    if (activeAuthor.image && activeAuthor.image !== authorImage) {
      setAuthorImage(activeAuthor.image)
    }
  }, [activeAuthor, authorImage, authorName, isEditing])

  useEffect(() => {
    if (!activeAuthor || isEditing) return
    if (primaryChapterSlug || chapterSlugs.length > 0) return

    const nextPrimaryChapterSlug = normalizeChapterSlug(activeAuthor.primaryChapterSlug)
    const nextChapterSlugs = normalizeChapterSlugs(activeAuthor.chapterSlugs, nextPrimaryChapterSlug)
    if (!nextPrimaryChapterSlug && nextChapterSlugs.length === 0) return

    setPrimaryChapterSlug(nextPrimaryChapterSlug)
    setChapterSlugs(nextChapterSlugs)
  }, [activeAuthor, chapterSlugs.length, isEditing, primaryChapterSlug])

  useEffect(() => {
    if (!lastSavedAt) return
    setSavePulseActive(true)
    const timeoutId = window.setTimeout(() => setSavePulseActive(false), 900)
    return () => window.clearTimeout(timeoutId)
  }, [lastSavedAt])

  const isDirty = currentSnapshotHash !== baselineSnapshotHashRef.current

  const markCurrentSnapshotSaved = useCallback(() => {
    baselineSnapshotRef.current = cloneDraftValue(createDraftSnapshot())
    baselineSnapshotHashRef.current = currentSnapshotHashRef.current
  }, [createDraftSnapshot])

  const {
    dialogOpen: leaveDialogOpen,
    setDialogOpen: setLeaveDialogOpen,
    requestNavigation,
    confirmNavigation,
    cancelNavigation,
  } = useNewsUnsavedChangesGuard(isDirty)

  const editor = usePlateEditor(
    {
      plugins: NEWS_EDITOR_PLUGINS,
      value: initialContent,
    },
    [initialContent],
  )

  const mediaList = useMemo(() => {
    const q = mediaQuery.trim().toLowerCase()

    return mediaItems
      .filter((item) => {
        if (mediaPickerMode === 'image') {
          return item.mime?.startsWith('image/')
        }

        return !item.mime?.startsWith('image/')
      })
      .filter((item) => {
        if (!q) return true
        return [item.name, item.caption, item.key].some((value) => value?.toLowerCase().includes(q))
      })
  }, [mediaItems, mediaPickerMode, mediaQuery])

  useEffect(() => {
    let cancelled = false

    void (async () => {
      try {
        const response = await fetch('/api/news/articles/rewrite', { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (cancelled) return

        setMagicProvider({
          configured: response.ok && payload?.configured === true,
          envVar: typeof payload?.envVar === 'string' ? payload.envVar : 'OPENAI_API_KEY',
        })
      } catch {
        if (!cancelled) {
          setMagicProvider({ configured: false, envVar: 'OPENAI_API_KEY' })
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!isEditing) {
      setSeoProvider(null)
      setSeoProviderLoading(false)
      return
    }

    void (async () => {
      const slugForApi = slugifyArticleTitle(slug || title)
      if (!slugForApi) {
        setSeoProvider(null)
        setSeoProviderLoading(false)
        return
      }

      setSeoProviderLoading(true)
      try {
        const response = await fetch(`/api/news/articles/${encodeURIComponent(slugForApi)}/generate-seo`, { cache: 'no-store' })
        const payload = await response.json().catch(() => ({}))
        if (cancelled) return

        setSeoProvider({
          configured: response.ok && payload?.configured === true,
          envVar: typeof payload?.envVar === 'string' ? payload.envVar : 'OPENAI_API_KEY',
        })
      } catch {
        if (!cancelled) {
          setSeoProvider({ configured: false, envVar: 'OPENAI_API_KEY' })
        }
      } finally {
        if (!cancelled) {
          setSeoProviderLoading(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isEditing, slug, title])
  useEffect(() => {
    if (slugDirty) return
    if (isEditing && slug.trim()) return
    setSlug(slugifyArticleTitle(title))
  }, [isEditing, slug, title, slugDirty])

  const normalizeMagicPoint = (value: unknown): MagicTextRangePoint | null => {
    if (!value || typeof value !== 'object') return null

    const candidate = value as {
      path?: unknown
      offset?: unknown
    }

    if (!Array.isArray(candidate.path)) return null
    if (!candidate.path.every((part): part is number => Number.isInteger(part as number))) return null
    if (typeof candidate.offset !== 'number' || Number.isNaN(candidate.offset)) return null

    return {
      path: [...candidate.path],
      offset: Math.max(0, Math.floor(candidate.offset)),
    }
  }

  const normalizeMagicRange = (value: unknown): MagicTextRange | null => {
    if (!value || typeof value !== 'object') return null

    const candidate = value as {
      anchor?: unknown
      focus?: unknown
    }

    const anchor = normalizeMagicPoint(candidate.anchor)
    const focus = normalizeMagicPoint(candidate.focus)
    if (!anchor || !focus) return null

    return { anchor, focus }
  }

  const isRangeCollapsed = (range: MagicTextRange) =>
    range.anchor.path.join('.') === range.focus.path.join('.') && range.anchor.offset === range.focus.offset

  const rangeFromPath = (path: number[]): MagicTextRange | null => {
    if (!Array.isArray(path) || path.length === 0) return null

    const start = editor.api.start(path as never)
    const end = editor.api.end(path as never)
    const anchor = normalizeMagicPoint(start as unknown)
    const focus = normalizeMagicPoint(end as unknown)

    if (!anchor || !focus) return null
    return { anchor, focus }
  }

  const buildParagraphNodesFromText = (text: string) => {
    const sanitized = text.replace(/\r/g, '')
    const paragraphs = sanitized
      .split(/\n{2,}/)
      .map((value) => value.trim())
      .filter(Boolean)

    if (!paragraphs.length) {
      return [{ type: KEYS.p, children: [{ text: '' }] }]
    }

    return paragraphs.map((paragraph) => ({
      type: KEYS.p,
      children: [{ text: paragraph }],
    }))
  }

  const clearMagicUndoTimer = () => {
    if (!magicUndoTimeoutRef.current) return
    window.clearTimeout(magicUndoTimeoutRef.current)
    magicUndoTimeoutRef.current = null
  }

  const scheduleMagicUndoReset = () => {
    clearMagicUndoTimer()
    magicUndoTimeoutRef.current = window.setTimeout(() => {
      setMagicCanUndo(false)
      setMagicUndoSnapshot(null)
    }, 60_000)
  }

  const resolveMagicTarget = (): MagicActionTarget | null => {
    const textualBlockTypes = new Set<string>([KEYS.p, KEYS.h1, KEYS.h2, KEYS.h3, KEYS.blockquote])
    const selectionRange = normalizeMagicRange(editor.selection)

    if (selectionRange && !isRangeCollapsed(selectionRange)) {
      const selectedText = editor.api.string(selectionRange as never).trim()
      if (selectedText) {
        return {
          kind: 'selection',
          range: selectionRange,
          text: selectedText,
        }
      }
    }

    const blockEntry = editor.api.above({
      match: (node) => {
        const asObject = node as { type?: unknown }
        return (
          editor.api.isBlock(node as never) &&
          !editor.api.isVoid(node as never) &&
          typeof asObject.type === 'string' &&
          textualBlockTypes.has(asObject.type)
        )
      },
    }) as [unknown, number[]] | undefined

    if (blockEntry) {
      const path = blockEntry[1]
      const blockText = editor.api.string(path as never).trim()
      if (blockText) {
        const blockRange = rangeFromPath(path)
        if (blockRange) {
          return {
            kind: 'block',
            range: blockRange,
            path,
            text: blockText,
          }
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        }
      }
    }

    const documentText = editor.api.string().trim()
    if (!documentText) {
      return null
    }

    return {
      kind: 'document',
      text: documentText,
    }
  }

  const replaceDocumentWithNodes = useCallback((nodes: unknown[]) => {
    const start = editor.api.start([] as never)
    const end = editor.api.end([] as never)
    const startPoint = normalizeMagicPoint(start as unknown)
    const endPoint = normalizeMagicPoint(end as unknown)
    if (!startPoint || !endPoint) {
      return false
    }

    editor.tf.select({ anchor: startPoint, focus: endPoint } as never)
    editor.tf.delete()
    const insertAt = startPoint.path.length ? startPoint.path : [0]
    editor.tf.insertNodes(nodes as never, { at: insertAt as never })

    return true
  }, [editor])

  const restoreMagicUndoState = async () => {
    if (!magicUndoSnapshot) return

    if (magicUndoBusy) return
    setMagicUndoBusy(true)

    try {
      const nextNodes = Array.isArray(magicUndoSnapshot) && magicUndoSnapshot.length
        ? cloneDraftValue(magicUndoSnapshot as unknown) as unknown[]
        : [...EMPTY_CONTENT]

      const replaced = replaceDocumentWithNodes(nextNodes)
      if (!replaced) {
        throw new Error('Could not restore document content')
      }

      clearMagicUndoTimer()
      setMagicCanUndo(false)
      setMagicUndoSnapshot(null)
      editor.tf.focus()
      toast.success('Magic change undone')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to undo magic')
    } finally {
      setMagicUndoBusy(false)
    }
  }

  const handleMagicAction = async (mode: NewsMagicMode) => {
    if (magicBusy) return

    if (!magicProvider?.configured) {
      const envVar = magicProvider?.envVar || 'OPENAI_API_KEY'
      toast.error(`Magic rewrite unavailable. Configure ${envVar} to enable.`)
      return
    }

    const target = resolveMagicTarget()
    if (!target || !target.text.trim()) {
      toast.error('No text available for rewriting. Select text or place the cursor in a paragraph.')
      return
    }

    setMagicBusy(true)
    setMagicTarget(null)
    setMagicOriginalText('')
    setMagicSuggestedText('')
    try {
      const payload: { text: string; mode: NewsMagicMode; tone?: string } = {
        text: target.text,
        mode,
      }

      if (mode === 'tone:professional') {
        payload.tone = 'professional'
      } else if (mode === 'tone:friendly') {
        payload.tone = 'friendly'
      } else if (mode === 'tone:neutral') {
        payload.tone = 'neutral'
      }

      const response = await fetch('/api/news/articles/rewrite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const payloadResponse = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(
          typeof payloadResponse?.error === 'string'
            ? payloadResponse.error
            : `Magic rewrite request failed (${response.status})`,
        )
      }

      const output = typeof payloadResponse?.output === 'string' ? payloadResponse.output.trim() : ''
      if (!output) {
        throw new Error('Provider returned empty rewrite output')
      }

      setMagicTarget(target)
      setMagicOriginalText(target.text)
      setMagicSuggestedText(output)
      setMagicPreviewOpen(true)
      toast.success('Magic suggestion ready. Review before applying.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Magic rewrite failed')
    } finally {
      setMagicBusy(false)
    }
  }

  const applyMagicSuggestion = async () => {
    if (!magicTarget || !magicSuggestedText.trim() || magicApplying) return

    const suggestion = magicSuggestedText.trim()
    const targetRange = magicTarget
    setMagicApplying(true)
    setMagicCanUndo(false)

    try {
      const before = cloneDraftValue(editor.children) as unknown[]
      setMagicUndoSnapshot(before)

      if (targetRange.kind === 'document') {
        const replacement = buildParagraphNodesFromText(suggestion)
        const replaced = replaceDocumentWithNodes(replacement as unknown[])
        if (!replaced) {
          throw new Error('Failed to replace full document')
        }
      } else {
        editor.tf.select(targetRange.range as never)
        editor.tf.delete()
        editor.tf.insertText(suggestion)
      }

      setMagicPreviewOpen(false)
      setMagicOriginalText('')
      setMagicSuggestedText('')
      setMagicTarget(null)
      clearMagicUndoTimer()
      scheduleMagicUndoReset()
      setMagicCanUndo(true)
      editor.tf.focus()
      toast.success('Magic suggestion applied')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply magic suggestion')
    } finally {
      setMagicApplying(false)
    }
  }

  const discardMagicPreview = () => {
    setMagicPreviewOpen(false)
    setMagicOriginalText('')
    setMagicSuggestedText('')
    setMagicTarget(null)
  }

  useEffect(() => {
    return () => {
      clearMagicUndoTimer()
    }
  }, [])

  const buildPublishPayload = useCallback((
    forcePublish?: boolean,
    modeOverride?: NewsPublishMode,
    publishAtOverride?: string,
  ): NewsPublishPayload => {
    const effectiveMode = modeOverride || publishMode
    const action = effectiveMode === 'draft' ? 'draft' : 'publish'
    const effectivePublishAt = publishAtOverride ?? publishAt
    const parsedPublishAt = effectiveMode === 'scheduled' ? londonDateTimeToUtc(effectivePublishAt) : null
    const normalizedPrimaryChapterSlug = normalizeChapterSlug(primaryChapterSlug)
    const normalizedChapterSlugs = normalizeChapterSlugs(chapterSlugs, normalizedPrimaryChapterSlug)

    return {
      title,
      slug: slugifyArticleTitle(slug || title),
      tag,
      tags,
      desc,
      img: heroImage,
      imageCaption,
      authorName,
      authorImage,
      primaryChapterSlug: normalizedPrimaryChapterSlug,
      chapterSlugs: normalizedChapterSlugs,
      publishDate,
      content: stripLeadingHeroImageNode(content, heroImage),
      action,
      publishMode: effectiveMode,
      publishAt: parsedPublishAt ? parsedPublishAt.toISOString() : '',
      openGraphTitle,
      openGraphDescription,
      openGraphImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      seoTitle,
      seoDescription,
      editorSettings: {
        fontFamily: editorFontFamily,
        fullWidth: editorFullWidth,
        smallText: editorSmallText,
        lockPage: editorLockPage,
      },
      forcePublish: forcePublish ? true : undefined,
    }
  }, [
    authorImage,
    authorName,
    chapterSlugs,
    content,
    desc,
    heroImage,
    imageCaption,
    openGraphDescription,
    openGraphImage,
    openGraphTitle,
    primaryChapterSlug,
    publishAt,
    publishDate,
    publishMode,
    editorFontFamily,
    editorFullWidth,
    editorSmallText,
    editorLockPage,
    seoDescription,
    seoTitle,
    slug,
    tag,
    tags,
    title,
    twitterDescription,
    twitterImage,
    twitterTitle,
  ])

  const openScheduleDialog = useCallback((successMessage?: string) => {
    setShowSettings(true)
    setPublishMode('scheduled')
    setScheduleDialogValue(publishAt)
    setPendingScheduleSuccessMessage(successMessage || '')
    setScheduleDialogOpen(true)
  }, [publishAt])

  const validatePublishPayload = useCallback((requestPayload: NewsPublishPayload): string | null => {
    if (!requestPayload.title.trim()) {
      return 'Title is required'
    }

    if (!requestPayload.authorName.trim()) {
      return 'Author name is required'
    }

    if (!Array.isArray(requestPayload.content) || extractTextFromPlateNode(requestPayload.content).trim().length === 0) {
      return 'Article body cannot be empty'
    }

    if (!requestPayload.slug.trim()) {
      return 'Slug is required'
    }

    const rawPublishDate = requestPayload.publishDate.trim()
    if (rawPublishDate) {
      const parsedPublishDate = new Date(rawPublishDate)
      if (Number.isNaN(parsedPublishDate.getTime())) {
        return 'Invalid publish date'
      }
    }

    const rawPrimaryChapterSlug = requestPayload.primaryChapterSlug.trim()
    if (rawPrimaryChapterSlug && !normalizeChapterSlug(rawPrimaryChapterSlug)) {
      return 'Primary chapter must be a valid chapter'
    }

    const invalidChapterSlug = requestPayload.chapterSlugs.find(
      (value) => value.trim().length > 0 && !normalizeChapterSlug(value),
    )
    if (invalidChapterSlug) {
      return 'Chapter affiliations must use valid chapters'
    }

    if (requestPayload.publishMode === 'scheduled') {
      if (!requestPayload.publishAt.trim()) {
        return 'Scheduled publish date is required'
      }
      const parsedScheduledDate = new Date(requestPayload.publishAt)
      if (Number.isNaN(parsedScheduledDate.getTime())) {
        return 'Invalid scheduled publish date'
      }
      if (parsedScheduledDate.getTime() <= Date.now()) {
        return 'Scheduled publish date must be in the future'
      }
    }

    return null
  }, [])

  const submitPublishPayload = useCallback(async (
    requestPayload: NewsPublishPayload,
    options?: { successMessage?: string; suppressToast?: boolean; source?: 'manual' | 'auto' },
  ): Promise<SubmitPublishResult> => {
    setIsSubmitting(true)

    try {
      const clientValidationMessage = validatePublishPayload(requestPayload)
      if (clientValidationMessage) {
        if (!options?.suppressToast) {
          toast.error(clientValidationMessage)
        }
        if (options?.source === 'auto') {
          setAutoSaveError(clientValidationMessage)
        }
        return { ok: false, message: clientValidationMessage }
      }

      const response = await fetch('/api/news/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
      })

      const responseText = await response.text()
      const responsePayload = (() => {
        if (!responseText) return {}
        try {
          return JSON.parse(responseText) as Record<string, unknown>
        } catch {
          return {}
        }
      })()

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
            return { ok: false, message: 'Broken links detected. Publish anyway.' }
          }
        }

        const message =
          responsePayload && typeof responsePayload === 'object' && 'error' in responsePayload
            ? String((responsePayload as { error?: unknown }).error || 'Could not save article')
            : `Save failed (${response.status})`
        if (!options?.suppressToast) {
          toast.error(message)
        }
        if (options?.source === 'auto') {
          setAutoSaveError(message)
        }
        return { ok: false, message }
      }

      const nextSlug =
        typeof responsePayload === 'object' && responsePayload && typeof (responsePayload as { slug?: unknown }).slug === 'string'
          ? ((responsePayload as { slug?: unknown }).slug as string)
          : requestPayload.slug
      const pendingApproval =
        typeof responsePayload === 'object' &&
        responsePayload &&
        (responsePayload as { pendingApproval?: unknown }).pendingApproval === true

      if (nextSlug && nextSlug !== slug) {
        setSlugDirty(true)
        setSlug(nextSlug)
      }

      if (nextSlug) {
        const nextUrl = new URL(window.location.href)
        nextUrl.searchParams.set('slug', nextSlug)
        window.history.replaceState(window.history.state, '', `${nextUrl.pathname}?${nextUrl.searchParams.toString()}`)
      }

      markCurrentSnapshotSaved()
      setHasPersistedSave(true)
      setLastSavedAt(new Date())
      setAutoSaveError(null)

      if (pendingApproval) {
        if (!options?.suppressToast) {
          toast.success(
            requestPayload.publishMode === 'scheduled'
              ? 'Scheduled publish request sent for admin approval'
              : 'Article submitted for admin approval',
          )
        }
        return { ok: true }
      }

      if (requestPayload.publishMode === 'publish') {
        setHasLiveVersion(true)
      } else {
        setHasLiveVersion(false)
      }

      const defaultSuccessMessage =
        requestPayload.publishMode === 'publish'
          ? 'Article published'
          : requestPayload.publishMode === 'scheduled'
            ? 'Article scheduled'
            : 'Saved'
      if (!options?.suppressToast) {
        toast.success(options?.successMessage || defaultSuccessMessage)
      }
      return { ok: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not save article'
      if (!options?.suppressToast) {
        toast.error(message)
      }
      if (options?.source === 'auto') {
        setAutoSaveError(message)
      }
      return { ok: false, message }
    } finally {
      setIsSubmitting(false)
    }
  }, [markCurrentSnapshotSaved, slug, validatePublishPayload])

  const handlePublishWarnings = () => {
    setPublishWarnings((current) => ({ ...current, open: false }))
    const warningPayload = publishWarnings.payload
    if (!warningPayload) return
    void submitPublishPayload(warningPayload)
  }

  const handleGenerateSeo = async () => {
    if (!isEditing) {
      toast.error('Save the article first to generate SEO metadata')
      return
    }

    if (!seoProvider?.configured) {
      const envVar = seoProvider?.envVar || 'OPENAI_API_KEY'
      toast.error(`Generate SEO metadata unavailable. Configure ${envVar} to enable generation.`)
      return
    }

    const slugForApi = slugifyArticleTitle(slug || title)
    if (!slugForApi) {
      toast.error('A valid slug is required')
      return
    }

    const force = seoSource === 'manual'
    if (force) {
      const confirmReplace = window.confirm(
        'This article has manual SEO metadata. Do you want to replace it with generated metadata?',
      )
      if (!confirmReplace) return
    }

    setSeoGenerateError('')
    setIsGeneratingSeo(true)
    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(slugForApi)}/generate-seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apply: false, force }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to generate SEO metadata')
      }

      const nextTitle = typeof payload?.seoTitle === 'string' ? payload.seoTitle.trim() : ''
      const nextDescription = typeof payload?.seoDescription === 'string' ? payload.seoDescription.trim() : ''
      if (!nextTitle || !nextDescription) {
        throw new Error('SEO generator returned incomplete metadata')
      }

      setSeoPreviewTitle(nextTitle)
      setSeoPreviewDescription(nextDescription)
      setSeoPreviewOpen(true)
      toast.success('SEO preview generated')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate SEO metadata'
      setSeoGenerateError(message)
      toast.error(message)
      setSeoPreviewOpen(false)
    } finally {
      setIsGeneratingSeo(false)
    }
  }

  const handleApplyGeneratedSeo = async () => {
    if (!seoPreviewOpen) return
    if (!seoPreviewTitle.trim() || !seoPreviewDescription.trim()) {
      toast.error('Generated SEO preview is incomplete')
      return
    }

    if (!isEditing) {
      toast.error('Save the article first to apply SEO metadata')
      return
    }

    const slugForApi = slugifyArticleTitle(slug || title)
    if (!slugForApi) {
      toast.error('A valid slug is required')
      return
    }

    const force = seoSource === 'manual'
    if (force) {
      const confirmReplace = window.confirm(
        'You are replacing manual SEO metadata. This cannot be undone automatically. Continue?',
      )
      if (!confirmReplace) return
    }

    setSeoGenerateError('')
    setIsApplyingSeo(true)
    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(slugForApi)}/generate-seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apply: true,
          force,
          seoTitle: seoPreviewTitle,
          seoDescription: seoPreviewDescription,
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to apply SEO metadata')
      }

      setSeoTitle(typeof payload?.seoTitle === 'string' ? payload.seoTitle : seoPreviewTitle)
      setSeoDescription(typeof payload?.seoDescription === 'string' ? payload.seoDescription : seoPreviewDescription)
      setSeoSource((typeof payload?.seoSource === 'string' ? payload.seoSource : 'auto') as 'manual' | 'auto' | null)
      setSeoNeedsReview(Boolean(payload?.seoNeedsReview))
      setSeoPreviewOpen(false)
      setSeoPreviewTitle('')
      setSeoPreviewDescription('')
      toast.success('SEO metadata applied')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to apply SEO metadata'
      setSeoGenerateError(message)
      toast.error(message)
    } finally {
      setIsApplyingSeo(false)
    }
  }

  const handleDiscardSeoPreview = () => {
    setSeoPreviewOpen(false)
    setSeoPreviewTitle('')
    setSeoPreviewDescription('')
    setSeoGenerateError('')
  }

  const loadNewsMedia = useCallback(async () => {
    setMediaLoading(true)

    try {
      const url = new URL('/api/assets/list', window.location.origin)
      url.searchParams.set('folder', NEWS_MEDIA_FOLDER)
      url.searchParams.set('limit', '80')
      url.searchParams.set('sort', 'newest')

      const response = await fetch(url.toString(), { cache: 'no-store' })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load media assets')
      }

      setMediaItems(Array.isArray(payload?.items) ? payload.items : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load media assets')
    } finally {
      setMediaLoading(false)
    }
  }, [])

  const loadHistory = useCallback(async () => {
    const normalizedSlug = slugifyArticleTitle(slug)
    if (!normalizedSlug) {
      setHistoryItems([])
      return
    }

    setHistoryLoading(true)
    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(normalizedSlug)}/history`, {
        cache: 'no-store',
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to load article history')
      }

      setHistoryItems(Array.isArray(payload?.items) ? payload.items : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load history')
      setHistoryItems([])
    } finally {
      setHistoryLoading(false)
    }
  }, [slug])

  const restoreHistory = useCallback(async (snapshotId: string) => {
    const normalizedSlug = slugifyArticleTitle(slug)
    if (!normalizedSlug) {
      toast.error('Save the article first before restoring a version')
      return
    }

    const confirmMessage =
      'This will overwrite your current draft with the selected version. This action cannot be undone.'
    if (!window.confirm(confirmMessage)) return

    setRestoringHistoryId(snapshotId)
    try {
      const response = await fetch(`/api/news/articles/${encodeURIComponent(normalizedSlug)}/history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ snapshotId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Failed to restore article')
      }

      toast.success('Article restored. Reloading editor...')
      const nextSlug = typeof payload?.slug === 'string' ? payload.slug : slug
      window.location.assign(`/edit/news/new?slug=${encodeURIComponent(nextSlug)}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to restore article')
      setRestoringHistoryId(null)
    }
  }, [slug])

  const insertCommentBlock = useCallback(() => {
    editor.tf.insertNodes(
      {
        type: KEYS.blockquote,
        children: [{ type: KEYS.p, children: [{ text: 'Comment: ' }] }],
      } as never,
      { select: true },
    )
    editor.tf.focus()
  }, [editor])

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
    (
      url: string,
      options?: { alt?: string; caption?: string; width?: number; height?: number; focalX?: number; focalY?: number },
    ) => {
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

  const openMediaPicker = useCallback(
    async (mode: MediaPickerMode) => {
      setMediaPickerMode(mode)
      setMediaQuery('')
      setMediaPickerOpen(true)
      await loadNewsMedia()
    },
    [loadNewsMedia],
  )

  const handleSelectMediaItem = useCallback(
    (item: MediaAssetItem) => {
      const label = inferAssetLabel(item)
      const url = buildAssetUrlWithFocal(item.key, item.focalX, item.focalY)

      if (mediaPickerMode === 'image') {
        insertImageNode(url, {
          alt: item.alt || label,
          caption: item.caption,
          width: item.width,
          height: item.height,
          focalX: item.focalX,
          focalY: item.focalY,
        })
      } else {
        insertFileLinkNode(buildAssetUrl(item.key), label)
      }

      setMediaPickerOpen(false)
    },
    [insertFileLinkNode, insertImageNode, mediaPickerMode],
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
          focalX: uploaded.focalX,
          focalY: uploaded.focalY,
        })
        setMediaPickerOpen(false)
        toast.success('Image uploaded to R2 and inserted')
        await loadNewsMedia()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Image upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertImageNode, loadNewsMedia],
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
        setMediaPickerOpen(false)
        toast.success('Attachment uploaded to R2 and inserted')
        await loadNewsMedia()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'File upload failed')
      } finally {
        setMediaBusy(false)
      }
    },
    [insertFileLinkNode, loadNewsMedia],
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

  const openVersionHistory = useCallback(() => {
    setHistoryOpen(true)
    void loadHistory()
  }, [loadHistory])

  const triggerDownload = useCallback((blob: Blob, fileName: string) => {
    const objectUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = objectUrl
    link.download = fileName
    document.body.append(link)
    link.click()
    link.remove()
    window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 2_000)
  }, [])

  const handleImportDocumentFile = useCallback(async (file: File) => {
    if (editorLockPage) {
      toast.error('This document is locked. Unlock it in Editor settings to import content.')
      return
    }

    setIsImportingDocument(true)
    try {
      const importedNodes = await importEditorDocumentFromFile(editor, file)
      const nextNodes = cloneDraftValue(importedNodes) as unknown[]
      const replaced = replaceDocumentWithNodes(nextNodes)
      if (!replaced) {
        throw new Error('Could not apply imported content')
      }

      setContent(nextNodes)
      editor.tf.focus()
      toast.success(`Imported ${file.name}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import document')
    } finally {
      setIsImportingDocument(false)
    }
  }, [editor, editorLockPage, replaceDocumentWithNodes])

  const onDocumentImportInputChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    await handleImportDocumentFile(file)
  }, [handleImportDocumentFile])

  const handleExportDocument = useCallback(async (format: 'md' | 'html' | 'pdf' | 'docx') => {
    setIsExportingDocument(true)
    try {
      const nodes = getCurrentEditorNodes(editor, content) as unknown[]
      const result = await exportEditorDocument(editor, nodes, format, title)
      triggerDownload(result.blob, result.fileName)
      toast.success(`Exported ${result.fileName}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export document')
    } finally {
      setIsExportingDocument(false)
    }
  }, [content, editor, title, triggerDownload])

  const toggleRightRailPanel = useCallback((panel: NewsEditorRightPanelKey) => {
    setRightRailPanel((current) => (current === panel ? null : panel))
  }, [])

  useEffect(() => {
    if (!showSettings) return
    setRightRailPanel(null)
  }, [showSettings])

  const runSlashCommand = useCallback(
    async (command: string) => {
      if (editorLockPage) return
      setSlashOpen(false)
      await runNewsSlashCommand({
        command,
        editor,
        openMediaPicker,
        insertVideoUrl,
        insertCommentBlock,
      })
    },
    [editor, editorLockPage, insertCommentBlock, insertVideoUrl, openMediaPicker],
  )

  const triggerMediaUpload = useCallback(() => {
    if (mediaPickerMode === 'image') {
      imageInputRef.current?.click()
      return
    }

    fileInputRef.current?.click()
  }, [mediaPickerMode])

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (editorLockPage) return

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSlashOpen(true)
        return
      }

      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      // Trigger slash command when "/" is typed at start of a line or after whitespace.
      const selection = window.getSelection()
      const isCollapsed = selection?.isCollapsed ?? false
      const anchorText = selection?.anchorNode?.textContent || ''
      const anchorOffset = selection?.anchorOffset ?? 0
      const prefix = anchorText.slice(0, anchorOffset)
      const shouldOpen = isCollapsed && (prefix.trim().length === 0 || /\s$/.test(prefix))

      if (shouldOpen) {
        event.preventDefault()
        setSlashOpen(true)
      }
    },
    [editorLockPage],
  )

  useEffect(() => {
    const openSlashFromGutter = (event: Event) => {
      event.preventDefault()
      if (editorLockPage) return
      setSlashOpen(true)
    }

    window.addEventListener('news-editor-open-slash-menu', openSlashFromGutter as EventListener)
    return () => {
      window.removeEventListener('news-editor-open-slash-menu', openSlashFromGutter as EventListener)
    }
  }, [editorLockPage])

  const submitForMode = async (
    modeOverride?: NewsPublishMode,
    successMessage?: string,
    options?: { publishAt?: string },
  ) => {
    if (editorLockPage) {
      toast.error('This document is locked. Unlock it in Editor settings to make changes.')
      return
    }

    const targetMode = modeOverride || publishMode

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

    const effectivePublishAt = options?.publishAt ?? publishAt
    const parsedPublishAt = targetMode === 'scheduled' ? londonDateTimeToUtc(effectivePublishAt) : null
    if (targetMode === 'scheduled' && !parsedPublishAt) {
      openScheduleDialog(successMessage)
      return
    }

    const requestPayload = buildPublishPayload(false, targetMode, effectivePublishAt)
    if (requestPayload.slug !== resolvedSlug) {
      requestPayload.slug = resolvedSlug
    }
    if (!requestPayload.slug) {
      toast.error('A valid slug is required')
      return
    }

    if (modeOverride) {
      setPublishMode(modeOverride)
    }
    if (targetMode === 'scheduled') {
      setPublishAt(effectivePublishAt)
    }

    await submitPublishPayload(requestPayload, { successMessage })
  }

  const handleSave = () => {
    void submitForMode(undefined, 'Saved')
  }

  const handlePublishNow = () => {
    void submitForMode('publish', isAdmin ? 'Article published' : 'Article submitted for admin approval')
  }

  const handleSchedule = () => {
    void submitForMode(
      'scheduled',
      isAdmin ? 'Article scheduled' : 'Scheduled publish request sent for admin approval',
    )
  }

  const handleScheduleDialogConfirm = () => {
    const nextPublishAt = scheduleDialogValue.trim()
    if (!londonDateTimeToUtc(nextPublishAt)) {
      toast.error('Valid scheduled publish date and time is required')
      return
    }

    setScheduleDialogOpen(false)
    void submitForMode('scheduled', pendingScheduleSuccessMessage || undefined, { publishAt: nextPublishAt })
  }

  const handlePreview = async () => {
    if (!previewSlug) {
      toast.error('A valid slug is required to preview')
      return
    }

    if (hasLiveVersion && isDirty) {
      toast.error('Save before previewing changes.')
      return
    }

    if (!hasPersistedSave || isDirty) {
      const requestPayload = buildPublishPayload(false, 'draft')
      requestPayload.slug = previewSlug
      const saved = await submitPublishPayload(requestPayload, {
        suppressToast: true,
        source: 'manual',
      })
      if (!saved.ok) {
        toast.error(saved.message || 'Save failed. Resolve validation issues, then preview again.')
        return
      }
    }

    if (previewSlug !== slug) {
      setSlugDirty(true)
      setSlug(previewSlug)
    }
    if (!hasLiveVersion && previewMode === 'live') {
      setPreviewMode('draft')
    }
    setPreviewRefreshToken((current) => current + 1)
    setPreviewOpen(true)
  }

  const handleResetDraftEdits = () => {
    if (!isDirty) return
    const baselineSnapshot = baselineSnapshotRef.current
    if (!baselineSnapshot) return
    applyDraftSnapshot(cloneDraftValue(baselineSnapshot))
    toast.success('Changes reset to last saved state')
  }

  const handleRunEditorialFixes = useCallback(() => {
    const fixResult = applyEditorialFixesToPlateContent(content)
    let changed = false

    if (fixResult.changed) {
      const nextNodes = cloneDraftValue(fixResult.content) as unknown[]
      const replaced = replaceDocumentWithNodes(nextNodes)
      if (replaced) {
        setContent(nextNodes)
        changed = true
      }
    }

    const summarySeed = suggestSummaryFromPlateContent(fixResult.content, SUMMARY_MAX_LENGTH)
    if ((desc.trim().length === 0 || summaryLooksIncomplete(desc)) && summarySeed && summarySeed !== desc) {
      setDesc(summarySeed)
      changed = true
    }

    if (!tags.length && tag.trim()) {
      setTags([tag.trim()])
      changed = true
    }

    if (heroImage.trim() && !imageCaption.trim()) {
      const nextCaption =
        title.trim() === 'Dr. Thalia and the Khelkhal Organization'
          ? 'Team members photographed at the annual gathering.'
          : suggestImageCaption(title)
      if (nextCaption !== imageCaption) {
        setImageCaption(nextCaption)
        changed = true
      }
    }

    const socialSummary = createArticleExcerpt(
      summarySeed || desc || suggestSummaryFromPlateContent(fixResult.content, 170),
      { maxChars: 170, preferSentence: true },
    )

    if (!openGraphTitle.trim() && title.trim()) {
      setOpenGraphTitle(title.trim())
      changed = true
    }
    if (!openGraphDescription.trim() && socialSummary) {
      setOpenGraphDescription(socialSummary)
      changed = true
    }
    if (!openGraphImage.trim() && heroImage.trim()) {
      setOpenGraphImage(heroImage.trim())
      changed = true
    }
    if (!twitterTitle.trim() && (openGraphTitle.trim() || title.trim())) {
      setTwitterTitle(openGraphTitle.trim() || title.trim())
      changed = true
    }
    if (!twitterDescription.trim() && (openGraphDescription.trim() || socialSummary)) {
      setTwitterDescription(openGraphDescription.trim() || socialSummary)
      changed = true
    }
    if (!twitterImage.trim() && (openGraphImage.trim() || heroImage.trim())) {
      setTwitterImage(openGraphImage.trim() || heroImage.trim())
      changed = true
    }

    const nextSeoTitle = !seoTitle.trim()
      ? createArticleExcerpt(title.trim(), { maxChars: 60, preferSentence: false })
      : ''
    const nextSeoDescription = !seoDescription.trim()
      ? createArticleExcerpt(socialSummary || summarySeed || desc, { maxChars: 160, preferSentence: true })
      : ''

    if (nextSeoTitle) {
      setSeoTitle(nextSeoTitle)
      changed = true
    }
    if (nextSeoDescription) {
      setSeoDescription(nextSeoDescription)
      changed = true
    }
    if (nextSeoTitle || nextSeoDescription) {
      setSeoSource('manual')
      setSeoNeedsReview(false)
    }

    if (changed) {
      const details: string[] = []
      if (fixResult.metrics.inlineHeadingPromotions > 0) {
        details.push(`${fixResult.metrics.inlineHeadingPromotions} heading promotion(s)`)
      }
      if (fixResult.metrics.duplicateOpeningParagraphsRemoved > 0) {
        details.push(`${fixResult.metrics.duplicateOpeningParagraphsRemoved} duplicate intro paragraph(s) removed`)
      }
      const detailLabel = details.length > 0 ? ` (${details.join(', ')})` : ''
      toast.success(`Editorial quick fixes applied${detailLabel}`)
      return
    }

    toast.info('No editorial quick fixes were needed')
  }, [
    content,
    desc,
    heroImage,
    imageCaption,
    openGraphDescription,
    openGraphImage,
    openGraphTitle,
    seoDescription,
    seoTitle,
    tag,
    tags.length,
    title,
    twitterDescription,
    twitterImage,
    twitterTitle,
    replaceDocumentWithNodes,
  ])

  useEffect(() => {
    if (!hasLiveVersion && previewMode === 'live') {
      setPreviewMode('draft')
    }
  }, [hasLiveVersion, previewMode])

  useEffect(() => {
    if (!isDirty || isSubmitting || isAutoSaving || mediaBusy || hasLiveVersion || publishMode !== 'draft') {
      return
    }

    const timer = window.setTimeout(() => {
      void (async () => {
        const autoSaveSlug = slugifyArticleTitle(slug || title)
        if (!autoSaveSlug) return

        const requestPayload = buildPublishPayload(false, 'draft')
        requestPayload.slug = autoSaveSlug
        if (!requestPayload.slug) return

        setIsAutoSaving(true)
        try {
          await submitPublishPayload(requestPayload, {
            suppressToast: true,
            source: 'auto',
          })
        } finally {
          setIsAutoSaving(false)
        }
      })()
    }, AUTO_SAVE_INTERVAL_MS)

    return () => {
      window.clearTimeout(timer)
    }
  }, [
    buildPublishPayload,
    hasLiveVersion,
    isAutoSaving,
    isDirty,
    isSubmitting,
    mediaBusy,
    publishMode,
    slug,
    submitPublishPayload,
    title,
  ])

  const saveStateMeta = useMemo(() => {
    if (isAutoSaving) {
      return {
        label: 'Auto-saving…',
        toneClass: 'text-muted-foreground',
      }
    }

    if (isSubmitting) {
      return {
        label: 'Saving…',
        toneClass: 'text-muted-foreground',
      }
    }

    if (autoSaveError && isDirty) {
      return {
        label: 'Auto-save failed. Save manually to retry.',
        toneClass: 'text-destructive',
      }
    }

    if (isDirty) {
      return {
        label: 'Unsaved changes',
        toneClass: 'text-amber-600',
      }
    }

    if (!hasPersistedSave) {
      return {
        label: 'Not saved yet',
        toneClass: 'text-muted-foreground',
      }
    }

    if (lastSavedAt) {
      return {
        label: `Last saved at ${lastSavedAt.toLocaleTimeString([], {
          hour: 'numeric',
          minute: '2-digit',
        })}`,
        toneClass: 'text-emerald-700',
      }
    }

    return {
      label: 'All changes saved',
      toneClass: 'text-emerald-700',
    }
  }, [autoSaveError, hasPersistedSave, isAutoSaving, isDirty, isSubmitting, lastSavedAt])

  const lastUpdatedHistory = useMemo(() => {
    return historyItems.map((item) => ({
      ...item,
      formattedDate: new Date(item.createdAt).toLocaleString(),
      title: item.title || 'Untitled article',
      actor: item.actorUserId || 'Unknown editor',
    }))
  }, [historyItems])

  return (
    <main
      className="news-article-editor min-h-screen bg-muted/20"
      style={
        {
          '--background': 'hsl(189 10% 99%)',
          '--muted': 'hsl(189 10% 95%)',
          '--border': 'hsl(189 8% 89%)',
          '--editor-font-family': editorFontFamilyStack,
        } as React.CSSProperties
      }
    >
      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={onImageInputChange} />
      <input ref={fileInputRef} type="file" className="hidden" onChange={onFileInputChange} />
      <input
        ref={documentImportInputRef}
        type="file"
        accept=".docx,.md,.markdown,.html,.htm,text/markdown,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={onDocumentImportInputChange}
      />

      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="w-full px-3 py-2 lg:px-6 xl:px-8">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 space-y-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => requestNavigation(() => window.location.assign(returnPath))}
                className="-ml-2 h-8"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to dashboard
              </Button>
              <p className="text-[12px] text-muted-foreground">{isEditing ? 'Editing article' : 'New article'}</p>
              <p className="max-w-[80ch] break-words text-sm font-medium leading-snug text-foreground">
                {title.trim() || 'Untitled article'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <NewsEditorGettingStartedButton />
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handlePreview()}
                disabled={isSubmitting || mediaBusy}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={isSubmitting || mediaBusy || editorLockPage}
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save
              </Button>

              <Button size="sm" onClick={handlePublishNow} disabled={isSubmitting || mediaBusy || editorLockPage}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {isAdmin ? 'Publish' : 'Submit for approval'}
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting || mediaBusy || isImportingDocument || isExportingDocument}
                  >
                    More
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onSelect={() => handleSchedule()} disabled={editorLockPage}>
                    <Clock3 className="h-4 w-4" />
                    {isAdmin ? 'Schedule publication' : 'Request scheduled publication'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => void handlePreview()} disabled={editorLockPage}>
                    <Eye className="h-4 w-4" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={openVersionHistory} disabled={!slug}>
                    <Clock3 className="h-4 w-4" />
                    Version history
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={(event) => {
                      event.preventDefault()
                      documentImportInputRef.current?.click()
                    }}
                    disabled={editorLockPage || isImportingDocument || isSubmitting || mediaBusy}
                  >
                    <Upload className="h-4 w-4" />
                    {isImportingDocument ? 'Importing…' : 'Import'}
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Download className="h-4 w-4" />
                      Export
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-44">
                      <DropdownMenuItem
                        onSelect={() => void handleExportDocument('docx')}
                        disabled={isExportingDocument || isSubmitting || mediaBusy}
                      >
                        Word (.docx)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleExportDocument('pdf')}
                        disabled={isExportingDocument || isSubmitting || mediaBusy}
                      >
                        PDF (.pdf)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleExportDocument('md')}
                        disabled={isExportingDocument || isSubmitting || mediaBusy}
                      >
                        Markdown (.md)
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => void handleExportDocument('html')}
                        disabled={isExportingDocument || isSubmitting || mediaBusy}
                      >
                        HTML (.html)
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuCheckboxItem
                    checked={showSettings}
                    onCheckedChange={(checked) => setShowSettings(Boolean(checked))}
                  >
                    Show settings panel
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Editor settings</DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-56">
                      <DropdownMenuCheckboxItem
                        checked={editorFullWidth}
                        onCheckedChange={(checked) => setEditorFullWidth(Boolean(checked))}
                      >
                        Full width
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={editorSmallText}
                        onCheckedChange={(checked) => setEditorSmallText(Boolean(checked))}
                      >
                        Small text
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem
                        checked={editorLockPage}
                        onCheckedChange={(checked) => setEditorLockPage(Boolean(checked))}
                      >
                        Lock page
                      </DropdownMenuCheckboxItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>Font family</DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-48">
                          <DropdownMenuRadioGroup
                            value={editorFontFamily}
                            onValueChange={(value) => setEditorFontFamily(value as NewsEditorFontFamily)}
                          >
                            <DropdownMenuRadioItem value="sans">Sans (Inter)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="serif">Serif</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="mono">Mono</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                      </DropdownMenuSub>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => handleResetDraftEdits()} disabled={!isDirty || editorLockPage}>
                    <RotateCcw className="h-4 w-4" />
                    Reset edits
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <p className={cn('w-full text-right text-[11px] md:w-auto md:text-left', saveStateMeta.toneClass)}>
                {saveStateMeta.label}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid w-full gap-6 px-3 py-6 lg:px-6 xl:px-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className={cn('min-w-0', !showSettings && 'xl:col-span-2')}>
          <Plate
            editor={editor}
            onChange={({ value }) => {
              setContent(Array.isArray(value) ? value : EMPTY_CONTENT)
            }}
          >
            <div
              className={cn(
                'mx-auto w-full rounded-lg bg-background/80 px-5 py-6',
                editorFullWidth ? 'max-w-[1200px]' : 'max-w-[860px]',
              )}
            >
              <Textarea
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Untitled article"
                rows={2}
                className="min-h-[78px] resize-none border-none bg-transparent px-0 py-0 text-[30px] font-semibold leading-[1.2] tracking-tight shadow-none focus-visible:ring-0"
                style={{ fontFamily: 'var(--editor-font-family)' }}
                disabled={editorLockPage}
              />
              <div className="mt-3 mb-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-[rgb(130,135,145)]">
                <span>By {authorName}</span>
                <span aria-hidden="true">•</span>
                <span>{publishDateLabel}</span>
                <span aria-hidden="true">•</span>
                <span>{tag}</span>
                <span
                  className={cn(
                    'ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
                    documentStatusLabel === 'Published'
                      ? 'bg-[hsl(142,60%,95%)] text-[hsl(142,60%,30%)]'
                      : 'bg-[hsl(38,90%,95%)] text-[hsl(38,80%,40%)]',
                  )}
                >
                  {documentStatusLabel}
                </span>
                {bylineTags.length > 0 ? (
                  <>
                    <span aria-hidden="true">•</span>
                    <span>{bylineTags.join(', ')}</span>
                  </>
                ) : null}
              </div>
            </div>

            <NewsDocumentToolbar
              isMagicConfigured={Boolean(magicProvider?.configured)}
              magicEnvVar={magicProvider?.envVar || 'OPENAI_API_KEY'}
              magicBusy={magicBusy}
              onMagic={(mode) => void handleMagicAction(mode)}
              canUndoMagic={magicCanUndo}
              onUndoMagic={restoreMagicUndoState}
              isUndoBusy={magicUndoBusy}
              disabled={editorLockPage}
              onInsertImage={() => void openMediaPicker('image')}
              onInsertVideo={() => insertVideoUrl()}
              onInsertFile={() => void openMediaPicker('file')}
            />
            <NewsEditorFloatingToolbar
              onOpenMagic={() => {
                if (editorLockPage) return
                void handleMagicAction('fix')
              }}
              onInsertComment={() => {
                if (editorLockPage) return
                insertCommentBlock()
              }}
            />

            <div
              className={cn(
                'relative mx-auto w-full pb-6',
                editorFullWidth ? 'max-w-[1320px]' : 'max-w-[980px]',
              )}
            >
              <TocSidebar
                className={cn(
                  'top-[104px] hidden xl:block',
                  showSettings ? 'right-[416px]' : 'right-2',
                )}
                topOffset={24}
              />
              <div className="mt-4 rounded-lg border border-border/60 bg-background shadow-[0_18px_40px_-24px_rgba(0,0,0,0.55)]">
                {stats.characters === 0 ? (
                  <div className="mx-8 mt-7 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
                    <p>Start writing here. Press &quot;/&quot; to insert blocks, or use the toolbar to format content.</p>
                    <p className="mt-1 text-xs">Tip: use headings to structure the article and improve readability.</p>
                  </div>
                ) : null}
                <PlateContent
                  placeholder="Type '/' for commands, or start writing your story..."
                  onKeyDown={handleEditorKeyDown}
                  readOnly={editorLockPage}
                  style={{ fontFamily: 'var(--editor-font-family)' }}
                  className={cn(
                    'min-h-[72vh] py-10 outline-none',
                    editorFullWidth ? 'px-10 md:px-14' : 'px-8 md:px-12',
                    editorSmallText ? 'text-[14px] leading-[1.6]' : 'text-base leading-[1.75]',
                    '**:data-slate-placeholder:text-muted-foreground/80 **:data-slate-placeholder:opacity-100!',
                    'selection:bg-primary/20',
                    '[&_h1]:mb-[0.25em] [&_h1]:mt-[1.5em] [&_h1]:text-[30px] [&_h1]:font-semibold',
                    '[&_h2]:mb-[0.25em] [&_h2]:mt-[1.75em] [&_h2]:text-[24px] [&_h2]:font-semibold',
                    '[&_h3]:mb-[0.25em] [&_h3]:mt-[1.25em] [&_h3]:text-[20px] [&_h3]:font-semibold',
                    '[&_.slate-h1]:mb-[0.25em] [&_.slate-h1]:mt-[1.5em] [&_.slate-h1]:text-[30px] [&_.slate-h1]:font-semibold',
                    '[&_.slate-h2]:mb-[0.25em] [&_.slate-h2]:mt-[1.75em] [&_.slate-h2]:text-[24px] [&_.slate-h2]:font-semibold',
                    '[&_.slate-h3]:mb-[0.25em] [&_.slate-h3]:mt-[1.25em] [&_.slate-h3]:text-[20px] [&_.slate-h3]:font-semibold',
                    '[&_p]:my-3',
                    '[&_.slate-p]:my-3',
                    '[&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic',
                    '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6',
                    '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6',
                    '[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4',
                    '[&_hr]:my-7 [&_hr]:border-border/70',
                    '[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/70 [&_pre]:bg-muted/60 [&_pre]:p-4',
                    '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
                    '[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.92em]',
                    '[&_mark]:rounded-sm [&_mark]:bg-primary/20 [&_mark]:px-1 [&_mark]:py-0.5',
                    '[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-border',
                    '[&_video]:my-4 [&_video]:w-full [&_video]:rounded-lg [&_video]:border [&_video]:border-border',
                    '[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2',
                  )}
                />
              </div>
              <div className="sticky bottom-0 z-10 mt-3 flex items-center justify-between border-t border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground opacity-70 backdrop-blur transition-opacity duration-150 hover:opacity-100">
                <span className="flex items-center">
                  <span>{stats.words} words</span>
                  <span className="mx-2 text-border">|</span>
                  <span>{stats.characters} characters</span>
                  <span className="mx-2 text-border">|</span>
                  <span>{editorSmallText ? 'Small text' : 'Normal text'}</span>
                </span>
                <span className={cn('hidden md:inline', savePulseActive && 'news-editor-save-pulse')}>
                  {saveStateMeta.label}
                </span>
              </div>
            </div>
          </Plate>
        </section>

        <aside
          className={cn(
            'w-full shrink-0 xl:sticky xl:top-[88px] xl:h-[calc(100dvh-6rem)] xl:w-[400px]',
            showSettings && 'news-editor-panel-enter',
            !showSettings && 'hidden',
          )}
        >
          <NewsEditorSettingsPanel
            slug={slug}
            title={title}
            tag={tag}
            tags={tags}
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
            onTagsChange={setTags}
            onDescChange={(value) => setDesc(value.slice(0, SUMMARY_MAX_LENGTH))}
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
            authorLocked={false}
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
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            seoSource={seoSource}
            seoNeedsReview={seoNeedsReview}
            seoProvider={seoProvider}
            seoProviderLoading={seoProviderLoading}
            seoGenerating={isGeneratingSeo}
            seoApplyLoading={isApplyingSeo}
            seoPreviewOpen={seoPreviewOpen}
            seoPreviewTitle={seoPreviewTitle}
            seoPreviewDescription={seoPreviewDescription}
            seoGenerateError={seoGenerateError}
            onSeoTitleChange={(value) => {
              setSeoTitle(value)
              setSeoSource('manual')
              setSeoNeedsReview(false)
            }}
            onSeoDescriptionChange={(value) => {
              setSeoDescription(value)
              setSeoSource('manual')
              setSeoNeedsReview(false)
            }}
            onGenerateSeo={handleGenerateSeo}
            onApplySeoPreview={handleApplyGeneratedSeo}
            onDiscardSeoPreview={handleDiscardSeoPreview}
            summaryMaxLength={SUMMARY_MAX_LENGTH}
            wordCount={stats.words}
            editorHeadingCount={contentStructure.headingCount}
            inlineHeadingCandidates={contentStructure.inlineHeadingCandidates}
            duplicateIntroDetected={contentStructure.duplicateOpeningParagraph}
            onRunEditorialFixes={handleRunEditorialFixes}
            editorialFixDisabled={isSubmitting || mediaBusy}
            className="h-full"
          />
        </aside>
      </div>

      <NewsEditorRightRail
        activePanel={rightRailPanel}
        onTogglePanel={toggleRightRailPanel}
        onOpenVersionHistory={openVersionHistory}
        historyItemCount={historyItems.length}
        saveStateLabel={saveStateMeta.label}
        settingsOpen={showSettings}
        className={cn(showSettings && 'xl:hidden')}
      />

      <NewsEditorPreviewSheet
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        slug={previewSlug || null}
        previewMode={previewMode}
        onPreviewModeChange={setPreviewMode}
        canViewLive={hasLiveVersion}
        refreshToken={previewRefreshToken}
        onRefresh={() => setPreviewRefreshToken((current) => current + 1)}
      />

      <NewsEditorCommandDialogs
        slashOpen={slashOpen}
        onSlashOpenChange={setSlashOpen}
        onRunSlashCommand={(command) => void runSlashCommand(command)}
        mediaPickerOpen={mediaPickerOpen}
        onMediaPickerOpenChange={setMediaPickerOpen}
        mediaPickerMode={mediaPickerMode}
        mediaFolder={NEWS_MEDIA_FOLDER}
        mediaQuery={mediaQuery}
        onMediaQueryChange={setMediaQuery}
        mediaLoading={mediaLoading}
        mediaBusy={mediaBusy}
        mediaList={mediaList}
        onRefreshMedia={() => void loadNewsMedia()}
        onUploadMedia={triggerMediaUpload}
        onSelectMediaItem={handleSelectMediaItem}
        formatAssetLabel={inferAssetLabel}
      />

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule publication</DialogTitle>
            <DialogDescription>
              Choose the publish date and time in Europe/London. This field is also available in Settings under Publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="article-schedule-dialog">Publish at (Europe/London)</Label>
              <Input
                id="article-schedule-dialog"
                type="datetime-local"
                value={scheduleDialogValue}
                onChange={(event) => setScheduleDialogValue(event.target.value)}
                placeholder="2026-01-01T12:00"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleScheduleDialogConfirm}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={magicPreviewOpen}
        onOpenChange={(open) => {
          if (!open) {
            discardMagicPreview()
          } else {
            setMagicPreviewOpen(true)
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Magic suggestion</DialogTitle>
            <DialogDescription>Review the suggested text, then apply or discard.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Original</p>
              <Textarea
                value={magicOriginalText}
                readOnly
                rows={6}
                className="resize-none bg-muted/40"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground">Suggested</p>
              <Textarea
                value={magicSuggestedText}
                readOnly
                rows={6}
                className="resize-none bg-muted/40"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={discardMagicPreview} disabled={magicApplying || magicUndoBusy}>
              Discard
            </Button>
            <Button onClick={() => void applyMagicSuggestion()} disabled={magicApplying || !magicTarget}>
              {magicApplying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={historyOpen}
        onOpenChange={(open) => {
          setHistoryOpen(open)
          if (open) {
            void loadHistory()
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Article history</DialogTitle>
            <DialogDescription>Restore a previous saved version. This will replace your current draft.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[55vh] space-y-2 overflow-auto py-2">
            {!historyItems.length && !historyLoading ? (
              <p className="text-sm text-muted-foreground">No saved versions found yet.</p>
            ) : null}
            {historyLoading ? <p className="text-sm text-muted-foreground">Loading history…</p> : null}
            {lastUpdatedHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.formattedDate} • {item.actor} • {item.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void restoreHistory(item.id)}
                    disabled={restoringHistoryId === item.id}
                  >
                    {restoringHistoryId === item.id ? 'Restoring...' : 'Restore'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={leaveDialogOpen} onOpenChange={setLeaveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave without saving?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes in this article editor. If you leave now, those changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>Stay here</AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation}>Leave page</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
