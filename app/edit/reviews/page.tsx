import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { unstable_noStore } from 'next/cache';
import { AdminWorkspaceShell } from '@/components/admin/admin-workspace-shell.client';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuth } from '@/lib/auth';
import { canViewAllReviewComments } from '@/lib/review-access';
import { listReviewCommentFeed } from '@/lib/review-comment-feed';
import { adminHomePath, isAdminOnly } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'Review Comments'
};

function formatDate(value: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return '-';
  return value.toLocaleString();
}

function formatTarget(pathname: string | null, slug: string) {
  if (pathname) return pathname;
  return slug === 'home' ? '/' : `/${slug}`;
}

export default async function EditReviewsPage() {
  unstable_noStore();
  if (isAdminOnly()) {
    redirect(adminHomePath);
  }

  const auth = getAuth();
  const session = await auth.api.getSession({ headers: await headers() });
  const user = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  if (!session || !user?.id) {
    redirect('/sign-in?next=/edit/reviews');
  }

  const canSeeAll = canViewAllReviewComments(user.email || null);
  const comments = await listReviewCommentFeed({
    scope: canSeeAll ? 'all' : 'mine',
    viewer: {
      userId: user.id,
      email: user.email || null,
      displayName: user.name || null
    },
    limit: canSeeAll ? 600 : 300
  });

  return (
    <AdminWorkspaceShell>
      <main className="mx-auto w-full max-w-[1280px] space-y-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Review Comments</CardTitle>
            <CardDescription>
              {canSeeAll
                ? 'Global reviewer view: all comments across review links and routes.'
                : 'Your comments across all review links and routes.'}
            </CardDescription>
          </CardHeader>
        </Card>

        {comments.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No comments found</CardTitle>
              <CardDescription>
                {canSeeAll
                  ? 'No review comments have been posted yet.'
                  : 'You have not posted any review comments yet.'}
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        <div className="space-y-3">
          {comments.map((comment) => {
            const target = formatTarget(comment.pathname, comment.slug);
            const statusVariant = comment.status === 'resolved' ? 'secondary' : 'default';
            return (
              <Card key={`${comment.annotationId}:${comment.createdAt.toISOString()}`}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant}>{comment.status}</Badge>
                    <Badge variant="outline">{target}</Badge>
                    {canSeeAll ? <Badge variant="outline">{comment.authorName}</Badge> : null}
                    <span className="text-xs text-[var(--vd-muted-fg)]">{formatDate(comment.createdAt)}</span>
                  </div>

                  <p className="text-sm whitespace-pre-wrap text-[var(--vd-fg)]">{comment.body}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--vd-muted-fg)]">
                    <span>Annotation: {comment.annotationId}</span>
                    <span>Token: {comment.reviewTokenId}</span>
                    {comment.screenshotUrl ? (
                      <Link
                        href={comment.screenshotUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline underline-offset-4 hover:text-[var(--vd-fg)]"
                      >
                        View screenshot
                      </Link>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </AdminWorkspaceShell>
  );
}
