import { clamp01, DEFAULT_FOCAL_VALUE, type FocalPoint } from '@/lib/media/focal-point'

export type ImagePresentation = FocalPoint & {
  zoom?: number
}

export type ResolvedImagePresentation = {
  focalX: number
  focalY: number
  zoom: number
}

export const DEFAULT_IMAGE_ZOOM = 1
export const MIN_IMAGE_ZOOM = 1
export const MAX_IMAGE_ZOOM = 2

function parseUrl(value: string) {
  const isAbsolute = /^(https?:)?\/\//i.test(value)
  const parsed = new URL(
    value,
    typeof window === 'undefined' ? 'http://localhost' : window.location.origin,
  )

  return { isAbsolute, parsed }
}

function getHashParams(hash: string) {
  return new URLSearchParams(hash.startsWith('#') ? hash.slice(1) : hash)
}

export function clampImageZoom(input: unknown, fallback = DEFAULT_IMAGE_ZOOM) {
  if (typeof input === 'string' && input.trim() === '') return fallback
  const value = typeof input === 'number' ? input : Number(input)
  if (!Number.isFinite(value)) return fallback
  return Math.min(MAX_IMAGE_ZOOM, Math.max(MIN_IMAGE_ZOOM, Math.round(value * 100) / 100))
}

export function parseImagePresentationFromUrl(url?: string): ResolvedImagePresentation {
  if (typeof url !== 'string' || !url) {
    return {
      focalX: DEFAULT_FOCAL_VALUE,
      focalY: DEFAULT_FOCAL_VALUE,
      zoom: DEFAULT_IMAGE_ZOOM,
    }
  }

  try {
    const { parsed } = parseUrl(url)
    const hashParams = getHashParams(parsed.hash)
    const focalX = clamp01(hashParams.get('focalX') ?? parsed.searchParams.get('focalX') ?? undefined)
    const focalY = clamp01(hashParams.get('focalY') ?? parsed.searchParams.get('focalY') ?? undefined)
    const zoom = clampImageZoom(hashParams.get('zoom') ?? parsed.searchParams.get('zoom') ?? undefined)

    return {
      focalX: focalX ?? DEFAULT_FOCAL_VALUE,
      focalY: focalY ?? DEFAULT_FOCAL_VALUE,
      zoom,
    }
  } catch {
    return {
      focalX: DEFAULT_FOCAL_VALUE,
      focalY: DEFAULT_FOCAL_VALUE,
      zoom: DEFAULT_IMAGE_ZOOM,
    }
  }
}

export function stripImagePresentationUrl(url?: string) {
  if (typeof url !== 'string' || !url) return ''

  try {
    const { isAbsolute, parsed } = parseUrl(url)
    parsed.hash = ''
    if (isAbsolute) return parsed.toString()
    return `${parsed.pathname}${parsed.search}`
  } catch {
    return url
  }
}

export function buildImagePresentationUrl(url: string, presentation: ImagePresentation = {}) {
  if (!url) return ''

  try {
    const { isAbsolute, parsed } = parseUrl(url)
    const hashParams = getHashParams(parsed.hash)
    const focalX = clamp01(presentation.focalX)
    const focalY = clamp01(presentation.focalY)
    const zoom = clampImageZoom(presentation.zoom)

    if (focalX === undefined || focalX === DEFAULT_FOCAL_VALUE) hashParams.delete('focalX')
    else hashParams.set('focalX', String(focalX))

    if (focalY === undefined || focalY === DEFAULT_FOCAL_VALUE) hashParams.delete('focalY')
    else hashParams.set('focalY', String(focalY))

    if (zoom === DEFAULT_IMAGE_ZOOM) hashParams.delete('zoom')
    else hashParams.set('zoom', String(zoom))

    const nextHash = hashParams.toString()
    parsed.hash = nextHash ? `#${nextHash}` : ''

    if (isAbsolute) return parsed.toString()
    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return url
  }
}
