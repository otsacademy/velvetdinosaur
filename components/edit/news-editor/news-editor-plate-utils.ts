import type { Article } from '@/lib/articles'
import {
  hasContent,
  isRealImageUrl,
  normalizePlateValue,
  splitInlineHeadingFromParagraph,
} from '@/lib/news-plate-transform'

export const DEFAULT_TAGS = ['Awards', 'Research', 'Events', 'Chapters', 'Announcements']
export const DEFAULT_IMAGE = ''
export const DEFAULT_AUTHOR_IMAGE = '/images/asap-logo-trimmed.webp'
export const EMPTY_CONTENT = [{ type: 'p', children: [{ text: '' }] }]
const LEGACY_HOLDING_IMAGE = '/images/hero-academics.jpg'

type PlateTextNode = { text: string }
type PlateElementNode = { type: string; children: Array<PlateElementNode | PlateTextNode> }
type PlateLegacyNode = {
  type?: string
  children?: Array<PlateElementNode | PlateTextNode>
  text?: string
  [key: string]: unknown
}

const LEGACY_IMAGE_URL_KEYS = ['url', 'src', 'image', 'imageUrl', 'uri', 'href']
const LEGACY_MEDIA_TYPES = new Set(['img', 'image', 'media_embed', 'video', 'file', 'attachment'])
const HEADING_NODE_TYPES = new Set(['h1', 'h2', 'h3', 'heading'])

function hasLegacyMediaNode(nodes: Array<PlateElementNode | PlateTextNode>): boolean {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue
    const candidate = node as PlateLegacyNode
    const type = typeof candidate.type === 'string' ? candidate.type.toLowerCase() : ''
    if (LEGACY_MEDIA_TYPES.has(type)) return true

    const children = asPlateChildren(candidate.children)
    if (hasLegacyMediaNode(children)) return true
  }
  return false
}

function asText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const value = 'text' in node && typeof (node as { text?: unknown }).text === 'string' ? (node as { text: string }).text : ''
  return value.trim()
}

function asPlateChildren(children: unknown): Array<PlateElementNode | PlateTextNode> {
  if (!Array.isArray(children)) return []
  return children.filter((child): child is PlateElementNode | PlateTextNode => Boolean(child))
}

function asLikelyImageUrl(value: unknown) {
  if (typeof value !== 'string') return ''
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (/^\/(images|api|media|uploads)\//i.test(trimmed)) return trimmed
  if (/^data:image\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/api/assets/file')) return trimmed
  return ''
}

function normalizeImageNode(node: PlateLegacyNode): PlateElementNode {
  const normalizedNode: PlateLegacyNode = {
    ...node,
    type: typeof node.type === 'string' ? node.type.toLowerCase() : 'p',
  }

  const type = normalizedNode.type
  if (type === 'img' || type === 'image') {
    let url = asLikelyImageUrl((normalizedNode as { [key: string]: unknown }).url)
    if (!url) {
      for (const key of LEGACY_IMAGE_URL_KEYS) {
        url = asLikelyImageUrl((normalizedNode as { [key: string]: unknown })[key])
        if (url) break
      }
    }
    if (!url) {
      for (const child of asPlateChildren(normalizedNode.children)) {
        const textUrl = asLikelyImageUrl(asText(child))
        if (textUrl) {
          url = textUrl
          break
        }
      }
    }

    normalizedNode.type = 'img'
    if (url) {
      normalizedNode.url = url
    }
    normalizedNode.children = asPlateChildren(normalizedNode.children)
    if (normalizedNode.children.length === 0) {
      normalizedNode.children = [{ text: '' }]
    }
  } else if (Array.isArray(normalizedNode.children)) {
    normalizedNode.children = normalizedNode.children
  } else {
    normalizedNode.children = []
  }

  return normalizedNode as PlateElementNode
}

function normalizeLegacyPlateContent(raw: unknown): PlateElementNode[] {
  if (!Array.isArray(raw) || raw.length === 0) return EMPTY_CONTENT

  const normalized = raw
    .map((node) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return null
      return normalizeImageNode(node as PlateLegacyNode)
    })
    .filter((node): node is PlateElementNode => Boolean(node && node.type))

  return normalized.length > 0 ? normalized : EMPTY_CONTENT
}

function extractParagraphTextFromChildren(children: unknown): string {
  const nodes = asPlateChildren(children)
  return nodes
    .map((child) => asText(child))
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function promoteInlineHeadingParagraphs(nodes: PlateElementNode[]) {
  if (!Array.isArray(nodes) || nodes.length === 0) return nodes

  const hasExplicitHeading = nodes.some((node) => {
    const type = typeof node?.type === 'string' ? node.type.toLowerCase() : ''
    return HEADING_NODE_TYPES.has(type)
  })
  if (hasExplicitHeading) return nodes

  let promotedCount = 0
  const promoted: PlateElementNode[] = []

  for (const node of nodes) {
    const type = typeof node?.type === 'string' ? node.type.toLowerCase() : ''
    if (type !== 'p' && type !== 'paragraph') {
      promoted.push(node)
      continue
    }

    const paragraph = extractParagraphTextFromChildren(node.children)
    const inlineSplit = splitInlineHeadingFromParagraph(paragraph)
    if (!inlineSplit) {
      promoted.push(node)
      continue
    }

    promotedCount += 1
    promoted.push({
      type: 'h2',
      children: [{ text: inlineSplit.heading }],
    } as PlateElementNode)
    promoted.push({
      type: 'p',
      children: [{ text: inlineSplit.body }],
    } as PlateElementNode)
  }

  return promotedCount > 0 ? promoted : nodes
}

export function normalizeInitialNewsHeroImage(value?: string | null) {
  const normalized = value?.trim() || ''
  if (
    !normalized ||
    normalized === '/placeholder.svg' ||
    normalized === '/images/placeholder.svg' ||
    normalized === LEGACY_HOLDING_IMAGE
  ) {
    return ''
  }
  return normalized
}

function buildHeroImageNode(article: Article, heroImage: string): PlateElementNode {
  const alt = article.title || 'Article image'
  const imageNode: PlateLegacyNode = {
    type: 'img',
    url: heroImage,
    alt,
    children: [{ text: '' }],
  }

  if (article.imageCaption) {
    imageNode.caption = article.imageCaption
  }

  return normalizeImageNode(imageNode)
}

export function articleToInitialContent(article: Article | null | undefined): PlateElementNode[] {
  const normalizedHeroImage = normalizeInitialNewsHeroImage(article?.img)
  const normalizedContent = article ? normalizePlateValue(article.content) : null
  if (normalizedContent && hasContent(normalizedContent)) {
    const nodes = promoteInlineHeadingParagraphs(normalizeLegacyPlateContent(normalizedContent))
    if (article && isRealImageUrl(normalizedHeroImage) && !hasLegacyMediaNode(nodes)) {
      return [buildHeroImageNode(article, normalizedHeroImage), ...nodes]
    }
    return nodes
  }

  if (!article || !Array.isArray(article.sections) || article.sections.length === 0) {
    if (article && isRealImageUrl(normalizedHeroImage)) {
      return [buildHeroImageNode(article, normalizedHeroImage)]
    }
    return EMPTY_CONTENT
  }

  const nodes: PlateElementNode[] = []
  if (
    article &&
    isRealImageUrl(normalizedHeroImage) &&
    !hasLegacyMediaNode(article.sections as unknown as Array<PlateElementNode | PlateTextNode>)
  ) {
    nodes.push(buildHeroImageNode(article, normalizedHeroImage))
  }

  article.sections.forEach((section) => {
    if (section.heading?.trim()) {
      nodes.push({
        type: 'h2',
        children: [{ text: section.heading.trim() }],
      })
    }

    section.paragraphs.forEach((paragraph) => {
      const text = paragraph.trim()
      if (!text) return
      nodes.push({
        type: 'p',
        children: [{ text }],
      })
    })

    if (section.quote?.trim()) {
      nodes.push({
        type: 'blockquote',
        children: [
          {
            type: 'p',
            children: [{ text: section.quote.trim() }],
          },
        ],
      })
    }

    if (section.listItems?.length) {
      nodes.push({
        type: 'ul',
        children: section.listItems.map((item) => ({
          type: 'li',
          children: [{ text: item }],
        })),
      })
    }

    if (section.table) {
      nodes.push({
        type: 'table',
        children: [
          {
            type: 'tr',
            children: (section.table.headers || ['Column 1', 'Column 2']).map((headerCell) => ({
              type: 'th',
              children: [{ text: headerCell }],
            })),
          },
          ...(section.table.rows || []).map((row) => ({
            type: 'tr',
            children: row.map((cell) => ({
              type: 'td',
              children: [{ text: cell }],
            })),
          })),
        ],
      })
    }
  })

  return nodes.length > 0 ? nodes : EMPTY_CONTENT
}

export function dateStringToInput(date: string | undefined) {
  if (!date) return new Date().toISOString().slice(0, 10)
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) {
    return new Date().toISOString().slice(0, 10)
  }
  return parsed.toISOString().slice(0, 10)
}
