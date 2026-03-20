import type { MediaAssetItem } from '@/components/edit/news-editor/news-editor-command-dialogs'

export const NEWS_MEDIA_FOLDER = 'news'

function toSafeText(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value).trim()
  return ''
}

export function extractTextFromPlateNode(node: unknown): string {
  if (!node) return ''

  if (typeof node === 'string') {
    return node
  }

  if (Array.isArray(node)) {
    return node.map((child) => extractTextFromPlateNode(child)).join(' ')
  }

  if (typeof node === 'object') {
    const maybeNode = node as { text?: unknown; children?: unknown }
    const textPart = typeof maybeNode.text === 'string' ? maybeNode.text : ''
    const childrenPart = extractTextFromPlateNode(maybeNode.children)
    return `${textPart} ${childrenPart}`.trim()
  }

  return ''
}

export function inferAssetLabel(asset: MediaAssetItem) {
  return toSafeText(asset.name) || toSafeText(asset.caption) || asset.key
}

export function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, '')
}

export async function readImageDimensions(file: File): Promise<{ width?: number; height?: number }> {
  if (!file.type.startsWith('image/')) return {}

  try {
    const bitmap = await createImageBitmap(file)
    return { width: bitmap.width, height: bitmap.height }
  } catch {
    return {}
  }
}
