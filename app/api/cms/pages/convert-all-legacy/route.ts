import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { revalidateTagSafe as revalidateTag } from '@/lib/cache-revalidate';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Page } from '@/models/Page';
import { convertLegacyPageTemplateToBlocks } from '@/lib/page-legacy-conversion';
import { listLegacyPageComponents } from '@/lib/puck/legacy-page-components';
import { findLegacyTypesWithoutTemplates } from '@/lib/puck/page-template-migrations';
import { LEGACY_PAGE_TYPES } from '@/lib/puck/legacy-types';
import { isAdminOnly } from '@/lib/site-config';
import { pageTags } from '@/lib/cache-tags';

const ConvertAllSchema = z.object({
  dryRun: z.boolean().optional(),
  publishConverted: z.boolean().optional(),
  slugs: z.array(z.string().trim().min(1)).optional()
});
const ASAP_LEGACY_TYPE_SET = new Set<string>(LEGACY_PAGE_TYPES);

type CandidatePage = {
  slug?: string;
  draftData?: unknown;
  publishedData?: unknown;
  data?: unknown;
};

export async function POST(request: NextRequest) {
  if (isAdminOnly()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = ConvertAllSchema.parse(await request.json().catch(() => ({})));
  const dryRun = payload.dryRun === true;
  const publishConverted = payload.publishConverted === true;
  const requestedSlugs = new Set((payload.slugs || []).map((slug) => slug.trim()).filter(Boolean));

  const conn = await connectDB();
  if (!conn) {
    return NextResponse.json({ error: 'Database connection not available' }, { status: 500 });
  }

  const query = requestedSlugs.size > 0 ? { slug: { $in: Array.from(requestedSlugs) } } : {};
  const pages = (await Page.find(query).select({ slug: 1, draftData: 1, publishedData: 1, data: 1 }).lean()) as CandidatePage[];

  const converted: Array<Record<string, unknown>> = [];
  const skipped: Array<Record<string, unknown>> = [];
  const errors: Array<Record<string, unknown>> = [];

  for (const page of pages) {
    const slug = (page.slug || '').trim();
    if (!slug) continue;

    const source = page.draftData ?? page.publishedData ?? page.data;
    const legacyTypes = listLegacyPageComponents(source);
    if (!legacyTypes.length) {
      skipped.push({ slug, reason: 'no-legacy-content' });
      continue;
    }

    const unsupportedTypes = legacyTypes.filter((type) => !ASAP_LEGACY_TYPE_SET.has(type));
    if (unsupportedTypes.length) {
      errors.push({
        slug,
        reason: 'unsupported-legacy-type',
        legacyTypes: unsupportedTypes
      });
      continue;
    }

    const missingTemplates = findLegacyTypesWithoutTemplates(legacyTypes);
    if (missingTemplates.length) {
      errors.push({
        slug,
        reason: 'missing-template-mapping',
        legacyTypes: missingTemplates
      });
      continue;
    }

    if (dryRun) {
      converted.push({
        slug,
        mode: 'plan',
        fromType: legacyTypes.join(', '),
        publishConverted
      });
      continue;
    }

    try {
      const sessionUserId =
        (session as { user?: { id?: string } | null } | null)?.user?.id || 'unknown-user';
      const result = await convertLegacyPageTemplateToBlocks(slug, sessionUserId, {
        publishConverted
      });
      if (!result.converted) {
        skipped.push({
          slug,
          reason: result.legacyTemplateTypes.length > 0 ? 'conversion-noop' : 'already-composable',
          legacyTemplateTypes: result.legacyTemplateTypes
        });
        continue;
      }

      converted.push({
        slug,
        fromType: result.fromType,
        toBlockCount: result.toBlockCount,
        snapshotId: result.snapshotId,
        publishedUpdated: result.publishedUpdated
      });
    } catch (error) {
      errors.push({
        slug,
        reason: 'conversion-failed',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (!dryRun && converted.length > 0) {
    revalidateTag(pageTags.content);
    revalidateTag(pageTags.list());
    revalidateTag(pageTags.list(true));
  }

  return NextResponse.json({
    dryRun,
    publishConverted,
    requestedSlugs: requestedSlugs.size > 0 ? Array.from(requestedSlugs) : null,
    converted,
    skipped,
    errors
  });
}
