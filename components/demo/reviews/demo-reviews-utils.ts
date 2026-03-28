import type { DemoReviewComment, DemoReviewLink } from '@/lib/demo-reviews-seed';

export type DemoReviewStats = {
  totalComments: number;
  openComments: number;
  resolvedComments: number;
  lastCommentAt: Date | null;
  percentComplete: number;
  commentsPerPage: Array<{
    slug: string;
    pathname: string;
    totalComments: number;
    openComments: number;
    resolvedComments: number;
    lastCommentAt: Date | null;
  }>;
};

export type DemoReviewActivity = {
  timeline: Array<{ day: string; comments: number }>;
  recent: DemoReviewComment[];
};

export function formatReviewDate(value: string | Date | null) {
  if (!value) return '-';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
}

export function deriveReviewProgress(comments: DemoReviewComment[]): {
  stats: DemoReviewStats;
  activity: DemoReviewActivity;
} {
  const sorted = [...comments].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const pageMap = new Map<
    string,
    { slug: string; pathname: string; totalComments: number; openComments: number; resolvedComments: number; lastCommentAt: Date | null }
  >();
  const timelineMap = new Map<string, number>();

  for (const comment of sorted) {
    const key = comment.pathname;
    const current = pageMap.get(key) ?? {
      slug: comment.slug,
      pathname: comment.pathname,
      totalComments: 0,
      openComments: 0,
      resolvedComments: 0,
      lastCommentAt: null
    };
    current.totalComments += 1;
    if (comment.status === 'resolved') current.resolvedComments += 1;
    if (comment.status === 'open') current.openComments += 1;
    if (!current.lastCommentAt || current.lastCommentAt < new Date(comment.createdAt)) {
      current.lastCommentAt = new Date(comment.createdAt);
    }
    pageMap.set(key, current);

    const day = comment.createdAt.slice(0, 10);
    timelineMap.set(day, (timelineMap.get(day) ?? 0) + 1);
  }

  const totalComments = comments.length;
  const openComments = comments.filter((item) => item.status === 'open').length;
  const resolvedComments = totalComments - openComments;
  const percentComplete = totalComments ? Math.round((resolvedComments / totalComments) * 100) : 0;

  return {
    stats: {
      totalComments,
      openComments,
      resolvedComments,
      lastCommentAt: sorted[0] ? new Date(sorted[0].createdAt) : null,
      percentComplete,
      commentsPerPage: Array.from(pageMap.values()).sort((left, right) => right.totalComments - left.totalComments)
    },
    activity: {
      timeline: Array.from(timelineMap.entries())
        .sort((left, right) => right[0].localeCompare(left[0]))
        .map(([day, count]) => ({ day, comments: count })),
      recent: sorted
    }
  };
}

export function buildShareUrl(link: DemoReviewLink) {
  return `https://harbourandpine.example/review/${link.token}`;
}

export function nextReviewLinkId() {
  return `link-demo-${Math.random().toString(36).slice(2, 8)}`;
}

export function nextReviewCommentId() {
  return `comment-demo-${Math.random().toString(36).slice(2, 8)}`;
}
