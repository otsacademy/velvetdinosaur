import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { hasThemeEditorToken, requireThemeEditorToken } from '@/lib/theme-editor-auth';
import { publishThemeDraftPayload } from '@/lib/theme';
import { getAuth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
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

  try {
    const { published } = await publishThemeDraftPayload('theme-editor publish');
    revalidateTag(themeTags.current);
    revalidateTag(themeTags.draft);
    const res = NextResponse.json({ ok: true, payload: published });
    return withThemeEditorCorsHeaders(request, res);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Publish failed';
    const res = NextResponse.json({ error: message }, { status: 400 });
    return withThemeEditorCorsHeaders(request, res);
  }
}
