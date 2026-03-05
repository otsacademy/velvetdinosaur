import { normalizeOrigin } from '@/lib/theme-editor-jwt';

export const THEME_EDITOR_TOKEN_COOKIE = 'vd_theme_token';
export const THEME_EDITOR_TOKEN_TTL_SECONDS = 60 * 10;

export function buildThemeEditorUrl(input: {
  themeEditorOrigin: string;
  siteOrigin: string;
  returnUrl: string;
  role: string;
  token?: string;
}) {
  const themeEditorOrigin = normalizeOrigin(input.themeEditorOrigin);
  const siteOrigin = normalizeOrigin(input.siteOrigin);

  const url = new URL(`${themeEditorOrigin}/editor/theme`);
  url.searchParams.set('site', siteOrigin);
  url.searchParams.set('returnUrl', input.returnUrl);
  url.searchParams.set('role', input.role);
  if (input.token) {
    url.searchParams.set('token', input.token);
  }
  return url;
}

export function getThemeEditorCookieOptions(siteOrigin: string, themeEditorOrigin: string) {
  const normalizedSite = normalizeOrigin(siteOrigin);
  const normalizedEditor = normalizeOrigin(themeEditorOrigin);
  const isCrossOrigin = normalizedSite !== normalizedEditor;
  const isSecure = normalizedSite.startsWith('https://');

  return {
    httpOnly: true,
    maxAge: THEME_EDITOR_TOKEN_TTL_SECONDS,
    sameSite: isCrossOrigin ? 'none' : 'lax',
    secure: isSecure,
    path: '/'
  } as const;
}
