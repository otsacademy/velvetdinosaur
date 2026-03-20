import { createArticleExcerpt } from '@/lib/news-presentation'
import { analyzePlateStructure, extractPlainTextFromPlate, normalizePlateValue, splitInlineHeadingFromParagraph } from '@/lib/news-plate-transform'

type PlateNode = {
  type?: string
  text?: string
  children?: PlateNode[]
  [key: string]: unknown
}

type ParagraphFixMetrics = {
  inlineHeadingPromotions: number
  duplicateOpeningParagraphsRemoved: number
}

export type EditorialFixResult = {
  content: PlateNode[]
  changed: boolean
  metrics: ParagraphFixMetrics
}

function normalizeSpacing(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function normalizeNodeType(node: PlateNode) {
  return typeof node.type === 'string' ? node.type.toLowerCase() : ''
}

function extractNodeText(value: unknown): string {
  if (!value) return ''
  if (typeof value === 'string') return value

  if (Array.isArray(value)) {
    return value
      .map((child) => extractNodeText(child))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
  }

  if (typeof value === 'object') {
    const node = value as PlateNode
    if (typeof node.text === 'string') return node.text
    return extractNodeText(node.children)
  }

  return ''
}

function cloneNodes(nodes: PlateNode[]) {
  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(nodes) as PlateNode[]
    }
  } catch {
    // Fall through to JSON clone.
  }

  return JSON.parse(JSON.stringify(nodes)) as PlateNode[]
}

function createHeadingNode(text: string): PlateNode {
  return {
    type: 'h2',
    children: [{ text }],
  }
}

function createParagraphNode(text: string): PlateNode {
  return {
    type: 'p',
    children: [{ text }],
  }
}

function isSimpleParagraphNode(node: PlateNode) {
  const type = normalizeNodeType(node)
  if (type !== 'p' && type !== 'paragraph') return false
  if (!Array.isArray(node.children) || node.children.length !== 1) return false

  const child = node.children[0]
  if (!child || typeof child !== 'object') return false
  return typeof child.text === 'string'
}

function promoteInlineHeadingParagraphs(nodes: PlateNode[]) {
  let promotions = 0
  const next: PlateNode[] = []

  for (const node of nodes) {
    if (!isSimpleParagraphNode(node)) {
      next.push(node)
      continue
    }

    const paragraphText = normalizeSpacing(extractNodeText(node.children))
    if (!paragraphText) {
      next.push(node)
      continue
    }

    const split = splitInlineHeadingFromParagraph(paragraphText)
    if (!split) {
      next.push(node)
      continue
    }

    promotions += 1
    next.push(createHeadingNode(split.heading))
    next.push(createParagraphNode(split.body))
  }

  return { nodes: next, promotions }
}

function removeDuplicateOpeningParagraph(nodes: PlateNode[]) {
  let paragraphIndex = 0
  let removed = 0
  let firstParagraphKey = ''
  const next: PlateNode[] = []

  for (const node of nodes) {
    const type = normalizeNodeType(node)
    if (type !== 'p' && type !== 'paragraph') {
      next.push(node)
      continue
    }

    const text = normalizeSpacing(extractNodeText(node.children))
    if (!text) {
      next.push(node)
      continue
    }

    paragraphIndex += 1
    const key = text.toLowerCase()
    if (!firstParagraphKey) {
      firstParagraphKey = key
      next.push(node)
      continue
    }

    if (key === firstParagraphKey && paragraphIndex <= 6) {
      removed += 1
      continue
    }

    next.push(node)
  }

  return { nodes: next, removed }
}

export function applyEditorialFixesToPlateContent(raw: unknown): EditorialFixResult {
  const base = cloneNodes(normalizePlateValue(raw) as PlateNode[])
  const structure = analyzePlateStructure(base)

  const promoted = structure.inlineHeadingCandidates > 0 ? promoteInlineHeadingParagraphs(base) : { nodes: base, promotions: 0 }
  const deduped = removeDuplicateOpeningParagraph(promoted.nodes)

  const changed = promoted.promotions > 0 || deduped.removed > 0

  return {
    content: deduped.nodes,
    changed,
    metrics: {
      inlineHeadingPromotions: promoted.promotions,
      duplicateOpeningParagraphsRemoved: deduped.removed,
    },
  }
}

export function suggestSummaryFromPlateContent(raw: unknown, maxChars = 200) {
  const text = extractPlainTextFromPlate(raw)
  if (!text) return ''
  return createArticleExcerpt(text, { maxChars, preferSentence: true })
}

export function summaryLooksIncomplete(summary: string) {
  const trimmed = summary.trim()
  if (!trimmed) return false
  return !/(?:[.!?]|…|\.{3})["')\]]?$/.test(trimmed)
}

export function suggestImageCaption(title: string) {
  const trimmed = title.trim()
  if (!trimmed) return 'Featured image for this article.'
  return `Featured image for ${trimmed}.`
}
