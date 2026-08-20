import { buildBrandedEmailHtml } from '@/lib/email-branding';

export type EmailTemplateVisualNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  url?: string;
  href?: string;
  listStyleType?: string;
  children?: EmailTemplateVisualNode[];
  [key: string]: unknown;
};

const EMPTY_VISUAL_VALUE: EmailTemplateVisualNode[] = [{ type: 'p', children: [{ text: '' }] }];

const BLOCK_TYPES = new Set(['p', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li']);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function asNodeArray(value: unknown): EmailTemplateVisualNode[] {
  if (!Array.isArray(value)) return [];
  return value as EmailTemplateVisualNode[];
}

function cloneEmptyVisualValue() {
  return EMPTY_VISUAL_VALUE.map((node) => ({
    ...node,
    children: Array.isArray(node.children)
      ? node.children.map((child) => ({ ...child }))
      : undefined
  }));
}

function normalizeInlineText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function createParagraph(text: string): EmailTemplateVisualNode {
  return {
    type: 'p',
    children: [{ text: normalizeInlineText(text) }]
  };
}

function createList(items: string[], ordered: boolean): EmailTemplateVisualNode {
  return {
    type: ordered ? 'ol' : 'ul',
    children: items.map((item) => ({
      type: 'li',
      children: [{ type: 'p', children: [{ text: normalizeInlineText(item) }] }]
    }))
  };
}

function stripPrefix(value: string, pattern: RegExp) {
  return value.replace(pattern, '').trim();
}

function normalizeToInlineNodes(children: EmailTemplateVisualNode[] | undefined): EmailTemplateVisualNode[] {
  const source = Array.isArray(children) ? children : [];
  const output: EmailTemplateVisualNode[] = [];

  for (const node of source) {
    const type = typeof node?.type === 'string' ? node.type.toLowerCase() : '';
    if (type && BLOCK_TYPES.has(type) && Array.isArray(node.children)) {
      output.push(...normalizeToInlineNodes(node.children));
      continue;
    }

    output.push(node);
  }

  return output;
}

function getLinkHref(node: EmailTemplateVisualNode) {
  const href = typeof node.url === 'string' ? node.url : typeof node.href === 'string' ? node.href : '';
  return href.trim();
}

function isLinkNode(node: EmailTemplateVisualNode) {
  const type = typeof node.type === 'string' ? node.type.toLowerCase() : '';
  return type === 'a' || type === 'link' || Boolean(getLinkHref(node));
}

function appendHrefToText(text: string, href: string) {
  const normalizedText = normalizeInlineText(text);
  if (!href) return text;
  if (!normalizedText) return href;
  if (normalizedText === href || normalizedText.includes(href)) return text;
  return `${text} (${href})`;
}

function collectInlineTextWithLinks(node: EmailTemplateVisualNode): string {
  const textPart = typeof node.text === 'string' ? node.text : '';
  const children = Array.isArray(node.children) ? node.children : [];
  const childrenText = children.map((child) => collectInlineTextWithLinks(child)).join('');
  const text = `${textPart}${childrenText}`;
  if (!isLinkNode(node)) return text;
  return appendHrefToText(text, getLinkHref(node));
}

function serializeInlineHtml(node: EmailTemplateVisualNode): string {
  const textValue = typeof node.text === 'string' ? node.text : '';
  const href = getLinkHref(node);
  const looksLikeLink = isLinkNode(node);

  if (textValue) {
    let output = escapeHtml(textValue).replace(/\n/g, '<br />');
    if (node.code) output = `<code style="font-family:ui-monospace,Menlo,Consolas,monospace;background:#f3f4f6;padding:1px 4px;border-radius:4px">${output}</code>`;
    if (node.bold) output = `<strong>${output}</strong>`;
    if (node.italic) output = `<em>${output}</em>`;
    if (node.underline) output = `<u>${output}</u>`;
    if (node.strikethrough) output = `<s>${output}</s>`;
    if (looksLikeLink && href) {
      return `<a href="${escapeHtml(href)}" style="color:#111827;text-decoration:underline;text-underline-offset:2px;word-break:break-word">${output}</a>`;
    }
    return output;
  }

  const inlineChildren = normalizeToInlineNodes(node.children);
  if (!inlineChildren.length) return '';

  const content = inlineChildren.map((child) => serializeInlineHtml(child)).join('');

  if (!looksLikeLink) return content;
  if (!href) return content;

  return `<a href="${escapeHtml(href)}" style="color:#111827;text-decoration:underline;text-underline-offset:2px;word-break:break-word">${content || escapeHtml(
    href
  )}</a>`;
}

function serializeListItemText(node: EmailTemplateVisualNode): string {
  const inlineNodes = normalizeToInlineNodes(node.children);
  const value = inlineNodes.map((child) => collectInlineTextWithLinks(child)).join(' ');
  return normalizeInlineText(value);
}

function serializeListItemHtml(node: EmailTemplateVisualNode): string {
  const inlineNodes = normalizeToInlineNodes(node.children);
  const value = inlineNodes.map((child) => serializeInlineHtml(child)).join('');
  const content = value.trim() || '&nbsp;';
  return `<li style="margin:0 0 8px 0">${content}</li>`;
}

function serializeBlockHtml(node: EmailTemplateVisualNode): string {
  const type = typeof node.type === 'string' ? node.type.toLowerCase() : 'p';

  if (type === 'ul' || type === 'ol') {
    const listChildren = asNodeArray(node.children);
    const items = listChildren.map((child) => serializeListItemHtml(child)).join('');
    if (!items) return '';
    const tag = type === 'ol' ? 'ol' : 'ul';
    return `<${tag} style="margin:0 0 16px 0;padding-left:22px;color:#111827">${items}</${tag}>`;
  }

  const inlineNodes = normalizeToInlineNodes(node.children);
  const content = inlineNodes.map((child) => serializeInlineHtml(child)).join('').trim() || '&nbsp;';

  if (type === 'h1') {
    return `<h1 style="margin:0 0 14px 0;font-size:28px;line-height:1.25;font-weight:700;color:#111827">${content}</h1>`;
  }

  if (type === 'h2') {
    return `<h2 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:700;color:#111827">${content}</h2>`;
  }

  if (type === 'h3') {
    return `<h3 style="margin:0 0 10px 0;font-size:18px;line-height:1.35;font-weight:700;color:#111827">${content}</h3>`;
  }

  if (type === 'blockquote') {
    return `<blockquote style="margin:0 0 16px 0;padding:2px 0 2px 14px;border-left:4px solid #d1d5db;color:#374151;font-style:italic">${content}</blockquote>`;
  }

  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#111827">${content}</p>`;
}

export function ensureVisualValue(value: unknown): EmailTemplateVisualNode[] {
  const nodes = asNodeArray(value).filter((node) => typeof node === 'object' && node !== null);
  if (!nodes.length) {
    return cloneEmptyVisualValue();
  }
  return nodes;
}

export function visualValueFromPlainText(text: string): EmailTemplateVisualNode[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return cloneEmptyVisualValue();

  const blocks = normalized.split(/\n{2,}/).map((entry) => entry.trim()).filter(Boolean);
  const nodes: EmailTemplateVisualNode[] = [];

  for (const block of blocks) {
    const lines = block.split('\n').map((line) => line.trim()).filter(Boolean);
    if (!lines.length) continue;

    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      nodes.push(createList(lines.map((line) => stripPrefix(line, /^[-*]\s+/)), false));
      continue;
    }

    if (lines.every((line) => /^\d+[\.)]\s+/.test(line))) {
      nodes.push(createList(lines.map((line) => stripPrefix(line, /^\d+[\.)]\s+/)), true));
      continue;
    }

    if (lines.length === 1 && /^###\s+/.test(lines[0])) {
      nodes.push({ type: 'h3', children: [{ text: stripPrefix(lines[0], /^###\s+/) }] });
      continue;
    }

    if (lines.length === 1 && /^##\s+/.test(lines[0])) {
      nodes.push({ type: 'h2', children: [{ text: stripPrefix(lines[0], /^##\s+/) }] });
      continue;
    }

    if (lines.length === 1 && /^#\s+/.test(lines[0])) {
      nodes.push({ type: 'h1', children: [{ text: stripPrefix(lines[0], /^#\s+/) }] });
      continue;
    }

    if (lines.every((line) => /^>\s?/.test(line))) {
      nodes.push({
        type: 'blockquote',
        children: [{ text: lines.map((line) => stripPrefix(line, /^>\s?/)).join(' ') }]
      });
      continue;
    }

    nodes.push(createParagraph(lines.join(' ')));
  }

  return nodes.length ? nodes : cloneEmptyVisualValue();
}

export function visualValueToPlainText(value: unknown): string {
  const nodes = ensureVisualValue(value);
  const chunks: string[] = [];

  for (const node of nodes) {
    const type = typeof node.type === 'string' ? node.type.toLowerCase() : 'p';

    if (type === 'ul' || type === 'ol') {
      const items = asNodeArray(node.children)
        .map((item, index) => {
          const text = serializeListItemText(item);
          if (!text) return '';
          if (type === 'ol') return `${index + 1}. ${text}`;
          return `- ${text}`;
        })
        .filter(Boolean);

      if (items.length) chunks.push(items.join('\n'));
      continue;
    }

    const text = normalizeInlineText(collectInlineTextWithLinks(node));
    if (!text) continue;
    if (type === 'blockquote') {
      chunks.push(`> ${text}`);
      continue;
    }
    chunks.push(text);
  }

  return chunks.join('\n\n').trim();
}

export function visualValueToBodyHtml(value: unknown): string {
  const nodes = ensureVisualValue(value);
  const html = nodes.map((node) => serializeBlockHtml(node)).join('');
  if (html.trim()) return html;
  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#111827">&nbsp;</p>`;
}

export function visualValueToEmailHtml(input: {
  value: unknown;
  heading: string;
  previewText?: string;
  siteNameToken?: string;
  appUrlToken?: string;
  logoUrlToken?: string;
}) {
  const plainText = visualValueToPlainText(input.value);
  const previewText = input.previewText?.trim() || plainText.split('\n').find((line) => line.trim()) || 'Email update';

  return buildBrandedEmailHtml({
    previewText,
    heading: input.heading,
    siteName: input.siteNameToken || '{{siteName}}',
    appUrl: input.appUrlToken || '{{appUrl}}',
    logoUrl: input.logoUrlToken || '{{logoUrl}}',
    bodyHtml: visualValueToBodyHtml(input.value)
  });
}
