import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { hasThemeEditorToken, requireThemeEditorToken } from '@/lib/theme-editor-auth';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { getUserRole } from '@/lib/roles';
import { writeThemeDefault } from '@/lib/theme-store';
import { validateTheme } from '@/lib/theme-validation';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

async function authorizeSuper(request: Request) {
  if (hasThemeEditorToken(request)) {
    const auth = await requireThemeEditorToken(request);
    if (!auth.ok) {
      return { ok: false as const, response: withThemeEditorCorsHeaders(request, auth.response) };
    }
    const role = String(auth.payload.role || '').toLowerCase();
    if (role !== 'admin' && role !== 'user') {
      return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
    }
    return { ok: true as const };
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  const userId = (session as { user?: { id?: string } } | null)?.user?.id || null;
  const role = await getUserRole(userId);
  if (role !== 'admin' && role !== 'user') {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function POST(request: Request) {
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const gate = await authorizeSuper(request);
  if (!gate.ok) return gate.response;

  const body = await request.json().catch(() => null);
  const payload = body?.payload;
  if (!payload) {
    const res = NextResponse.json({ error: 'Missing payload' }, { status: 400 });
    return withThemeEditorCorsHeaders(request, res);
  }

  const validation = validateTheme(payload);
  if (!validation.ok) {
    const res = NextResponse.json({ error: 'Invalid theme payload', errors: validation.errors }, { status: 400 });
    return withThemeEditorCorsHeaders(request, res);
  }

  await writeThemeDefault(validation.payload);
  revalidateTag(themeTags.current);
  revalidateTag(themeTags.draft);
  const res = NextResponse.json({ ok: true, payload: validation.payload });
  return withThemeEditorCorsHeaders(request, res);
}
