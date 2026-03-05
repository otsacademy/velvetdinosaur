import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import type { Data } from '@measured/puck';
import { assertServerOnly } from '@/lib/_server/guard';
import { getPublishedPageData } from '@/lib/pages';

assertServerOnly('app/api/legal/route.ts');

type LegalSection = {
  heading?: string;
  body?: string;
};

type LegalPayload = {
  slug: 'privacy' | 'terms';
  title?: string;
  lastUpdated?: string;
  sections: LegalSection[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object');
}

function findLegalBlock(data: Data): { props?: Record<string, unknown> } | null {
  if (!data || !Array.isArray(data.content)) return null;
  for (const item of data.content) {
    if (!isRecord(item)) continue;
    if (item.type === 'LegalDocument') {
      return item as { props?: Record<string, unknown> };
    }
  }
  return null;
}

function normalizeSections(value: unknown): LegalSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((section) => {
      if (!isRecord(section)) return null;
      const heading = typeof section.heading === 'string' ? section.heading : undefined;
      const body = typeof section.body === 'string' ? section.body : undefined;
      if (!heading && !body) return null;
      return { heading, body } satisfies LegalSection;
    })
    .filter(Boolean) as LegalSection[];
}

export async function GET(request: Request) {
  unstable_noStore();
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  if (slug !== 'privacy' && slug !== 'terms') {
    return NextResponse.json({ error: 'Invalid slug' }, { status: 400 });
  }

  const data = await getPublishedPageData(slug);
  const block = findLegalBlock(data);
  if (!block || !block.props) {
    return NextResponse.json({ error: 'Legal document not found' }, { status: 404 });
  }

  const props = block.props;
  const payload: LegalPayload = {
    slug,
    title: typeof props.title === 'string' ? props.title : undefined,
    lastUpdated: typeof props.lastUpdated === 'string' ? props.lastUpdated : undefined,
    sections: normalizeSections(props.sections)
  };

  return NextResponse.json(payload);
}
