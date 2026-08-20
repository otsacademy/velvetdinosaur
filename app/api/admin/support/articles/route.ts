import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdminFromHeaders } from '@/lib/support/auth';
import { createSupportArticle, listSupportArticles } from '@/lib/support/content';

const CreateArticleSchema = z.object({
  title: z.string().trim().min(1).max(220),
  slug: z.string().trim().max(220).optional(),
  type: z.enum(['knowledge', 'announcement', 'feature']),
  category: z.string().trim().max(120).optional(),
  module: z.string().trim().max(120).optional(),
  tags: z.array(z.string().trim().max(80)).max(40).optional(),
  summary: z.string().trim().max(5000).optional(),
  bodyText: z.string().max(200000).optional(),
  searchable: z.boolean().optional(),
  publishedAt: z.string().trim().optional()
});

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const type = (clean(url.searchParams.get('type')) || 'all') as 'all' | 'knowledge' | 'announcement' | 'feature';
  const q = clean(url.searchParams.get('q'));
  const moduleFilter = clean(url.searchParams.get('module'));
  const category = clean(url.searchParams.get('category'));
  const limit = Math.max(1, Math.min(500, Number(url.searchParams.get('limit') || 120)));

  const items = await listSupportArticles({ type, q, module: moduleFilter, category, limit });
  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  unstable_noStore();
  const admin = await requireAdminFromHeaders(request.headers);
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = CreateArticleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const item = await createSupportArticle({
    ...parsed.data,
    createdByUserId: admin.id,
    createdByEmail: admin.email
  });

  return NextResponse.json({ item }, { status: 201 });
}
