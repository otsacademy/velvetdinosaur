const DEFAULT_SITE_NAME = 'ASAP';
const DEFAULT_LOGO_PATH = '/images/asap-logo.png';

export function normalizeNonEmpty(value: string | undefined | null) {
  const trimmed = value?.trim();
  return trimmed || '';
}

export function normalizeBaseUrl(value: string | undefined | null) {
  const trimmed = normalizeNonEmpty(value);
  return trimmed.replace(/\/+$/, '');
}

export function inferOrigin(value: string | undefined | null) {
  const trimmed = normalizeNonEmpty(value);
  if (!trimmed) return '';
  try {
    return new URL(trimmed).origin;
  } catch {
    return '';
  }
}

export function resolveSiteName(siteName?: string | null) {
  return (
    normalizeNonEmpty(siteName) ||
    normalizeNonEmpty(process.env.NEXT_PUBLIC_SITE_NAME) ||
    normalizeNonEmpty(process.env.SITE_NAME) ||
    DEFAULT_SITE_NAME
  );
}

export function resolveDefaultAppUrl(fallbackUrl?: string | null) {
  return (
    normalizeBaseUrl(process.env.NEXT_PUBLIC_BASE_URL) ||
    normalizeBaseUrl(process.env.PUBLIC_BASE_URL) ||
    normalizeBaseUrl(inferOrigin(fallbackUrl))
  );
}

export function resolveLogoUrl(logoUrl: string | undefined | null, appUrl: string) {
  const candidate = normalizeNonEmpty(logoUrl);
  if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
    return candidate;
  }
  if (!candidate) {
    return appUrl ? `${appUrl}${DEFAULT_LOGO_PATH}` : DEFAULT_LOGO_PATH;
  }
  if (candidate.startsWith('/')) {
    return appUrl ? `${appUrl}${candidate}` : candidate;
  }
  return appUrl ? `${appUrl}/${candidate}` : candidate;
}

export function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function buildCtaButtonHtml(url: string, label: string) {
  const safeUrl = escapeHtml(url);
  const safeLabel = escapeHtml(label);
  return `<div style="margin:18px 0 16px;text-align:left"><a href="${safeUrl}" style="background-color:#111827;color:#ffffff;font-size:14px;padding:12px 16px;border-radius:10px;text-decoration:none;display:inline-block">${safeLabel}</a></div>`;
}

export function buildBrandedEmailHtml(params: {
  previewText: string;
  heading: string;
  siteName: string;
  appUrl: string;
  logoUrl: string;
  bodyHtml: string;
  headingFontSizePx?: number;
  headingLineHeightPx?: number;
}) {
  const safePreview = escapeHtml(params.previewText);
  const safeHeading = escapeHtml(params.heading);
  const safeSiteName = escapeHtml(params.siteName);
  const safeAppUrl = escapeHtml(params.appUrl);
  const safeLogoUrl = escapeHtml(params.logoUrl);
  const headingFontSize = Number.isFinite(params.headingFontSizePx) ? Math.max(16, Math.min(30, Math.round(Number(params.headingFontSizePx)))) : 22;
  const headingLineHeight = Number.isFinite(params.headingLineHeightPx)
    ? Math.max(20, Math.min(36, Math.round(Number(params.headingLineHeightPx))))
    : 28;
  const footerAppLink = safeAppUrl
    ? ` - <a href="${safeAppUrl}" style="color:#111827;text-decoration:underline;word-break:break-word">${safeAppUrl}</a>`
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;background-color:#f6f7fb;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;padding:24px 0">
    <div style="display:none;font-size:1px;color:#f6f7fb;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden">${safePreview}</div>
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f6f7fb;padding:0 12px">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden">
            <tr>
              <td style="padding:28px">
                <div style="text-align:left;margin-bottom:12px">
                  <a href="${safeAppUrl}" style="color:#111827;text-decoration:underline;word-break:break-word">
                    <img src="${safeLogoUrl}" width="90" alt="${safeSiteName} logo" style="display:block" />
                  </a>
                </div>
                <p style="font-size:${headingFontSize}px;line-height:${headingLineHeight}px;font-weight:700;margin:16px 0 8px;color:#111827;word-break:keep-all;overflow-wrap:normal">${safeHeading}</p>
                ${params.bodyHtml}
                <hr style="border-color:#e5e7eb;margin:18px 0" />
                <p style="font-size:12px;line-height:18px;color:#6b7280;margin-top:12px"><em>(c) ${new Date().getFullYear()} ${safeSiteName}${footerAppLink}</em></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
