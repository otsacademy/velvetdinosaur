import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { hasThemeEditorToken, requireThemeEditorToken } from '@/lib/theme-editor-auth';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { getUserRole } from '@/lib/roles';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';
import { readThemeDefault, writeThemeCurrent, writeThemeDefault, writeThemeLastGood } from '@/lib/theme-store';
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

  const gate = await authorize(request);
  if (!gate.ok) return gate.response;

  const storedDefault = await readThemeDefault();
  const validatedDefault = storedDefault ? validateTheme(storedDefault) : null;
  const payload = validatedDefault?.ok ? validatedDefault.payload : DEFAULT_THEME_PAYLOAD;

  if (!validatedDefault?.ok) {
    try {
      await writeThemeDefault(payload);
    } catch {
      // Ignore storage failures.
    }
  }

  await writeThemeCurrent(payload);
  await writeThemeLastGood(payload);
  revalidateTag(themeTags.current);
  revalidateTag(themeTags.draft);

  const res = NextResponse.json({ ok: true, payload });
  return withThemeEditorCorsHeaders(request, res);
}
