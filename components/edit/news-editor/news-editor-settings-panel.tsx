'use client'

import { useMemo, useState } from 'react'

import { CollapsibleAssetField } from '@/components/edit/collapsible-asset-field'
import { NewsEditorReadinessCard } from '@/components/edit/news-editor/news-editor-readiness-card'
import { slugifyArticleTitle } from '@/lib/news-slug'
import { cn } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { NewsEditorChapterSection } from '@/components/edit/news-editor/news-editor-chapter-section'
import { NewsEditorSeoSection } from '@/components/edit/news-editor/news-editor-seo-section'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_TAGS } from './news-editor-plate-utils'

type SeoProviderInfo = {
  configured: boolean
  envVar: string
}

type SeoSource = 'manual' | 'auto' | null

export type NewsPublishMode = 'draft' | 'publish' | 'scheduled'

type NewsArticleSettingsPanelProps = {
  title: string
  slug: string
  tag: string
  tags?: string[]
  desc: string
  heroImage: string
  imageCaption: string
  authorName: string
  authorImage: string
  primaryChapterSlug?: string
  chapterSlugs?: string[]
  publishDate: string
  publishMode: NewsPublishMode
  publishAt: string
  openGraphTitle: string
  openGraphDescription: string
  openGraphImage: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  onSlugChange: (slug: string) => void
  onTagChange: (tag: string) => void
  onTagsChange?: (tags: string[]) => void
  onDescChange: (desc: string) => void
  onHeroImageChange: (value: string) => void
  onImageCaptionChange: (value: string) => void
  onAuthorNameChange: (value: string) => void
  onAuthorImageChange: (value: string) => void
  onPrimaryChapterChange?: (value: string) => void
  onChapterToggle?: (slug: string, checked: boolean) => void
  onPublishDateChange: (value: string) => void
  onPublishModeChange: (value: NewsPublishMode) => void
  onPublishAtChange: (value: string) => void
  onOpenGraphTitleChange: (value: string) => void
  onOpenGraphDescriptionChange: (value: string) => void
  onOpenGraphImageChange: (value: string) => void
  onTwitterTitleChange: (value: string) => void
  onTwitterDescriptionChange: (value: string) => void
  onTwitterImageChange: (value: string) => void
  seoTitle?: string
  seoDescription?: string
  seoSource?: SeoSource
  seoNeedsReview?: boolean
  seoProvider?: SeoProviderInfo | null
  seoProviderLoading?: boolean
  seoGenerating?: boolean
  seoApplyLoading?: boolean
  seoPreviewOpen?: boolean
  seoPreviewTitle?: string
  seoPreviewDescription?: string
  seoGenerateError?: string
  onSeoTitleChange?: (value: string) => void
  onSeoDescriptionChange?: (value: string) => void
  onGenerateSeo?: () => void
  onApplySeoPreview?: () => void
  onDiscardSeoPreview?: () => void
  authorLocked?: boolean
  summaryMaxLength?: number
  wordCount?: number
  editorHeadingCount?: number
  inlineHeadingCandidates?: number
  duplicateIntroDetected?: boolean
  onRunEditorialFixes?: () => void
  editorialFixDisabled?: boolean
  className?: string
}

type RequiredFieldItem = {
  id: string
  label: string
  complete: boolean
  section: string
}

function normalizeTags(values: string[]) {
  const seen = new Set<string>()
  const next: string[] = []

  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(trimmed)
  }

  return next
}

export function NewsEditorSettingsPanel({
  title,
  slug,
  tag,
  tags = [],
  desc,
  heroImage,
  imageCaption,
  authorName,
  authorImage,
  primaryChapterSlug = '',
  chapterSlugs = [],
  publishDate,
  publishMode,
  publishAt,
  openGraphTitle,
  openGraphDescription,
  openGraphImage,
  twitterTitle,
  twitterDescription,
  twitterImage,
  onSlugChange,
  onTagChange,
  onTagsChange = () => {},
  onDescChange,
  onHeroImageChange,
  onImageCaptionChange,
  onAuthorNameChange,
  onAuthorImageChange,
  onPrimaryChapterChange = () => {},
  onChapterToggle = () => {},
  onPublishDateChange,
  onPublishModeChange,
  onPublishAtChange,
  onOpenGraphTitleChange,
  onOpenGraphDescriptionChange,
  onOpenGraphImageChange,
  onTwitterTitleChange,
  onTwitterDescriptionChange,
  onTwitterImageChange,
  seoTitle = '',
  seoDescription = '',
  seoSource = null,
  seoNeedsReview = false,
  seoProvider = null,
  seoProviderLoading = false,
  seoGenerating = false,
  seoApplyLoading = false,
  seoPreviewOpen = false,
  seoPreviewTitle = '',
  seoPreviewDescription = '',
  seoGenerateError,
  onSeoTitleChange = () => {},
  onSeoDescriptionChange = () => {},
  onGenerateSeo = () => {},
  onApplySeoPreview = () => {},
  onDiscardSeoPreview = () => {},
  authorLocked = false,
  summaryMaxLength = 200,
  wordCount = 0,
  editorHeadingCount,
  inlineHeadingCandidates = 0,
  duplicateIntroDetected = false,
  onRunEditorialFixes,
  editorialFixDisabled = false,
  className,
}: NewsArticleSettingsPanelProps) {
  const [openSections, setOpenSections] = useState<string[]>(['publishing', 'media'])
  const [requiredExpanded, setRequiredExpanded] = useState(false)
  const showScheduleInput = publishMode === 'scheduled'
  const seoStatus =
    seoSource === 'manual'
      ? 'Manual'
      : seoNeedsReview
        ? 'Needs review'
        : seoSource === 'auto'
          ? 'Auto-generated'
          : 'Needs review'
  const seoStatusVariant = seoSource === 'manual' || seoNeedsReview ? 'default' : 'secondary'
  const providerInfo = seoProvider || { configured: false, envVar: 'OPENAI_API_KEY' }
  const isGenerateReady = !seoGenerating && !seoApplyLoading && !seoProviderLoading && providerInfo.configured
  const summaryCount = desc.length
  const summaryNearLimit = summaryCount >= Math.max(0, summaryMaxLength - 20)
  const summaryOverLimit = summaryCount > summaryMaxLength
  const summaryLooksIncomplete = summaryCount > 0 && !/(?:[.!?]|…|\.{3})["')\]]?$/.test(desc.trim())
  const missingImageCaption = heroImage.trim().length > 0 && imageCaption.trim().length === 0
  const headingCount = typeof editorHeadingCount === 'number' ? editorHeadingCount : null
  const hasMinimalHeadingStructure = headingCount !== null && headingCount <= 1
  const titleTooShort = title.trim().length > 0 && title.trim().length < 30
  const articleTooShort = wordCount > 0 && wordCount < 800

  const normalizedTags = useMemo(() => normalizeTags(tags), [tags])
  const missingTags = normalizedTags.length === 0
  const [tagInputValue, setTagInputValue] = useState('')
  const tagSuggestions = useMemo(() => {
    const defaults = [...DEFAULT_TAGS, tag]
    return normalizeTags(defaults).filter((option) => !normalizedTags.some((existing) => existing.toLowerCase() === option.toLowerCase()))
  }, [normalizedTags, tag])

  const requiredFieldItems = useMemo<RequiredFieldItem[]>(() => {
    return [
      { id: 'title', label: 'Title', complete: title.trim().length > 0, section: 'publishing' },
      { id: 'slug', label: 'Slug', complete: slugifyArticleTitle(slug).length > 0, section: 'publishing' },
      { id: 'category', label: 'Category', complete: tag.trim().length > 0, section: 'publishing' },
      { id: 'chapter', label: 'Primary chapter', complete: primaryChapterSlug.trim().length > 0, section: 'publishing' },
      { id: 'publish-date', label: 'Publish date', complete: publishDate.trim().length > 0, section: 'publishing' },
      { id: 'summary', label: 'Summary', complete: desc.trim().length > 0, section: 'publishing' },
      { id: 'hero-image', label: 'Hero image', complete: heroImage.trim().length > 0, section: 'media' },
      { id: 'author', label: 'Author name', complete: authorName.trim().length > 0, section: 'media' },
      {
        id: 'publish-at',
        label: 'Scheduled publish time',
        complete: publishMode !== 'scheduled' || publishAt.trim().length > 0,
        section: 'publishing',
      },
    ] as const
  }, [authorName, desc, heroImage, primaryChapterSlug, publishAt, publishDate, publishMode, slug, tag, title])

  const completeRequired = requiredFieldItems.filter((item) => item.complete).length
  const requiredTotal = requiredFieldItems.length
  const completionPercent = Math.round((completeRequired / requiredTotal) * 100)
  const seoNeedsGuidance = seoNeedsReview || !seoTitle.trim() || !seoDescription.trim()
  const seoReviewReasons = useMemo(() => {
    const reasons: string[] = []
    if (seoNeedsReview) {
      reasons.push('Generated SEO metadata is marked for manual review.')
    }
    if (!seoTitle.trim()) {
      reasons.push('SEO title is empty.')
    }
    if (!seoDescription.trim()) {
      reasons.push('SEO description is empty.')
    }
    return reasons
  }, [seoDescription, seoNeedsReview, seoTitle])
  const editorialWarnings = useMemo(() => {
    const warnings: string[] = []

    if (hasMinimalHeadingStructure) {
      warnings.push('Document has minimal heading structure. Add H2/H3 headings for better TOC and SEO.')
    }
    if (inlineHeadingCandidates > 0) {
      warnings.push(`${inlineHeadingCandidates} paragraph(s) look like inline headings. Promote them to Heading 2.`)
    }
    if (duplicateIntroDetected) {
      warnings.push('Opening paragraph appears duplicated. Remove the repeated intro copy.')
    }
    if (summaryLooksIncomplete) {
      warnings.push('Summary may be incomplete. End with a full sentence for cleaner listing cards.')
    }
    if (missingImageCaption) {
      warnings.push('Hero image caption is empty. Add context or attribution for the lead image.')
    }
    if (missingTags) {
      warnings.push('Tags are empty. Add at least one tag to improve news filtering.')
    }
    if (titleTooShort) {
      warnings.push('Title may be too short. Aim for at least 30 characters for clearer article context.')
    }
    if (articleTooShort) {
      warnings.push(`Article is ${wordCount} words. Long-form pieces typically target 800+ words.`)
    }

    return warnings
  }, [
    articleTooShort,
    duplicateIntroDetected,
    hasMinimalHeadingStructure,
    inlineHeadingCandidates,
    missingImageCaption,
    missingTags,
    summaryLooksIncomplete,
    titleTooShort,
    wordCount,
  ])

  const addTag = (rawValue: string) => {
    const splitValues = rawValue
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
    if (splitValues.length === 0) return
    const next = normalizeTags([...normalizedTags, ...splitValues])
    onTagsChange(next)
    setTagInputValue('')
  }

  const removeTag = (value: string) => {
    const next = normalizedTags.filter((tagValue) => tagValue.toLowerCase() !== value.toLowerCase())
    onTagsChange(next)
  }

  const jumpToSection = (section: string) => {
    setOpenSections((current) => (current.includes(section) ? current : [...current, section]))
  }

  return (
    <Card className={cn('flex h-full min-h-0 flex-col', className)}>
      <CardHeader className="space-y-3 border-b border-border/60">
        <div>
          <CardTitle>Article settings</CardTitle>
          <CardDescription>Publishing and metadata fields for this article.</CardDescription>
        </div>
        <NewsEditorReadinessCard
          completeRequired={completeRequired}
          requiredTotal={requiredTotal}
          completionPercent={completionPercent}
          requiredExpanded={requiredExpanded}
          onToggleRequiredExpanded={() => setRequiredExpanded((prev) => !prev)}
          requiredFieldItems={requiredFieldItems}
          onJumpToSection={jumpToSection}
          editorialWarnings={editorialWarnings}
          onRunEditorialFixes={onRunEditorialFixes}
          editorialFixDisabled={editorialFixDisabled}
        />
      </CardHeader>

      <CardContent className="min-h-0 flex-1 p-0">
        <ScrollArea className="h-full px-4 pb-6 pt-2">
          <Accordion
            type="multiple"
            value={openSections}
            onValueChange={(nextSections) => {
              if (!nextSections.includes('publishing')) {
                setOpenSections(['publishing', ...nextSections])
                return
              }
              setOpenSections(nextSections)
            }}
            className="w-full"
          >
            <AccordionItem value="publishing">
              <AccordionTrigger>Publishing</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={tag} onValueChange={onTagChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_TAGS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Category controls which news section this article appears in.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="article-tags">Tags</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {normalizedTags.length > 0 ? (
                      normalizedTags.map((value) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => removeTag(value)}
                          className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/35 px-2 py-1 text-xs text-foreground hover:bg-muted"
                          title="Remove tag"
                        >
                          {value}
                          <span aria-hidden="true">&times;</span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">No tags yet.</p>
                    )}
                  </div>
                  <Input
                    id="article-tags"
                    value={tagInputValue}
                    onChange={(event) => setTagInputValue(event.target.value)}
                    onBlur={() => {
                      if (!tagInputValue.trim()) return
                      addTag(tagInputValue)
                    }}
                    onKeyDown={(event) => {
                      if (event.key !== 'Enter' && event.key !== ',') return
                      event.preventDefault()
                      addTag(tagInputValue)
                    }}
                    placeholder="Add a tag and press Enter"
                  />
                  {tagSuggestions.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {tagSuggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => addTag(suggestion)}
                          className="rounded-full border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                          + {suggestion}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <p className="text-xs text-muted-foreground">Tags improve filtering and related-article discovery.</p>
                </div>

                <NewsEditorChapterSection
                  primaryChapterSlug={primaryChapterSlug}
                  chapterSlugs={chapterSlugs}
                  onPrimaryChapterChange={onPrimaryChapterChange}
                  onChapterToggle={onChapterToggle}
                />

                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={publishMode} onValueChange={(value) => onPublishModeChange(value as NewsPublishMode)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="publish">Publish now</SelectItem>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="article-slug">Slug</Label>
                  <Input
                    id="article-slug"
                    value={slug}
                    onChange={(event) => onSlugChange(slugifyArticleTitle(event.target.value))}
                    placeholder="article-slug"
                  />
                  <p className="text-xs text-muted-foreground">
                    URL path for this article. Keep it short and descriptive.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="article-date">Publish date</Label>
                  <Input
                    id="article-date"
                    type="date"
                    value={publishDate}
                    onChange={(event) => onPublishDateChange(event.target.value)}
                  />
                </div>

                {showScheduleInput ? (
                  <div className="space-y-2">
                    <Label htmlFor="article-publish-at">Publish at (Europe/London)</Label>
                    <Input
                      id="article-publish-at"
                      type="datetime-local"
                      value={publishAt}
                      onChange={(event) => onPublishAtChange(event.target.value)}
                      placeholder="2026-01-01T12:00"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="article-summary">Summary</Label>
                  <Textarea
                    id="article-summary"
                    value={desc}
                    onChange={(event) => onDescChange(event.target.value)}
                    placeholder="Short summary shown in news cards"
                    className="min-h-[110px]"
                    maxLength={summaryMaxLength}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Aim for a concise card-friendly summary.</span>
                    <span className={cn(summaryOverLimit ? 'text-destructive' : summaryNearLimit ? 'text-amber-600' : 'text-muted-foreground')}>
                      {summaryCount} / {summaryMaxLength}
                    </span>
                  </div>
                  {summaryLooksIncomplete ? (
                    <p className="text-xs text-amber-600">Summary appears unfinished. End with punctuation for cleaner previews.</p>
                  ) : null}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="media">
              <AccordionTrigger>Media</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <CollapsibleAssetField label="Hero image" value={heroImage} onChange={onHeroImageChange} />

                <div className="space-y-2">
                  <Label htmlFor="article-image-caption">Image caption</Label>
                  <Input
                    id="article-image-caption"
                    value={imageCaption}
                    onChange={(event) => onImageCaptionChange(event.target.value)}
                    placeholder="Optional caption"
                  />
                  {missingImageCaption ? (
                    <p className="text-xs text-amber-600">Add a descriptive caption for context and accessibility.</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="article-author">Author name</Label>
                  <Input
                    id="article-author"
                    value={authorName}
                    onChange={(event) => onAuthorNameChange(event.target.value)}
                    placeholder="Author name"
                    readOnly={authorLocked}
                    disabled={authorLocked}
                  />
                  {authorLocked ? (
                    <p className="text-xs text-muted-foreground">
                      Linked to the signed-in profile.
                    </p>
                  ) : null}
                </div>

                <CollapsibleAssetField
                  label="Author image"
                  value={authorImage}
                  onChange={onAuthorImageChange}
                  disabled={authorLocked}
                />
              </AccordionContent>
            </AccordionItem>

            <NewsEditorSeoSection
              title={title}
              description={desc}
              openGraphTitle={openGraphTitle}
              openGraphDescription={openGraphDescription}
              openGraphImage={openGraphImage}
              twitterTitle={twitterTitle}
              twitterDescription={twitterDescription}
              twitterImage={twitterImage}
              seoTitle={seoTitle}
              seoDescription={seoDescription}
              seoStatus={seoStatus}
              seoStatusVariant={seoStatusVariant}
              seoNeedsReview={seoNeedsReview}
              seoNeedsGuidance={seoNeedsGuidance}
              seoReviewReasons={seoReviewReasons}
              providerInfo={providerInfo}
              isGenerateReady={isGenerateReady}
              seoProviderLoading={seoProviderLoading}
              seoGenerating={seoGenerating}
              seoApplyLoading={seoApplyLoading}
              seoPreviewOpen={seoPreviewOpen}
              seoPreviewTitle={seoPreviewTitle}
              seoPreviewDescription={seoPreviewDescription}
              seoGenerateError={seoGenerateError}
              onOpenGraphTitleChange={onOpenGraphTitleChange}
              onOpenGraphDescriptionChange={onOpenGraphDescriptionChange}
              onOpenGraphImageChange={onOpenGraphImageChange}
              onTwitterTitleChange={onTwitterTitleChange}
              onTwitterDescriptionChange={onTwitterDescriptionChange}
              onTwitterImageChange={onTwitterImageChange}
              onSeoTitleChange={onSeoTitleChange}
              onSeoDescriptionChange={onSeoDescriptionChange}
              onGenerateSeo={onGenerateSeo}
              onApplySeoPreview={onApplySeoPreview}
              onDiscardSeoPreview={onDiscardSeoPreview}
            />
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
