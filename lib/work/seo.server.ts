import { extractPlainTextFromPlate, normalizePlateValue } from '@/lib/work-plate-transform'
import { WorkArticle } from '@/models/WorkArticle'
import {
  generateSEOFromArticleText,
  type SeoGenerationResult as ProviderSeoGenerationResult,
} from '@/lib/ai/seo-provider.server'

export type WorkSEOTargetArticle = {
  title?: string | null
  desc?: string | null
  content?: unknown
  seoTitle?: string | null
  seoDescription?: string | null
  seoSource?: 'manual' | 'auto' | null
}

export type SeoGenerationOptions = {
  force?: boolean
  timeoutMs?: number
  allowManualOverwrite?: boolean
}

export type SeoGenerationResult = {
  seoTitle: string
  seoDescription: string
  model?: string
  generatedAt: Date
}

const SEO_TITLE_MIN_CHARS = 40
const SEO_TITLE_TARGET_MAX_CHARS = 70
const SEO_DESCRIPTION_MIN_CHARS = 120
const SEO_DESCRIPTION_TARGET_MAX_CHARS = 170
const SEO_FALLBACK_TITLE = 'Latest updates and analysis'
const SEO_FALLBACK_DESCRIPTION = 'Read the latest coverage and analysis on this topic.'
const SEO_GENERATION_TIMEOUT_MS = 5000

function stripQuotes(text: string) {
  return text.replace(/^[`"']+|[`"']+$/g, '')
}

function trimAndNormalize(text: string) {
  return text
    .replace(/\u00A0/g, ' ')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function removeLeadingSeoPrefixes(text: string) {
  return text
    .replace(/^(?:seo\s*)?(?:title|headline|meta\s*title)\s*:\s*/i, '')
    .replace(/^(?:meta\s*description|description)\s*:\s*/i, '')
    .trim()
}

function clampToWordBoundary(text: string, maxChars: number) {
  const normalized = trimAndNormalize(text)
  if (!normalized || normalized.length <= maxChars) return normalized

  const chunks = normalized.split(/\s+/)
  let next = ''
  for (const chunk of chunks) {
    const candidate = next ? `${next} ${chunk}` : chunk
    if (candidate.length > maxChars) break
    next = candidate
  }
  return next || normalized.slice(0, maxChars).trim()
}

function capitalizeAfterPunctuation(value: string) {
  return value.replace(/\b\w/gu, (char) => char.toLowerCase()).replace(/^\w/, (char) => char.toUpperCase())
}

function deriveArticleBody(article: WorkSEOTargetArticle) {
  const normalized = normalizePlateValue(article.content)
  const plateText = extractPlainTextFromPlate(normalized)
  return plateText || (typeof article.desc === 'string' ? article.desc : '')
}

function sanitizeSeoText(value: string) {
  const text = removeLeadingSeoPrefixes(stripQuotes(trimAndNormalize(value)))
  return text
    .replace(/[`*_>#\[\]()]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export function shouldGenerateSEOForArticle(
  article: WorkSEOTargetArticle,
  options?: { force?: boolean; allowManualOverwrite?: boolean },
) {
  if (!article) {
    return false
  }

  const source = article.seoSource
  const hasExistingTitle = trimAndNormalize(String(article.seoTitle || '').trim())
  const hasExistingDescription = trimAndNormalize(String(article.seoDescription || '').trim())
  const hasExistingCopy = Boolean(hasExistingTitle || hasExistingDescription)

  if (source === 'manual') {
    return Boolean(options?.force && options.allowManualOverwrite)
  }

  if (hasExistingCopy && !options?.force) {
    return false
  }

  return true
}

function buildFallbackDescription(context: string, title: string) {
  const base = context ? context.replace(/\s+/, ' ').trim() : ''
  if (base.length >= SEO_DESCRIPTION_MIN_CHARS) {
    return clampToWordBoundary(base, SEO_DESCRIPTION_TARGET_MAX_CHARS)
  }

  const fallback = [title, base].map(trimAndNormalize).filter(Boolean).join(' ') || SEO_FALLBACK_DESCRIPTION
  return clampToWordBoundary(fallback, SEO_DESCRIPTION_TARGET_MAX_CHARS)
}

export function postProcessSEO(raw: {
  title: string
  description: string
  articleTitle: string
  articleBody: string
}) {
  const titleInput = sanitizeSeoText(raw.title)
  const descriptionInput = sanitizeSeoText(raw.description)

  let seoTitle = clampToWordBoundary(titleInput || raw.articleTitle, SEO_TITLE_TARGET_MAX_CHARS)
  if (!seoTitle) {
    seoTitle = SEO_FALLBACK_TITLE
  }
  seoTitle = capitalizeAfterPunctuation(seoTitle)

  if (seoTitle.length < SEO_TITLE_MIN_CHARS && raw.articleTitle) {
    const fallback = clampToWordBoundary(sanitizeSeoText(raw.articleTitle), SEO_TITLE_TARGET_MAX_CHARS)
    if (fallback) {
      seoTitle = fallback
    }
  }

  const fallbackBody = buildFallbackDescription(raw.articleBody, raw.articleTitle)
  let seoDescription = descriptionInput || fallbackBody
  seoDescription = clampToWordBoundary(seoDescription, SEO_DESCRIPTION_TARGET_MAX_CHARS)

  if (seoDescription.length < SEO_DESCRIPTION_MIN_CHARS) {
    seoDescription = clampToWordBoundary(`${seoDescription} ${fallbackBody}`, SEO_DESCRIPTION_TARGET_MAX_CHARS)
  }

  return {
    seoTitle: seoTitle || SEO_FALLBACK_TITLE,
    seoDescription: seoDescription || SEO_FALLBACK_DESCRIPTION,
  }
}

function toProviderOptions(options?: SeoGenerationOptions) {
  return options?.timeoutMs
}

export function postProcessSEOForUI(raw: {
  title: string
  description: string
  articleTitle: string
  articleBody: string
}) {
  return postProcessSEO(raw)
}

export async function computeSEOForArticle(
  article: WorkSEOTargetArticle,
  options: SeoGenerationOptions = {},
): Promise<SeoGenerationResult | null> {
  const articleTitle = trimAndNormalize(typeof article.title === 'string' ? article.title : '')
  if (!articleTitle) {
    return null
  }

  const bodyText = deriveArticleBody(article)
  if (!bodyText && !articleTitle) {
    return null
  }

  const providerResult: ProviderSeoGenerationResult = await generateSEOFromArticleText(
    {
      title: articleTitle,
      body: bodyText,
    },
    {
      timeoutMs: toProviderOptions({
        ...options,
        timeoutMs: options.timeoutMs || SEO_GENERATION_TIMEOUT_MS,
      }),
    },
  )

  const processed = postProcessSEO({
    title: providerResult.title,
    description: providerResult.description,
    articleTitle,
    articleBody: bodyText,
  })

  return {
    seoTitle: processed.seoTitle,
    seoDescription: processed.seoDescription,
    model: providerResult.model,
    generatedAt: new Date(),
  }
}

export function buildManualSeoPatch(article: WorkSEOTargetArticle, next: { title: string; description: string }) {
  const title = trimAndNormalize(next.title)
  const description = trimAndNormalize(next.description)
  return {
    seoTitle: title || null,
    seoDescription: description || null,
    seoSource: 'manual' as const,
    seoGeneratedAt: null,
    seoModel: null,
    seoNeedsReview: false,
  }
}

export async function persistAutoGeneratedSEO(
  slug: string,
  generated: {
    title: string
    description: string
    model?: string
    generatedAt: Date
  },
  options: { allowManualOverwrite?: boolean; needsReview?: boolean } = {},
) {
  const filter: Record<string, unknown> = { slug }
  if (!options.allowManualOverwrite) {
    filter.$or = [{ seoSource: { $ne: 'manual' } }, { seoSource: null }, { seoSource: { $exists: false } }]
  }

  const update = {
    seoTitle: generated.title,
    seoDescription: generated.description,
    seoSource: 'auto',
    seoGeneratedAt: generated.generatedAt,
    seoModel: generated.model,
    seoNeedsReview: options.needsReview !== false,
  }

  const result = await WorkArticle.findOneAndUpdate(filter, { $set: update }, { new: false }).exec()
  return Boolean(result)
}

export function shouldPersistAutoGeneratedSEOForArticle(
  article: WorkSEOTargetArticle,
  options: { force?: boolean; allowManualOverwrite?: boolean } = {},
) {
  return shouldGenerateSEOForArticle(article, options)
}
