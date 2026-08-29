import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { authorize } from '@/lib/authz';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { writeThemeDefault } from '@/lib/theme-store';
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
