import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { authorize } from '@/lib/authz';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { saveThemePayload } from '@/lib/theme';
import { validateTheme } from '@/lib/theme-validation';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  unstable_noStore();
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const gate = await authorize(request, 'theme:user');
  if (!gate.ok) return withThemeEditorCorsHeaders(request, gate.response);

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
