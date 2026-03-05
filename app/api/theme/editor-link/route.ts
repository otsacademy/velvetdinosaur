import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { getRequestOrigin, signThemeEditorJwt } from '@/lib/theme-editor-jwt';
import { getThemeEditorOrigin } from '@/lib/theme-editor-cors';
import { getUserRole } from '@/lib/roles';

const THEME_EDITOR_COOKIE = 'vd_theme_token';
const THEME_EDITOR_TTL_SECONDS = 60 * 10;

function resolveReturnUrl(siteOrigin: string, raw: string | null) {
  if (!raw) return `${siteOrigin}/admin/store`;
  try {
    // Accept absolute or relative URLs.
    return new URL(raw, `${siteOrigin}/`).toString();
  } catch {
    return `${siteOrigin}/admin/store`;
  }
}

function isHttpsRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https';
  }

  // When running behind a reverse proxy, `request.url` is often `http://...` even if the
  // public-facing origin is HTTPS. Prefer CANONICAL_ORIGIN as a stronger signal.
  if ((process.env.CANONICAL_ORIGIN || '').startsWith('https://')) return true;

  return new URL(request.url).protocol === 'https:';
}

function resolveSecureCookie(request: Request, siteOrigin: string) {
  if (siteOrigin.startsWith('https://')) return true;
  // Allow non-secure cookies for local dev.
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(siteOrigin)) return false;
  return isHttpsRequest(request);
}

function resolveSameSite(themeEditorOrigin: string, siteOrigin: string) {
  try {
    const editorHost = new URL(themeEditorOrigin).hostname;
    const siteHost = new URL(siteOrigin).hostname;
    return editorHost === siteHost ? 'lax' : 'none';
  } catch {
    return 'lax';
  }
}

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  const role = await getUserRole(userId);
  if (role !== 'admin' && role !== 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const themeEditorOrigin = getThemeEditorOrigin();
  const siteOrigin = (process.env.CANONICAL_ORIGIN || getRequestOrigin(request)).replace(/\/+$/, '');
  const returnUrl = resolveReturnUrl(siteOrigin, new URL(request.url).searchParams.get('returnUrl'));

  const user = (session as { user?: { id?: string; email?: string } }).user;
  const userIdentifier = user?.id || user?.email || 'unknown';
  const editorRole = role === 'admin' ? 'admin' : 'user';

  let token: string;
  try {
    token = await signThemeEditorJwt({
      siteOrigin,
      userId: userIdentifier,
      role: editorRole,
      expiresInSeconds: THEME_EDITOR_TTL_SECONDS
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to mint token';
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const url = new URL(`${themeEditorOrigin}/editor/theme`);
  url.searchParams.set('site', siteOrigin);
  url.searchParams.set('token', token);
  url.searchParams.set('returnUrl', returnUrl);
  url.searchParams.set('role', editorRole);

  const wantsRedirect = new URL(request.url).searchParams.get('redirect') === '1';
  const response = wantsRedirect ? NextResponse.redirect(url) : NextResponse.json({ url: url.toString() });
  response.headers.set('Cache-Control', 'no-store');
  response.cookies.set({
    name: THEME_EDITOR_COOKIE,
    value: token,
    httpOnly: true,
    secure: resolveSecureCookie(request, siteOrigin),
    sameSite: resolveSameSite(themeEditorOrigin, siteOrigin),
    path: '/api/theme',
    maxAge: THEME_EDITOR_TTL_SECONDS
  });
  return response;
}
