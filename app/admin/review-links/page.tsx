import { headers } from 'next/headers';
import { AccessNotice } from '@/components/admin/access-notice';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { canManageReviewMode } from '@/lib/review/review-mode-access';
import { listPages } from '@/lib/pages';
import { isSiteChromeSlug } from '@/lib/site-chrome-slugs';
import { canViewAllReviewComments } from '@/lib/review-access';
import { getDefaultReviewDeadline } from '@/lib/security/review-deadlines';
import { ReviewLinksManager } from '@/components/admin/review-links/review-links-manager';
import { Button } from '@/components/ui/button';

const INTERNAL_REVIEW_START_PATHS = [
  '/admin/store',
  '/admin/theme',
  '/admin/review-links',
  '/admin/review-progress',
  '/admin/users',
  '/admin/approvals',
  '/edit',
  '/edit/calendar',
  '/edit/inbox',
  '/edit/media',
  '/edit/news/new',
  '/account'
];

function toDatetimeLocalValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

export default async function ReviewLinksPage() {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  if (!session) {
    redirect('/sign-in?next=/admin/review-links');
  }
  if (!(await requireAdmin(userId, user?.email || null))) {
    return <AccessNotice workspace="Review Links" />;
  }
  if (!canManageReviewMode(user?.email || null)) {
    redirect('/edit');
  }
  const allowFullCommentAccess = canViewAllReviewComments(user?.email || null);

  const pages = await listPages({ includeEmpty: true });
  const publicSlugs = pages
    .map((page) => page.slug)
    .filter((slug): slug is string => Boolean(slug && !isSiteChromeSlug(slug)))
    .sort((a, b) => a.localeCompare(b));
  const availableTargets = [...new Set([...publicSlugs, ...INTERNAL_REVIEW_START_PATHS])];

  return (
    <main className="container space-y-8 py-8">
      <div>
        <h1 className="text-3xl font-semibold">Review Links</h1>
        <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
          Generate secure external review links for draft pages and routes. Links open under <code>/review</code>; <code>/preview</code> remains the internal editor preview.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {allowFullCommentAccess ? (
            <Button variant="outline" asChild>
              <Link href="/admin/review-progress">View Review Progress</Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link href="/edit/reviews">View My Review Comments</Link>
          </Button>
        </div>
      </div>
      <ReviewLinksManager
        availableSlugs={availableTargets}
        defaultDeadlineValue={toDatetimeLocalValue(getDefaultReviewDeadline())}
        allowFullCommentAccess={allowFullCommentAccess}
      />
    </main>
  );
}
