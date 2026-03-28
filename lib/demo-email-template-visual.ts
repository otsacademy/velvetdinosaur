export type DemoEmailTemplateVisualNode = {
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
  children?: DemoEmailTemplateVisualNode[];
  [key: string]: unknown;
};

const EMPTY_VISUAL_VALUE: DemoEmailTemplateVisualNode[] = [{ type: 'p', children: [{ text: '' }] }];
const BLOCK_TYPES = new Set(['p', 'h1', 'h2', 'h3', 'blockquote', 'ul', 'ol', 'li']);

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function asNodeArray(value: unknown): DemoEmailTemplateVisualNode[] {
  if (!Array.isArray(value)) return [];
  return value as DemoEmailTemplateVisualNode[];
}

function cloneEmptyVisualValue() {
  return EMPTY_VISUAL_VALUE.map((node) => ({
    ...node,
    children: Array.isArray(node.children) ? node.children.map((child) => ({ ...child })) : undefined
  }));
}

function normalizeInlineText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function createParagraph(text: string): DemoEmailTemplateVisualNode {
  return {
    type: 'p',
    children: [{ text: normalizeInlineText(text) }]
  };
}

function createList(items: string[], ordered: boolean): DemoEmailTemplateVisualNode {
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

function normalizeToInlineNodes(children: DemoEmailTemplateVisualNode[] | undefined): DemoEmailTemplateVisualNode[] {
  const source = Array.isArray(children) ? children : [];
  const output: DemoEmailTemplateVisualNode[] = [];

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

function collectInlineText(node: DemoEmailTemplateVisualNode): string {
  const textPart = typeof node.text === 'string' ? node.text : '';
  const children = Array.isArray(node.children) ? node.children : [];
  if (!children.length) return textPart;
  const childrenText = children.map((child) => collectInlineText(child)).join('');
  return `${textPart}${childrenText}`;
}

function serializeInlineHtml(node: DemoEmailTemplateVisualNode): string {
  const textValue = typeof node.text === 'string' ? node.text : '';
  if (textValue) {
    let output = escapeHtml(textValue).replace(/\n/g, '<br />');
    if (node.code) output = `<code style="font-family:ui-monospace,Menlo,Consolas,monospace;background:#f6eee2;padding:1px 4px;border-radius:4px">${output}</code>`;
    if (node.bold) output = `<strong>${output}</strong>`;
    if (node.italic) output = `<em>${output}</em>`;
    if (node.underline) output = `<u>${output}</u>`;
    if (node.strikethrough) output = `<s>${output}</s>`;
    return output;
  }

  const inlineChildren = normalizeToInlineNodes(node.children);
  if (!inlineChildren.length) return '';

  const content = inlineChildren.map((child) => serializeInlineHtml(child)).join('');
  const type = typeof node.type === 'string' ? node.type.toLowerCase() : '';
  const href = typeof node.url === 'string' ? node.url : typeof node.href === 'string' ? node.href : '';
  const looksLikeLink = type === 'a' || type === 'link' || Boolean(href);

  if (!looksLikeLink || !href.trim()) return content;

  return `<a href="${escapeHtml(href.trim())}" style="color:#22413a;text-decoration:underline;text-underline-offset:2px;word-break:break-word">${content || escapeHtml(
    href.trim()
  )}</a>`;
}

function serializeListItemText(node: DemoEmailTemplateVisualNode): string {
  const inlineNodes = normalizeToInlineNodes(node.children);
  return normalizeInlineText(inlineNodes.map((child) => collectInlineText(child)).join(' '));
}

function serializeListItemHtml(node: DemoEmailTemplateVisualNode): string {
  const inlineNodes = normalizeToInlineNodes(node.children);
  const value = inlineNodes.map((child) => serializeInlineHtml(child)).join('');
  return `<li style="margin:0 0 8px 0">${value.trim() || '&nbsp;'}</li>`;
}

function serializeBlockHtml(node: DemoEmailTemplateVisualNode): string {
  const type = typeof node.type === 'string' ? node.type.toLowerCase() : 'p';

  if (type === 'ul' || type === 'ol') {
    const items = asNodeArray(node.children).map((child) => serializeListItemHtml(child)).join('');
    if (!items) return '';
    const tag = type === 'ol' ? 'ol' : 'ul';
    return `<${tag} style="margin:0 0 16px 0;padding-left:22px;color:#1e2f2a">${items}</${tag}>`;
  }

  const inlineNodes = normalizeToInlineNodes(node.children);
  const content = inlineNodes.map((child) => serializeInlineHtml(child)).join('').trim() || '&nbsp;';

  if (type === 'h1') {
    return `<h1 style="margin:0 0 14px 0;font-size:32px;line-height:1.18;font-weight:700;color:#183029">${content}</h1>`;
  }
  if (type === 'h2') {
    return `<h2 style="margin:0 0 12px 0;font-size:23px;line-height:1.26;font-weight:700;color:#183029">${content}</h2>`;
  }
  if (type === 'h3') {
    return `<h3 style="margin:0 0 10px 0;font-size:18px;line-height:1.35;font-weight:700;color:#183029">${content}</h3>`;
  }
  if (type === 'blockquote') {
    return `<blockquote style="margin:0 0 18px 0;padding:2px 0 2px 16px;border-left:4px solid #c5a77c;color:#4d5c57;font-style:italic">${content}</blockquote>`;
  }

  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#1e2f2a">${content}</p>`;
}

export function ensureVisualValue(value: unknown): DemoEmailTemplateVisualNode[] {
  const nodes = asNodeArray(value).filter((node) => typeof node === 'object' && node !== null);
  return nodes.length ? nodes : cloneEmptyVisualValue();
}

export function visualValueFromPlainText(text: string): DemoEmailTemplateVisualNode[] {
  const normalized = text.replace(/\r\n/g, '\n').trim();
  if (!normalized) return cloneEmptyVisualValue();

  const blocks = normalized.split(/\n{2,}/).map((entry) => entry.trim()).filter(Boolean);
  const nodes: DemoEmailTemplateVisualNode[] = [];

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
          return type === 'ol' ? `${index + 1}. ${text}` : `- ${text}`;
        })
        .filter(Boolean);

      if (items.length) chunks.push(items.join('\n'));
      continue;
    }

    const text = normalizeInlineText(collectInlineText(node));
    if (!text) continue;
    if (type === 'blockquote') {
      chunks.push(`> ${text}`);
      continue;
    }
    if (type === 'h1') {
      chunks.push(`# ${text}`);
      continue;
    }
    if (type === 'h2') {
      chunks.push(`## ${text}`);
      continue;
    }
    if (type === 'h3') {
      chunks.push(`### ${text}`);
      continue;
    }
    chunks.push(text);
  }

  return chunks.join('\n\n').trim();
}

export function visualValueToBodyHtml(value: unknown): string {
  const nodes = ensureVisualValue(value);
  const html = nodes.map((node) => serializeBlockHtml(node)).join('');
  return html.trim() || `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.6;color:#1e2f2a">&nbsp;</p>`;
}

export function buildDemoBrandedEmailHtml(input: {
  previewText: string;
  heading: string;
  siteName: string;
  appUrl: string;
  bodyHtml: string;
  logoUrl?: string;
}) {
  const logoMarkup = input.logoUrl?.trim()
    ? `<img src="${escapeHtml(input.logoUrl.trim())}" alt="${escapeHtml(input.siteName)}" width="120" style="display:block;width:120px;max-width:100%;height:auto;border:0" />`
    : `<div style="font-size:12px;letter-spacing:0.32em;text-transform:uppercase;color:#6b7a74">${escapeHtml(input.siteName)}</div>`;

  return [
    '<!doctype html>',
    '<html lang="en">',
    '<head>',
    '<meta charSet="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta name="x-apple-disable-message-reformatting" />',
    `<title>${escapeHtml(input.heading)}</title>`,
    '</head>',
    '<body style="margin:0;padding:32px 12px;background:#f3ece3;font-family:Georgia,Times New Roman,serif;">',
    `<div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0;">${escapeHtml(input.previewText)}</div>`,
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">',
    '<tr><td align="center">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px;border-collapse:collapse;">',
    `<tr><td style="padding:0 14px 16px 14px;text-align:center;">${logoMarkup}</td></tr>`,
    '<tr><td style="padding:0 0 20px 0;">',
    '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;background:#fffdf9;border:1px solid #e4d7c5;border-radius:28px;overflow:hidden;">',
    '<tr><td style="padding:34px 36px 28px 36px;background:linear-gradient(180deg,#f8f1e8 0%,#fffdf9 100%);border-bottom:1px solid #ede2d3;">',
    '<p style="margin:0 0 10px 0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#7a6a57;">Studio bulletin</p>',
    `<h1 style="margin:0;font-size:34px;line-height:1.08;font-weight:700;color:#183029;">${escapeHtml(input.heading)}</h1>`,
    `<p style="margin:14px 0 0 0;font-size:16px;line-height:1.7;color:#55645f;">${escapeHtml(input.previewText)}</p>`,
    '</td></tr>',
    `<tr><td style="padding:34px 36px 18px 36px;">${input.bodyHtml}</td></tr>`,
    '<tr><td style="padding:20px 36px 34px 36px;border-top:1px solid #ede2d3;">',
    `<p style="margin:0 0 16px 0;font-size:13px;line-height:1.7;color:#66746f;">You are receiving this demonstration newsletter from ${escapeHtml(input.siteName)}.</p>`,
    `<a href="${escapeHtml(input.appUrl)}" style="display:inline-block;border-radius:999px;background:#183029;color:#fff8ef;text-decoration:none;padding:12px 20px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Open the studio</a>`,
    '<p style="margin:16px 0 0 0;font-size:12px;line-height:1.7;color:#8b7b67;">This is a sandboxed preview. No campaign is sent, scheduled, or stored permanently.</p>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</td></tr>',
    '</table>',
    '</body>',
    '</html>'
  ].join('');
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

  return buildDemoBrandedEmailHtml({
    previewText,
    heading: input.heading,
    siteName: input.siteNameToken || '{{siteName}}',
    appUrl: input.appUrlToken || '{{appUrl}}',
    logoUrl: input.logoUrlToken || '{{logoUrl}}',
    bodyHtml: visualValueToBodyHtml(input.value)
  });
}
