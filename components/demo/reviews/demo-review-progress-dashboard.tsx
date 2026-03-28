import { Activity, CheckCircle2, Clock3, MessageSquare, Timer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatReviewDate, type DemoReviewActivity, type DemoReviewStats } from '@/components/demo/reviews/demo-reviews-utils';

type DemoReviewProgressDashboardProps = {
  stats: DemoReviewStats;
  activity: DemoReviewActivity;
};

export function DemoReviewProgressDashboard({ stats, activity }: DemoReviewProgressDashboardProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Total comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-[var(--vd-muted-fg)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.totalComments}</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Open comments</CardTitle>
            <Clock3 className="h-4 w-4 text-[var(--vd-muted-fg)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.openComments}</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Resolved comments</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-[var(--vd-muted-fg)]" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.resolvedComments}</p>
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Last comment</CardTitle>
            <Timer className="h-4 w-4 text-[var(--vd-muted-fg)]" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-[var(--vd-muted-fg)]">{formatReviewDate(stats.lastCommentAt)}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[var(--vd-border)] shadow-none">
        <CardHeader>
          <CardTitle>Completion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--vd-muted-fg)]">Resolved progress</span>
            <span className="font-medium">{stats.percentComplete}%</span>
          </div>
          <Progress value={stats.percentComplete} aria-label="Review completion" />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle>Comments per page</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.commentsPerPage.map((row) => (
              <div key={row.pathname} className="rounded-xl border border-[var(--vd-border)] p-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline">{row.pathname}</Badge>
                  <span className="text-xs text-[var(--vd-muted-fg)]">{row.totalComments} total</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs">
                  <Badge variant="secondary">Open: {row.openComments}</Badge>
                  <Badge variant="secondary">Resolved: {row.resolvedComments}</Badge>
                </div>
                <p className="mt-2 text-xs text-[var(--vd-muted-fg)]">Last activity: {formatReviewDate(row.lastCommentAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle>Activity timeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              {activity.timeline.map((entry) => (
                <div key={entry.day} className="flex items-center justify-between rounded-xl border border-[var(--vd-border)] px-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="h-3 w-3 text-[var(--vd-muted-fg)]" />
                    <span>{entry.day}</span>
                  </div>
                  <span className="text-[var(--vd-muted-fg)]">{entry.comments} comments</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
