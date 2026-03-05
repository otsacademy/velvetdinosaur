import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { getAuth } from '@/lib/auth';
import { hasThemeEditorToken, requireThemeEditorToken } from '@/lib/theme-editor-auth';
import { saveThemePayload } from '@/lib/theme';
import { getUserRole } from '@/lib/roles';
import { validateTheme } from '@/lib/theme-validation';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

async function authorize(request: Request) {
  if (hasThemeEditorToken(request)) {
    const auth = await requireThemeEditorToken(request);
    if (!auth.ok) {
      return { ok: false as const, response: withThemeEditorCorsHeaders(request, auth.response) };
    }
    if (auth.payload?.role !== 'admin' && auth.payload?.role !== 'user') {
      return {
        ok: false as const,
        response: withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
      };
    }
    return { ok: true as const };
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return {
      ok: false as const,
      response: withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Unauthorized' }, { status: 401 }))
    };
  }
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  const role = await getUserRole(userId);
  if (role !== 'admin' && role !== 'user') {
    return {
      ok: false as const,
      response: withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Forbidden' }, { status: 403 }))
    };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  unstable_noStore();
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const gate = await authorize(request);
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const payload = body?.payload;
  if (!payload) {
    return withThemeEditorCorsHeaders(request, NextResponse.json({ error: 'Missing payload' }, { status: 400 }));
  }

  const validation = validateTheme(payload);
  if (!validation.ok) {
    return withThemeEditorCorsHeaders(
      request,
      NextResponse.json({ error: 'Invalid theme payload', errors: validation.errors }, { status: 400 })
    );
  }

  await saveThemePayload(validation.payload, 'api save');
  revalidateTag(themeTags.current);
  revalidateTag(themeTags.draft);
  return withThemeEditorCorsHeaders(request, NextResponse.json({ ok: true, payload: validation.payload }));
}
