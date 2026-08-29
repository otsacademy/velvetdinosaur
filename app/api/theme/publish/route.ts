import { NextResponse } from 'next/server';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { authorize } from '@/lib/authz';
import { corsPreflight, enforceThemeEditorCors, withThemeEditorCorsHeaders } from '@/lib/theme-editor-cors';
import { publishThemeDraftPayload } from '@/lib/theme';
import { themeTags } from '@/lib/cache-tags';

export async function OPTIONS(request: Request) {
  return corsPreflight(request);
}

export async function POST(request: Request) {
  const corsBlock = enforceThemeEditorCors(request);
  if (corsBlock) return corsBlock;

  const gate = await authorize(request, 'theme:user');
  if (!gate.ok) return withThemeEditorCorsHeaders(request, gate.response);

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
