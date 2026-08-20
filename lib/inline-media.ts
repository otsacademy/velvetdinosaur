export const INLINE_MEDIA_PLACEHOLDER = '/images/placeholder.svg'

export const DEFAULT_MAX_INLINE_IMAGE_BYTES = 10 * 1024 * 1024
export const DEFAULT_PUBLIC_INLINE_IMAGE_BYTES = 2048

const SUPPORTED_IMAGE_MIME_TO_EXT: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/avif': '.avif',
  'image/gif': '.gif',
  'image/svg+xml': '.svg',
}

export type InlineImageParseError =
  | 'not-data-url'
  | 'not-image'
  | 'unsupported-mime'
  | 'malformed'
  | 'too-large'

export type ParsedInlineImage =
  | {
      ok: true
      mimeType: string
      extension: string
      bytes: Uint8Array
      decodedBytes: number
      isBase64: boolean
    }
  | {
      ok: false
      error: InlineImageParseError
      mimeType?: string
      decodedBytes?: number
    }

export type InlineMediaScanIssue = {
  path: string
  kind: 'data-image' | 'blob'
  bytes?: number
  malformed?: boolean
}

export type InlineMediaScanResult = {
  dataImages: number
  largeDataImages: number
  malformedDataImages: number
  blobReferences: number
  issues: InlineMediaScanIssue[]
}

type RewriteResolver = (value: string, parsed: Extract<ParsedInlineImage, { ok: true }>, path: string) => Promise<string>

export type RewriteInlineMediaResult<T> = {
  value: T
  changed: boolean
  rewritten: number
  dataImages: number
  blobReferences: number
  malformedDataImages: number
  decodedBytes: number
}

export class InlineMediaError extends Error {
  constructor(
    message: string,
    public readonly code: 'blob-reference' | 'malformed-data-url' | 'unsupported-data-url' | 'data-url-too-large',
    public readonly path: string,
  ) {
    super(message)
    this.name = 'InlineMediaError'
  }
}

function normalizeMimeType(value: string) {
  return value.trim().toLowerCase()
}

function getMimeExtension(mimeType: string) {
  return SUPPORTED_IMAGE_MIME_TO_EXT[normalizeMimeType(mimeType)] || ''
}

function toUtf8Bytes(value: string) {
  return new TextEncoder().encode(value)
}

function fromBase64(value: string): Uint8Array | null {
  const normalized = value.replace(/\s+/g, '')
  if (!normalized || normalized.length % 4 === 1) return null
  if (!/^[a-z0-9+/]*={0,2}$/i.test(normalized)) return null

  try {
    if (typeof atob === 'function') {
      const binary = atob(normalized)
      const bytes = new Uint8Array(binary.length)
      for (let index = 0; index < binary.length; index += 1) {
        bytes[index] = binary.charCodeAt(index)
      }
      return bytes
    }
  } catch {
    return null
  }

  return null
}

export function isBlobMediaReference(value: unknown) {
  return typeof value === 'string' && value.trim().toLowerCase().startsWith('blob:')
}

export function isInlineImageDataUrl(value: unknown) {
  return typeof value === 'string' && /^data:image\//i.test(value.trim())
}

export function parseInlineImageDataUrl(
  value: string,
  options: { maxBytes?: number } = {},
): ParsedInlineImage {
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_INLINE_IMAGE_BYTES
  const trimmed = value.trim()
  if (!trimmed.toLowerCase().startsWith('data:')) {
    return { ok: false, error: 'not-data-url' }
  }

  const commaIndex = trimmed.indexOf(',')
  if (commaIndex < 0) {
    return { ok: false, error: 'malformed' }
  }

  const meta = trimmed.slice(5, commaIndex)
  const body = trimmed.slice(commaIndex + 1)
  const parts = meta.split(';').map((part) => part.trim()).filter(Boolean)
  const mimeType = normalizeMimeType(parts[0] || 'text/plain')
  if (!mimeType.startsWith('image/')) {
    return { ok: false, error: 'not-image', mimeType }
  }

  const extension = getMimeExtension(mimeType)
  if (!extension) {
    return { ok: false, error: 'unsupported-mime', mimeType }
  }

  const isBase64 = parts.slice(1).some((part) => part.toLowerCase() === 'base64')
  let bytes: Uint8Array | null = null

  if (isBase64) {
    bytes = fromBase64(body)
  } else {
    try {
      bytes = toUtf8Bytes(decodeURIComponent(body.replace(/\+/g, '%20')))
    } catch {
      return { ok: false, error: 'malformed', mimeType }
    }
  }

  if (!bytes) {
    return { ok: false, error: 'malformed', mimeType }
  }

  if (bytes.byteLength > maxBytes) {
    return { ok: false, error: 'too-large', mimeType, decodedBytes: bytes.byteLength }
  }

  return {
    ok: true,
    mimeType,
    extension,
    bytes,
    decodedBytes: bytes.byteLength,
    isBase64,
  }
}

function createEmptyScan(): InlineMediaScanResult {
  return {
    dataImages: 0,
    largeDataImages: 0,
    malformedDataImages: 0,
    blobReferences: 0,
    issues: [],
  }
}

function joinPath(parent: string, key: string | number) {
  return parent ? `${parent}.${key}` : String(key)
}

export function scanInlineMedia(
  input: unknown,
  options: { maxPublicBytes?: number; path?: string } = {},
): InlineMediaScanResult {
  const result = createEmptyScan()
  const maxPublicBytes = options.maxPublicBytes ?? DEFAULT_PUBLIC_INLINE_IMAGE_BYTES

  const visit = (value: unknown, path: string) => {
    if (typeof value === 'string') {
      if (isBlobMediaReference(value)) {
        result.blobReferences += 1
        result.issues.push({ path, kind: 'blob' })
        return
      }

      if (isInlineImageDataUrl(value)) {
        result.dataImages += 1
        const parsed = parseInlineImageDataUrl(value, { maxBytes: Number.POSITIVE_INFINITY })
        if (!parsed.ok) {
          result.malformedDataImages += 1
          result.issues.push({ path, kind: 'data-image', malformed: true, bytes: parsed.decodedBytes })
          return
        }
        if (parsed.decodedBytes > maxPublicBytes) {
          result.largeDataImages += 1
          result.issues.push({ path, kind: 'data-image', bytes: parsed.decodedBytes })
        }
      }
      return
    }

    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, joinPath(path, index)))
      return
    }

    if (!value || typeof value !== 'object') return

    for (const [key, entry] of Object.entries(value)) {
      visit(entry, joinPath(path, key))
    }
  }

  visit(input, options.path || '')
  return result
}

export function sanitizePublicInlineMedia<T>(
  input: T,
  options: { label: string; maxPublicBytes?: number; logger?: Pick<Console, 'warn'> } ,
): { value: T; changed: boolean; replacements: number } {
  const maxPublicBytes = options.maxPublicBytes ?? DEFAULT_PUBLIC_INLINE_IMAGE_BYTES
  const logger = options.logger ?? console
  let changed = false
  let replacements = 0

  const visit = (value: unknown, path: string): unknown => {
    if (typeof value === 'string') {
      const shouldReplaceBlob = isBlobMediaReference(value)
      const parsed = isInlineImageDataUrl(value)
        ? parseInlineImageDataUrl(value, { maxBytes: Number.POSITIVE_INFINITY })
        : null
      const shouldReplaceData =
        parsed && (!parsed.ok || parsed.decodedBytes > maxPublicBytes)

      if (shouldReplaceBlob || shouldReplaceData) {
        changed = true
        replacements += 1
        logger.warn(
          `[inline-media] Replaced public inline media in ${options.label}${path ? ` at ${path}` : ''}`,
        )
        return INLINE_MEDIA_PLACEHOLDER
      }

      return value
    }

    if (Array.isArray(value)) {
      let arrayChanged = false
      const next = value.map((entry, index) => {
        const replaced = visit(entry, joinPath(path, index))
        arrayChanged = arrayChanged || replaced !== entry
        return replaced
      })
      return arrayChanged ? next : value
    }

    if (!value || typeof value !== 'object') return value

    let objectChanged = false
    const next: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      const replaced = visit(entry, joinPath(path, key))
      next[key] = replaced
      objectChanged = objectChanged || replaced !== entry
    }
    return objectChanged ? next : value
  }

  return { value: visit(input, '') as T, changed, replacements }
}

export async function rewriteInlineMediaReferences<T>(
  input: T,
  resolver: RewriteResolver,
  options: { maxBytes?: number; path?: string; cache?: Map<string, string> } = {},
): Promise<RewriteInlineMediaResult<T>> {
  const cache = options.cache ?? new Map<string, string>()
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_INLINE_IMAGE_BYTES
  let changed = false
  let rewritten = 0
  let dataImages = 0
  let blobReferences = 0
  let malformedDataImages = 0
  let decodedBytes = 0

  const visit = async (value: unknown, path: string): Promise<unknown> => {
    if (typeof value === 'string') {
      if (isBlobMediaReference(value)) {
        blobReferences += 1
        throw new InlineMediaError(
          'Blob preview URLs cannot be saved. Upload the file to the media library first.',
          'blob-reference',
          path,
        )
      }

      if (!isInlineImageDataUrl(value)) {
        return value
      }

      dataImages += 1
      const parsed = parseInlineImageDataUrl(value, { maxBytes })
      if (!parsed.ok) {
        malformedDataImages += 1
        const code = parsed.error === 'too-large' ? 'data-url-too-large' : parsed.error === 'unsupported-mime' ? 'unsupported-data-url' : 'malformed-data-url'
        throw new InlineMediaError(
          parsed.error === 'too-large'
            ? 'Inline image data is too large to save.'
            : 'Inline image data URL is malformed or unsupported.',
          code,
          path,
        )
      }

      decodedBytes += parsed.decodedBytes
      const cached = cache.get(value)
      if (cached) {
        changed = true
        rewritten += 1
        return cached
      }

      const resolved = await resolver(value, parsed, path)
      cache.set(value, resolved)
      changed = changed || resolved !== value
      if (resolved !== value) rewritten += 1
      return resolved
    }

    if (Array.isArray(value)) {
      let arrayChanged = false
      const next: unknown[] = []
      for (let index = 0; index < value.length; index += 1) {
        const replaced = await visit(value[index], joinPath(path, index))
        next.push(replaced)
        arrayChanged = arrayChanged || replaced !== value[index]
      }
      return arrayChanged ? next : value
    }

    if (!value || typeof value !== 'object') return value

    let objectChanged = false
    const next: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value)) {
      const replaced = await visit(entry, joinPath(path, key))
      next[key] = replaced
      objectChanged = objectChanged || replaced !== entry
    }
    return objectChanged ? next : value
  }

  const value = (await visit(input, options.path || '')) as T
  return {
    value,
    changed,
    rewritten,
    dataImages,
    blobReferences,
    malformedDataImages,
    decodedBytes,
  }
}
