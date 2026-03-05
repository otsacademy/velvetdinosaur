import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { hasThemeEditorToken, requireThemeEditorToken } from '@/lib/theme-editor-auth';
import { getAuth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { getThemeDraftPayload, saveThemeDraftPayload } from '@/lib/theme';
import { validateTheme } from '@/lib/theme-validation';
import { themeTags } from '@/lib/cache-tags';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function GET(request: Request) {
  unstable_noStore();
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  if (hasThemeEditorToken(request)) {
    const auth = await requireThemeEditorToken(request);
    if (!auth.ok) return withThemeEditorCorsHeaders(request, auth.response);
    if (auth.payload?.role !== 'admin' && auth.payload?.role !== 'user') {
      return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }
  } else {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
    const role = await getUserRole(userId);
    if (role !== 'admin' && role !== 'user') {
      return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }
  }

  const payload = await getThemeDraftPayload();
  const res = NextResponse.json({ payload });
  return withThemeEditorCorsHeaders(request, res);
}

export async function POST(request: Request) {
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const debug = process.env.DEBUG_THEME === '1' || process.env.NODE_ENV !== 'production';

  if (hasThemeEditorToken(request)) {
    const auth = await requireThemeEditorToken(request);
    if (!auth.ok) return withThemeEditorCorsHeaders(request, auth.response);
    if (auth.payload?.role !== 'admin' && auth.payload?.role !== 'user') {
      return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }
  } else {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }));
    const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
    const role = await getUserRole(userId);
    if (role !== 'admin' && role !== 'user') {
      return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }));
    }
  }

  const body = await request.json().catch(() => null);
  const payload = body?.payload;
  if (!payload) {
    return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Missing payload' }, { status: 400 }));
  }

  // Debug logging to help surface schema mismatches during integration
  if (debug) {
    try {
      const keys = Array.isArray(Object.keys(payload)) ? Object.keys(payload) : [];
      const hasLight = Boolean(payload?.styles?.light);
      const hasDark = Boolean(payload?.styles?.dark);
      const allowedKeys = new Set(Object.keys(DEFAULT_THEME_PAYLOAD.styles.light));
      const missingLight = hasLight
        ? Array.from(allowedKeys).filter((k) => !(k in (payload.styles.light as Record<string, unknown>)))
        : Array.from(allowedKeys);
      const missingDark = hasDark
        ? Array.from(allowedKeys).filter((k) => !(k in (payload.styles.dark as Record<string, unknown>)))
        : Array.from(allowedKeys);
      console.info('[theme-draft] incoming keys', {
        keys,
        hasLight,
        hasDark,
        missingLight: missingLight.slice(0, 5),
        missingDark: missingDark.slice(0, 5)
      });
    } catch {
      // best-effort logging only
    }
  }

  const validation = validateTheme(payload);
  if (!validation.ok) {
    const allowedKeys = new Set(Object.keys(DEFAULT_THEME_PAYLOAD.styles.light));
    const missingKeys = {
      light: Array.from(allowedKeys).filter((k) => !(payload?.styles?.light && k in payload.styles.light)),
      dark: Array.from(allowedKeys).filter((k) => !(payload?.styles?.dark && k in payload.styles.dark))
    };
    return withThemeEditorCorsHeaders(
      request,
      NextResponse.json(
        {
          error: 'Invalid theme payload',
          errors: validation.errors,
          missingKeys
        },
        { status: 400 }
      )
    );
  }

  await saveThemeDraftPayload(validation.payload, 'theme-editor draft save');
  revalidateTag(themeTags.draft);
  const res = NextResponse.json({ ok: true, payload: validation.payload });
  return withThemeEditorCorsHeaders(request, res);
}
