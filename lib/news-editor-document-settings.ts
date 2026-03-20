export type NewsEditorFontFamily = 'sans' | 'serif' | 'mono'

export type NewsEditorDocumentSettings = {
  fontFamily: NewsEditorFontFamily
  fullWidth: boolean
  smallText: boolean
  lockPage: boolean
}

export const DEFAULT_NEWS_EDITOR_DOCUMENT_SETTINGS: NewsEditorDocumentSettings = {
  fontFamily: 'sans',
  fullWidth: true,
  smallText: false,
  lockPage: false,
}

const ALLOWED_FONTS = new Set<NewsEditorFontFamily>(['sans', 'serif', 'mono'])

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
}

function asBoolean(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off'].includes(normalized)) return false
  }
  return fallback
}

export function normalizeNewsEditorDocumentSettings(input: unknown): NewsEditorDocumentSettings {
  const source = asObject(input)
  const rawFont = typeof source.fontFamily === 'string' ? source.fontFamily.trim().toLowerCase() : ''
  const fontFamily = ALLOWED_FONTS.has(rawFont as NewsEditorFontFamily)
    ? (rawFont as NewsEditorFontFamily)
    : DEFAULT_NEWS_EDITOR_DOCUMENT_SETTINGS.fontFamily

  return {
    fontFamily,
    fullWidth: asBoolean(source.fullWidth, DEFAULT_NEWS_EDITOR_DOCUMENT_SETTINGS.fullWidth),
    smallText: asBoolean(source.smallText, DEFAULT_NEWS_EDITOR_DOCUMENT_SETTINGS.smallText),
    lockPage: asBoolean(source.lockPage, DEFAULT_NEWS_EDITOR_DOCUMENT_SETTINGS.lockPage),
  }
}

export function getNewsEditorFontFamilyStack(fontFamily: NewsEditorFontFamily) {
  if (fontFamily === 'serif') {
    return '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif'
  }

  if (fontFamily === 'mono') {
    return '"SFMono-Regular", Menlo, Consolas, monospace'
  }

  return 'Inter, "PT Sans", ui-sans-serif, system-ui, sans-serif'
}
