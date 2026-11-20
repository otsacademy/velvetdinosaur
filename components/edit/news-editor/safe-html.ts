'use client'

import DOMPurify from 'dompurify'
import { HtmlPlugin } from 'platejs'

// Sanitize before Plate or any third-party deserializer sees imported markup.
// Keep document formatting; active documents and embedded browser contexts are
// imported as text/links instead of executing in the editor's origin.
export function sanitizeEditorHtml(html: string) {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['iframe', 'object', 'embed', 'script', 'style', 'link', 'meta', 'base', 'form', 'input', 'button'],
    FORBID_ATTR: ['srcdoc', 'autofocus', 'formaction'],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  })
}

export const SafeHtmlPlugin = HtmlPlugin.configure({
  parser: {
    transformData: ({ data }) => sanitizeEditorHtml(data),
  },
})
