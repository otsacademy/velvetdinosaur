import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { escapeHtml } from '@/lib/email-branding';
import type { PostmarkAttachment } from './newsletter-campaign';

type SocialLink = {
  label: string;
  href: string;
  iconPath: string;
};

export function getNewsletterSocialLinks(): SocialLink[] {
  const networks = ['facebook', 'instagram', 'x', 'bluesky', 'linkedin'] as const;
  return networks.flatMap((network) => {
    const raw = (process.env['NEWSLETTER_SOCIAL_' + network.toUpperCase() + '_URL'] || '').trim();
    if (!raw) return [];
    try {
      const url = new URL(raw);
      if (url.protocol !== 'https:') return [];
      return [{ label: network === 'x' ? 'X' : network[0].toUpperCase() + network.slice(1), href: url.href, iconPath: '/images/email-social/' + network + (network === 'instagram' || network === 'bluesky' ? '.svg' : '.png') }];
    } catch { return []; }
  });
}

export async function loadInlineSocialIconAttachments() {
  const attachments: PostmarkAttachment[] = [];
  const iconSrcByLabel: Record<string, string> = {};
  const iconRoot = path.join(process.cwd(), 'public', 'images', 'email-social');

  for (const item of getNewsletterSocialLinks()) {
    const fileName = item.iconPath.split('/').pop();
    if (!fileName) continue;
    const cid = `vd-social-${item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const iconPath = path.join(iconRoot, fileName);
    try {
      const content = await readFile(iconPath);
      attachments.push({
        Name: fileName,
        Content: content.toString('base64'),
        ContentType: fileName.toLowerCase().endsWith('.png')
          ? 'image/png'
          : fileName.toLowerCase().endsWith('.svg')
            ? 'image/svg+xml'
            : 'application/octet-stream',
        ContentID: `cid:${cid}`,
        Disposition: 'inline'
      });
      iconSrcByLabel[item.label] = `cid:${cid}`;
    } catch {
      continue;
    }
  }

  return { attachments, iconSrcByLabel };
}

function buildSocialLinksHtml(baseUrl: string, iconSrcByLabel: Record<string, string>) {
  const items = getNewsletterSocialLinks().map((item) => {
    const iconUrl = iconSrcByLabel[item.label] || (baseUrl ? `${baseUrl}${item.iconPath}` : item.iconPath);
    return `<a href="${escapeHtml(item.href)}" style="display:inline-block;margin:0 4px" aria-label="${escapeHtml(item.label)}"><img src="${escapeHtml(iconUrl)}" width="18" height="18" alt="${escapeHtml(item.label)}" style="display:block;border:0;width:18px;height:18px" /></a>`;
  }).join('');
  if (!items) return '';
  return `<div style="margin:12px 0 0 0;text-align:left"><p style="margin:0 0 8px 0;font-size:12px;line-height:18px;color:#6b7280">Follow us</p><div style="margin:0">${items}</div></div>`;
}

function buildSocialLinksText() {
  if (!getNewsletterSocialLinks().length) return '';
  return `Follow us: ${getNewsletterSocialLinks().map((item) => `${item.label}: ${item.href}`).join(' | ')}`;
}

export function withHtmlFooter(
  html: string,
  unsubscribeUrl: string,
  options: { baseUrl: string; iconSrcByLabel: Record<string, string> }
) {
  if (!unsubscribeUrl) return html;
  if (html.includes('{{unsubscribeUrl}}') || html.includes(unsubscribeUrl)) return html;
  const socialHtml = buildSocialLinksHtml(options.baseUrl, options.iconSrcByLabel);
  const footer =
    '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0" />' +
    `<p style="margin:0;font-size:12px;line-height:18px;color:#6b7280">You are receiving this email because you opted in to updates. <a href="${unsubscribeUrl}" style="color:#1f2937">Unsubscribe</a>.</p>` +
    socialHtml;
  if (html.includes('</body>')) return html.replace('</body>', `${footer}</body>`);
  if (html.includes('</html>')) return html.replace('</html>', `${footer}</html>`);
  return `${html}${footer}`;
}

export function withTextFooter(text: string, unsubscribeUrl: string) {
  if (!unsubscribeUrl) return text;
  if (text.includes('{{unsubscribeUrl}}') || text.includes(unsubscribeUrl)) return text;
  return `${text}\n\nYou can unsubscribe at any time: ${unsubscribeUrl}\n${buildSocialLinksText()}`;
}
