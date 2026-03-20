import type { ArticleSection } from '@/lib/articles'

type PlateNode = {
  type?: string
  text?: string
  children?: PlateNode[]
  [key: string]: unknown
}

type PlateDocument = {
  children?: PlateNode[]
  doc?: PlateNode[]
  content?: PlateNode[]
  value?: PlateNode[]
  data?: PlateNode[]
}

const DEFAULT_VALUE: PlateNode[] = [{ type: 'p', children: [{ text: '' }] }]

const HEADING_TYPES = new Set(['h1', 'h2', 'h3', 'heading'])
const PARAGRAPH_TYPES = new Set(['p', 'paragraph'])
const LIST_TYPES = new Set(['ul', 'ol', 'list'])
const QUOTE_TYPES = new Set(['blockquote', 'quote'])
const TABLE_TYPES = new Set(['table'])
const CALLOUT_TYPES = new Set(['callout'])
const MEDIA_NODE_TYPES = new Set(['img', 'image', 'media_embed', 'video'])
const FILE_NODE_TYPES = new Set(['file', 'attachment'])
const IMAGE_URL_KEYS = ['url', 'src', 'image', 'imageUrl', 'uri', 'href']
const INLINE_HEADING_CONNECTOR_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'by',
  'for',
  'from',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
  'vs',
  'via',
])
const INLINE_BODY_STARTERS = new Set([
  'a',
  'an',
  'as',
  'at',
  'by',
  'during',
  'for',
  'from',
  'in',
  'its',
  'our',
  'since',
  'the',
  'their',
  'this',
  'these',
  'those',
  'to',
  'when',
  'while',
  'with',
])

function asArray(value: unknown): PlateNode[] {
  return Array.isArray(value) ? (value as PlateNode[]) : []
}

function normalizeNodeType(node: PlateNode) {
  return typeof node.type === 'string' ? node.type.toLowerCase() : ''
}

function normalizeSpacing(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeTokenWord(word: string) {
  return word.replace(/^[\s"'“”‘’([{]+|[\s"'“”‘’)\].,!?;:]+$/g, '')
}

function startsWithUppercase(word: string) {
  const normalized = normalizeTokenWord(word)
  if (!normalized) return false
  return /^[A-Z0-9]/.test(normalized)
}

function isInlineHeadingWord(word: string, index: number) {
  const normalized = normalizeTokenWord(word)
  if (!normalized) return false
  const lower = normalized.toLowerCase()
  if (INLINE_HEADING_CONNECTOR_WORDS.has(lower)) return true
  if (normalized.includes(':')) return false
  if (/^[A-Z0-9][^\s]*$/.test(normalized)) return true

  // Allow lower-case first word when the paragraph starts with a quote mark.
  return index === 0 && startsWithUppercase(word)
}

function normalizeComparableText(value: string) {
  return normalizeSpacing(value).toLowerCase()
}

type InlineHeadingSplit = {
  heading: string
  body: string
}

export function splitInlineHeadingFromParagraph(paragraph: string): InlineHeadingSplit | null {
  const normalized = normalizeSpacing(paragraph)
  if (!normalized) return null

  const words = normalized.split(' ')
  if (words.length < 5) return null
  const maxHeadingWords = Math.min(9, words.length - 3)
  const minHeadingWords = 2

  for (let headingWordCount = maxHeadingWords; headingWordCount >= minHeadingWords; headingWordCount -= 1) {
    const headingWords = words.slice(0, headingWordCount)
    const bodyWords = words.slice(headingWordCount)
    if (bodyWords.length < 3) continue
    if (!headingWords.every((word, index) => isInlineHeadingWord(word, index))) continue
    const lastHeadingWord = normalizeTokenWord(headingWords[headingWords.length - 1]).toLowerCase()
    if (INLINE_BODY_STARTERS.has(lastHeadingWord)) continue

    const heading = normalizeSpacing(headingWords.join(' '))
    if (heading.length < 12 || heading.length > 90) continue
    if (/[,:;!?]/.test(heading)) continue

    const body = normalizeSpacing(bodyWords.join(' '))
    if (body.length < 28) continue

    const firstBodyWordToken = normalizeTokenWord(bodyWords[0])
    const firstBodyWord = firstBodyWordToken.toLowerCase()
    const bodyStartsWithKnownStarter = INLINE_BODY_STARTERS.has(firstBodyWord)
    const bodyStartsWithUppercaseWord =
      startsWithUppercase(bodyWords[0]) && !/^[A-Z0-9]{2,}$/.test(firstBodyWordToken)
    if (!bodyStartsWithKnownStarter && !bodyStartsWithUppercaseWord) continue
    if (!bodyStartsWithKnownStarter && headingWords.length < 4) continue

    return { heading, body }
  }

  return null
}

function dedupeSectionParagraphs(paragraphs: string[]) {
  const next: string[] = []
  for (const paragraph of paragraphs) {
    const trimmed = normalizeSpacing(paragraph)
    if (!trimmed) continue
    if (next.length > 0 && normalizeComparableText(next[next.length - 1]) === normalizeComparableText(trimmed)) {
      continue
    }
    next.push(trimmed)
  }
  return next
}

function mergeSectionListItems(current: string[] | undefined, incoming: string[] | undefined) {
  const merged = [...(current || []), ...(incoming || [])]
  if (merged.length === 0) return undefined

  const seen = new Set<string>()
  const next: string[] = []
  for (const item of merged) {
    const trimmed = normalizeSpacing(item)
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    next.push(trimmed)
  }

  return next.length > 0 ? next : undefined
}

function normalizeHeadingForMerge(value: string) {
  return normalizeSpacing(value).toLowerCase()
}

function mergeAdjacentSections(sections: ArticleSection[]) {
  const merged: ArticleSection[] = []

  for (const section of sections) {
    const normalizedSection: ArticleSection = {
      ...section,
      heading: normalizeSpacing(section.heading) || 'Section',
      paragraphs: dedupeSectionParagraphs(section.paragraphs || []),
      listItems: mergeSectionListItems(undefined, section.listItems),
    }

    const previous = merged[merged.length - 1]
    if (
      previous &&
      normalizeHeadingForMerge(previous.heading) === normalizeHeadingForMerge(normalizedSection.heading)
    ) {
      const previousLastParagraph = previous.paragraphs[previous.paragraphs.length - 1]
      const nextParagraphs = [...normalizedSection.paragraphs]
      if (
        previousLastParagraph &&
        nextParagraphs.length > 0 &&
        normalizeComparableText(previousLastParagraph) === normalizeComparableText(nextParagraphs[0])
      ) {
        nextParagraphs.shift()
      }

      previous.paragraphs = dedupeSectionParagraphs([...previous.paragraphs, ...nextParagraphs])
      previous.listItems = mergeSectionListItems(previous.listItems, normalizedSection.listItems)
      if (!previous.quote && normalizedSection.quote) previous.quote = normalizedSection.quote
      if (!previous.table && normalizedSection.table) previous.table = normalizedSection.table
      if (!previous.alert && normalizedSection.alert) previous.alert = normalizedSection.alert
      continue
    }

    if (previous && previous.paragraphs.length > 0 && normalizedSection.paragraphs.length > 0) {
      const previousLastParagraph = previous.paragraphs[previous.paragraphs.length - 1]
      if (
        normalizeComparableText(previousLastParagraph) ===
        normalizeComparableText(normalizedSection.paragraphs[0])
      ) {
        normalizedSection.paragraphs = normalizedSection.paragraphs.slice(1)
      }
    }

    if (hasRenderableContent(normalizedSection)) {
      merged.push(normalizedSection)
    }
  }

  return merged
}

export type PlateStructureAnalysis = {
  headingCount: number
  inlineHeadingCandidates: number
  paragraphCount: number
  duplicateOpeningParagraph: boolean
}

export function analyzePlateStructure(raw: unknown): PlateStructureAnalysis {
  const value = normalizePlateValue(raw)
  let headingCount = 0
  let inlineHeadingCandidates = 0
  const paragraphs: string[] = []

  const walk = (node: PlateNode) => {
    const type = normalizeNodeType(node)
    if (HEADING_TYPES.has(type)) {
      const headingText = extractNodeText(node.children)
      if (headingText) headingCount += 1
    }

    if (PARAGRAPH_TYPES.has(type)) {
      const paragraph = normalizeSpacing(extractNodeText(node.children))
      if (paragraph) {
        paragraphs.push(paragraph)
        if (splitInlineHeadingFromParagraph(paragraph)) {
          inlineHeadingCandidates += 1
        }
      }
    }

    asArray(node.children).forEach((child) => walk(child))
  }

  value.forEach((node) => walk(node))

  const firstParagraph = paragraphs[0] ? normalizeComparableText(paragraphs[0]) : ''
  const duplicateOpeningParagraph =
    Boolean(firstParagraph) &&
    paragraphs.slice(1, 4).some((paragraph) => normalizeComparableText(paragraph) === firstParagraph)

  return {
    headingCount,
    inlineHeadingCandidates,
    paragraphCount: paragraphs.length,
    duplicateOpeningParagraph,
  }
}

function isLikelyMediaUrl(value: string) {
  if (!value) return false
  const trimmed = value.trim()
  return (
    /^https?:\/\//i.test(trimmed) ||
    /^\/(images|api|media|uploads)\//i.test(trimmed) ||
    /^data:image\//i.test(trimmed) ||
    trimmed.startsWith('/api/assets/file')
  )
}

export function isRealImageUrl(value: string) {
  if (!isLikelyMediaUrl(value)) return false
  return value !== '/images/placeholder.svg' && value !== '/placeholder.svg'
}

function extractNodeText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value
      .map((child) => extractNodeText(child))
      .join('')
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (typeof value === 'object') {
    const node = value as PlateNode
    if (typeof node.text === 'string') {
      return node.text
    }

    return extractNodeText(node.children)
  }

  return ''
}

function extractListItems(node: PlateNode): string[] {
  const candidates = asArray(node.children)
  const items: string[] = []

  candidates.forEach((child) => {
    const type = normalizeNodeType(child)

    if (type === 'li' || type === 'listitem' || type === 'list-item') {
      const itemText = extractNodeText(child.children)
      if (itemText) items.push(itemText)
      return
    }

    const nestedText = extractNodeText(child)
    if (nestedText) items.push(nestedText)
  })

  return items
}

function extractTable(node: PlateNode): ArticleSection['table'] | undefined {
  const rows = asArray(node.children)
    .map((row) => asArray(row.children).map((cell) => extractNodeText(cell)).filter(Boolean))
    .filter((row) => row.length > 0)

  if (rows.length < 2) return undefined

  const headers: [string, string] = [
    rows[0]?.[0] || 'Column 1',
    rows[0]?.[1] || 'Column 2',
  ]

  const dataRows = rows
    .slice(1)
    .map((row) => [row[0] || '', row[1] || ''] as [string, string])
    .filter((row) => row[0] || row[1])

  if (!dataRows.length) return undefined

  return {
    headers,
    rows: dataRows,
  }
}

function extractMediaUrlFromNode(node: unknown): string {
  if (!node || typeof node !== 'object') return ''

  const candidate = node as PlateNode & Record<string, unknown>

  for (const key of IMAGE_URL_KEYS) {
    const value = candidate[key]
    if (typeof value === 'string' && isLikelyMediaUrl(value)) return value
  }

  const nodeText = extractNodeText(candidate)
  return isLikelyMediaUrl(nodeText) ? nodeText : ''
}

function getFirstMediaFromNodes(nodes: PlateNode[]): string {
  for (const node of nodes) {
    if (!node || typeof node !== 'object') continue

    const type = normalizeNodeType(node)
    if (MEDIA_NODE_TYPES.has(type)) {
      const value = extractMediaUrlFromNode(node)
      if (value) return value
    }

    if (node.children) {
      const nested = getFirstMediaFromNodes(asArray(node.children))
      if (nested) return nested
    }
  }
  return ''
}

export function extractHeroImageFromPlate(raw: unknown): string | null {
  const value = normalizePlateValue(raw)
  return getFirstMediaFromNodes(value) || null
}

function hasRenderableContent(section: ArticleSection) {
  return (
    section.paragraphs.length > 0 ||
    Boolean(section.quote) ||
    Boolean(section.table) ||
    Boolean(section.alert) ||
    Boolean(section.listItems?.length)
  )
}

export function normalizePlateValue(raw: unknown) {
  if (Array.isArray(raw) && raw.length > 0) {
    return raw as PlateNode[]
  }

  if (raw && typeof raw === 'object') {
    const docCandidate = raw as PlateDocument
    const envelopes = [docCandidate.children, docCandidate.doc, docCandidate.content, docCandidate.value, docCandidate.data]

    for (const envelope of envelopes) {
      if (Array.isArray(envelope) && envelope.length > 0) {
        return envelope as PlateNode[]
      }
    }
  }

  return DEFAULT_VALUE
}

function isEmptyParagraphNode(node: PlateNode) {
  return (
    normalizeNodeType(node) === 'p' &&
    Array.isArray(node.children) &&
    node.children.length === 1 &&
    (typeof node.children[0]?.text === 'string' ? node.children[0].text.trim() === '' : false)
  )
}

export function hasContent(raw: unknown) {
  const value = normalizePlateValue(raw)
  return (
    value.length > 0 &&
    !(
      value.length === 1 &&
      value[0] &&
      Object.keys(value[0]).length === 2 &&
      isEmptyParagraphNode(value[0])
    )
  )
}

export function extractPlainTextFromPlate(raw: unknown) {
  const value = normalizePlateValue(raw)
  return value
    .map((node) => extractNodeText(node))
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function estimateReadTime(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

export function formatDisplayDate(input: string | Date | null | undefined) {
  const parsed =
    input instanceof Date
      ? input
      : typeof input === 'string' && input
        ? new Date(input)
        : new Date()

  if (Number.isNaN(parsed.getTime())) {
    return new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function plateToArticleSections(raw: unknown): ArticleSection[] {
  const value = normalizePlateValue(raw)
  const sections: ArticleSection[] = []
  let active: ArticleSection | null = null

  const pushActive = () => {
    if (active && hasRenderableContent(active)) {
      sections.push(active)
    }
  }

  const ensureActive = (heading = 'Overview') => {
    if (!active) {
      active = {
        heading,
        paragraphs: [],
      }
    }
    return active
  }

  value.forEach((node) => {
    const type = normalizeNodeType(node)

    if (HEADING_TYPES.has(type)) {
      pushActive()
      active = {
        heading: extractNodeText(node.children) || 'Section',
        paragraphs: [],
      }
      return
    }

    const target = ensureActive('Overview')

    if (PARAGRAPH_TYPES.has(type)) {
      const paragraph = extractNodeText(node.children)
      if (paragraph) {
        const inlineHeading = splitInlineHeadingFromParagraph(paragraph)
        if (inlineHeading) {
          pushActive()
          active = {
            heading: inlineHeading.heading,
            paragraphs: [inlineHeading.body],
          }
          return
        }
        target.paragraphs.push(paragraph)
      }
      return
    }

    if (QUOTE_TYPES.has(type)) {
      const quote = extractNodeText(node.children)
      if (quote) {
        if (!target.quote) {
          target.quote = quote
        } else {
          target.paragraphs.push(quote)
        }
      }
      return
    }

    if (LIST_TYPES.has(type)) {
      const listItems = extractListItems(node)
      if (listItems.length > 0) {
        target.listItems = [...(target.listItems || []), ...listItems]
      }
      return
    }

    if (TABLE_TYPES.has(type)) {
      const table = extractTable(node)
      if (table) target.table = table
      return
    }

    if (CALLOUT_TYPES.has(type)) {
      const calloutText = extractNodeText(node.children)
      if (calloutText) {
        target.alert = {
          title: 'Key insight',
          description: calloutText,
        }
      }
      return
    }

    const fallbackParagraph = extractNodeText(node)
    if (fallbackParagraph) {
      target.paragraphs.push(fallbackParagraph)
    }
  })

  pushActive()

  if (sections.length === 0) {
    const fallbackText = extractPlainTextFromPlate(value)
    return [
      {
        heading: 'Overview',
        paragraphs: [fallbackText || 'Article body is empty.'],
      },
    ]
  }

  return mergeAdjacentSections(sections).map((section, index) => ({
    ...section,
    id: section.id || `section${index + 1}`,
  }))
}
