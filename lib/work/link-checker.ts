import { isRecord, getString } from '@/lib/types/json'
import { WorkArticle } from '@/models/WorkArticle'
import { Page } from '@/models/Page'
import { SITE_PAGE_DEFS } from '@/lib/site-pages'

export type WorkLinkWarning = {
  url: string
  type: 'internal' | 'external'
  reason: string
}

export type WorkLinkCheckResult = {
  warnings: WorkLinkWarning[]
  checkedInternal: number
  checkedExternal: number
}

type WorkLinkContext = {
  content?: unknown
  title?: string
  desc?: string
  img?: string
  socialImage?: string
}

const MAX_LINK_CHECK_CONCURRENCY = 4
const EXTERNAL_TIMEOUT_MS = 4500

const INTERNAL_PATH_PREFIXES = new Set(['', '/', '/work', '/about', '/contact', '/fellowship', '/board', '/advisory-board', '/journal', '/our-work'])

function normalizeUrlCandidate(value: unknown): string | null {
  const rawValue = getString(value)
  if (!rawValue) return null
  const raw = rawValue.trim()
  if (!raw) return null
  if (raw === '#') return null
  if (raw.toLowerCase().startsWith('javascript:')) return null
  if (raw.toLowerCase().startsWith('mailto:')) return null
  if (raw.toLowerCase().startsWith('tel:')) return null
  return raw
}

function coerceLinkCandidates(node: unknown, out: Set<string>) {
  if (!node) return
  if (Array.isArray(node)) {
    for (const child of node) {
      coerceLinkCandidates(child, out)
    }
    return
  }

  if (typeof node === 'string') {
    const raw = node.trim()
    if (!raw) return
    if (raw.includes('http://') || raw.includes('https://') || raw.startsWith('/')) {
      const stripped = raw.replace(/[)\]>"'`]+$/g, '')
      const normalized = normalizeUrlCandidate(stripped)
      if (normalized) {
        out.add(normalized)
      }
    }
    return
  }

  if (!isRecord(node)) return
  for (const value of Object.values(node)) {
    coerceLinkCandidates(value, out)
  }

  const explicit = [
    node.url,
    node.href,
    node.src,
    node.image,
    node.imageUrl,
    node.uri,
    node.path,
  ] as const

  for (const value of explicit) {
    const normalized = normalizeUrlCandidate(value)
    if (normalized) {
      out.add(normalized)
    }
  }
}

function toInputPayload(context: WorkLinkContext): Set<string> {
  const links = new Set<string>()

  coerceLinkCandidates(context.content, links)
  const fields = [context.title, context.desc, context.img, context.socialImage]
  for (const field of fields) {
    const normalized = normalizeUrlCandidate(field)
    if (normalized) links.add(normalized)
  }

  return links
}

async function checkInternalLink(rawUrl: string): Promise<WorkLinkWarning | null> {
  if (!rawUrl.startsWith('/')) return null

  try {
    const parsed = new URL(rawUrl, 'https://example.org')
    const path = parsed.pathname

    if (path === '/') {
      return null
    }

    if (path.startsWith('/work')) {
      const match = path.match(/^\/work\/([^/?#]+)/i)
      const slug = match?.[1]
      if (!slug) {
        if (path === '/work' || path === '/work/') return null
        return { url: rawUrl, type: 'internal', reason: 'Work link is not a supported format.' }
      }

      const article = await WorkArticle.exists({ slug, status: 'published' })
      if (!article) {
        return { url: rawUrl, type: 'internal', reason: 'Work article is not published yet.' }
      }

      return null
    }

    const slug = (path.replace(/^\/+/, '').split('/')[0] || '').toLowerCase()
    if (!slug) return null
    if (INTERNAL_PATH_PREFIXES.has(`/${slug}`)) return null
    if (SITE_PAGE_DEFS.some((page: { slug: string }) => page.slug === slug)) return null

    const page = await Page.findOne({ slug }).select({ _id: 1, publishedData: 1, draftData: 1 }).lean()
    if (!page) {
      return { url: rawUrl, type: 'internal', reason: 'Page could not be found in the CMS.' }
    }

    return null
  } catch {
    return { url: rawUrl, type: 'internal', reason: 'Invalid internal URL format.' }
  }
}

function parseTimeoutSignal(signal: unknown) {
  if (signal instanceof Error && signal.name === 'TimeoutError') return true
  return false
}

async function checkExternalLink(rawUrl: string): Promise<WorkLinkWarning | null> {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, EXTERNAL_TIMEOUT_MS)

  try {
    const response = await fetch(rawUrl, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        Accept: '*/*',
      },
    })

    clearTimeout(timer)
    if (response.ok) return null

    if (response.status >= 400) {
      return { url: rawUrl, type: 'external', reason: `Returned HTTP ${response.status}` }
    }

    return null
  } catch (error) {
    clearTimeout(timer)
    if (parseTimeoutSignal(error)) {
      return { url: rawUrl, type: 'external', reason: 'Timed out while checking link.' }
    }

    try {
      const retryController = new AbortController()
      const retryTimer = setTimeout(() => {
        retryController.abort()
      }, EXTERNAL_TIMEOUT_MS)

      try {
        const response = await fetch(rawUrl, {
          method: 'GET',
          signal: retryController.signal,
          redirect: 'follow',
          headers: {
            Accept: 'text/html,application/xhtml+xml',
          },
        })

        clearTimeout(retryTimer)
        if (response.ok) return null
        return { url: rawUrl, type: 'external', reason: `Returned HTTP ${response.status}` }
      } catch {
        clearTimeout(retryTimer)
        return { url: rawUrl, type: 'external', reason: 'Could not fetch URL.' }
      }
    } catch {
      return { url: rawUrl, type: 'external', reason: 'Could not fetch URL.' }
    }
  }
}

async function mapWithLimit<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>) {
  const output: R[] = []
  let index = 0

  async function next(): Promise<void> {
    while (index < items.length) {
      const current = index
      index += 1
      const result = await worker(items[current] as T)
      output[current] = result
    }
  }

  const runners = Array.from({
    length: Math.min(limit, items.length),
  }, () => next())

  await Promise.all(runners)
  return output
}

export async function checkWorkLinks(context: WorkLinkContext): Promise<WorkLinkCheckResult> {
  const candidates = Array.from(toInputPayload(context))
  if (candidates.length === 0) {
    return { warnings: [], checkedInternal: 0, checkedExternal: 0 }
  }

  const internalLinks = candidates.filter((value) => value.startsWith('/'))
  const externalLinks = candidates.filter((value) => !value.startsWith('/'))

  const internalWarnings = (await mapWithLimit(internalLinks, MAX_LINK_CHECK_CONCURRENCY, checkInternalLink))
    .filter((value): value is WorkLinkWarning => Boolean(value))

  const externalWarnings = (await mapWithLimit(externalLinks, MAX_LINK_CHECK_CONCURRENCY, checkExternalLink))
    .filter((value): value is WorkLinkWarning => Boolean(value))

  return {
    warnings: [...internalWarnings, ...externalWarnings],
    checkedInternal: internalLinks.length,
    checkedExternal: externalLinks.length,
  }
}
