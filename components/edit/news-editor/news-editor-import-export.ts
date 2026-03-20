'use client'

import { deserializeMd, serializeMd } from '@platejs/markdown'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { deserializeHtml } from 'platejs'

import { EMPTY_CONTENT } from '@/components/edit/news-editor/news-editor-plate-utils'

type EditorLike = {
  children?: unknown[]
}

type ImportFormat = 'md' | 'html' | 'docx'
type ExportFormat = 'md' | 'html' | 'pdf' | 'docx'

function ensureNonEmptyNodes(nodes: unknown) {
  return Array.isArray(nodes) && nodes.length > 0 ? nodes : [...EMPTY_CONTENT]
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function slugifyFileName(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  return normalized || 'untitled-article'
}

function detectImportFormat(fileName: string): ImportFormat | null {
  const name = fileName.trim().toLowerCase()
  if (name.endsWith('.md') || name.endsWith('.markdown')) return 'md'
  if (name.endsWith('.html') || name.endsWith('.htm')) return 'html'
  if (name.endsWith('.docx')) return 'docx'
  return null
}

function markdownToHtmlDocument(markdown: string, title: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const htmlLines: string[] = []

  let inUl = false
  let inOl = false

  const closeLists = () => {
    if (inUl) {
      htmlLines.push('</ul>')
      inUl = false
    }
    if (inOl) {
      htmlLines.push('</ol>')
      inOl = false
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const trimmed = line.trim()

    if (!trimmed) {
      closeLists()
      continue
    }

    if (trimmed.startsWith('### ')) {
      closeLists()
      htmlLines.push(`<h3>${escapeHtml(trimmed.slice(4))}</h3>`)
      continue
    }

    if (trimmed.startsWith('## ')) {
      closeLists()
      htmlLines.push(`<h2>${escapeHtml(trimmed.slice(3))}</h2>`)
      continue
    }

    if (trimmed.startsWith('# ')) {
      closeLists()
      htmlLines.push(`<h1>${escapeHtml(trimmed.slice(2))}</h1>`)
      continue
    }

    if (/^[-*]\s+/.test(trimmed)) {
      if (!inUl) {
        closeLists()
        htmlLines.push('<ul>')
        inUl = true
      }
      htmlLines.push(`<li>${escapeHtml(trimmed.replace(/^[-*]\s+/, ''))}</li>`)
      continue
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOl) {
        closeLists()
        htmlLines.push('<ol>')
        inOl = true
      }
      htmlLines.push(`<li>${escapeHtml(trimmed.replace(/^\d+\.\s+/, ''))}</li>`)
      continue
    }

    closeLists()
    htmlLines.push(`<p>${escapeHtml(trimmed)}</p>`)
  }

  closeLists()

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body>
${htmlLines.join('\n')}
</body>
</html>`
}

function buildWrappedLines(text: string, maxWidth: number, measureWidth: (value: string) => number) {
  const sourceLines = text.replace(/\r\n/g, '\n').split('\n')
  const wrapped: string[] = []

  for (const source of sourceLines) {
    const words = source.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      wrapped.push('')
      continue
    }

    let line = ''
    for (const word of words) {
      const next = line ? `${line} ${word}` : word
      if (measureWidth(next) <= maxWidth) {
        line = next
        continue
      }

      if (line) {
        wrapped.push(line)
        line = word
      } else {
        wrapped.push(word)
      }
    }

    if (line) wrapped.push(line)
  }

  return wrapped
}

export function getCurrentEditorNodes(editor: EditorLike, content: unknown) {
  if (Array.isArray(content) && content.length > 0) {
    return content
  }
  if (Array.isArray(editor.children) && editor.children.length > 0) {
    return editor.children
  }
  return [...EMPTY_CONTENT]
}

export async function importEditorDocumentFromFile(editor: EditorLike, file: File) {
  const format = detectImportFormat(file.name)
  if (!format) {
    throw new Error('Unsupported file format. Use .docx, .md, or .html.')
  }

  if (format === 'md') {
    const text = await file.text()
    return ensureNonEmptyNodes(deserializeMd(editor as never, text))
  }

  if (format === 'html') {
    const html = await file.text()
    return ensureNonEmptyNodes(deserializeHtml(editor as never, { element: html }))
  }

  const mammothModule = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammothModule.convertToHtml({ arrayBuffer })
  const html = result.value || ''
  return ensureNonEmptyNodes(deserializeHtml(editor as never, { element: html }))
}

export async function exportEditorDocument(
  editor: EditorLike,
  nodes: unknown[],
  format: ExportFormat,
  title: string,
) {
  const safeTitle = title.trim() || 'Untitled article'
  const markdown = serializeMd(editor as never, { value: nodes as never }) || ''
  const fileBase = slugifyFileName(safeTitle)

  if (format === 'md') {
    return {
      fileName: `${fileBase}.md`,
      blob: new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
    }
  }

  if (format === 'html') {
    const html = markdownToHtmlDocument(markdown, safeTitle)
    return {
      fileName: `${fileBase}.html`,
      blob: new Blob([html], { type: 'text/html;charset=utf-8' }),
    }
  }

  if (format === 'pdf') {
    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792])
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontSize = 11
    const margin = 48
    const lineHeight = 15
    const maxLineWidth = page.getWidth() - margin * 2
    const lines = buildWrappedLines(markdown || safeTitle, maxLineWidth, (value) => font.widthOfTextAtSize(value, fontSize))

    let y = page.getHeight() - margin
    page.drawText(safeTitle, {
      x: margin,
      y,
      size: 16,
      font,
      color: rgb(0.11, 0.14, 0.2),
    })
    y -= 26

    for (const line of lines) {
      if (y < margin) {
        page = pdfDoc.addPage([612, 792])
        y = page.getHeight() - margin
      }
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.13, 0.16, 0.24),
      })
      y -= lineHeight
    }

    const pdfBytes = await pdfDoc.save()
    const pdfBuffer = new Uint8Array(pdfBytes).buffer
    return {
      fileName: `${fileBase}.pdf`,
      blob: new Blob([pdfBuffer], { type: 'application/pdf' }),
    }
  }

  const docxModule = await import('docx')
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = docxModule
  const paragraphs: InstanceType<typeof Paragraph>[] = []
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')

  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: safeTitle, bold: true })],
    }),
  )

  for (const rawLine of lines) {
    const trimmed = rawLine.trim()
    if (!trimmed) {
      paragraphs.push(new Paragraph(''))
      continue
    }

    if (trimmed.startsWith('### ')) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_3, text: trimmed.slice(4) }))
      continue
    }
    if (trimmed.startsWith('## ')) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_2, text: trimmed.slice(3) }))
      continue
    }
    if (trimmed.startsWith('# ')) {
      paragraphs.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: trimmed.slice(2) }))
      continue
    }
    if (/^[-*]\s+/.test(trimmed)) {
      paragraphs.push(new Paragraph({ bullet: { level: 0 }, text: trimmed.replace(/^[-*]\s+/, '') }))
      continue
    }

    paragraphs.push(new Paragraph({ text: trimmed }))
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  })
  const blob = await Packer.toBlob(doc)
  return {
    fileName: `${fileBase}.docx`,
    blob,
  }
}
