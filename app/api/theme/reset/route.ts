import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { authorize } from '@/lib/authz';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { DEFAULT_THEME_PAYLOAD } from '@/lib/theme-default';
import { readThemeDefault, writeThemeCurrent, writeThemeDefault, writeThemeLastGood } from '@/lib/theme-store';
import { validateTheme } from '@/lib/theme-validation';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const gate = await authorize(request, 'theme:user');
  if (!gate.ok) return withThemeEditorCorsHeaders(request, gate.response);

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
