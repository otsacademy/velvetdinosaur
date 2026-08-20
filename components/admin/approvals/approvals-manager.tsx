'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type PageApprovalRow = {
  slug: string;
  title: string;
  revision: number | null;
  draftUpdatedAt: string | null;
  publishedAt: string | null;
  requestId: string | null;
  baseRevision: number | null;
  requestedAt: string | null;
  requestedByUserId: string | null;
  requestedByEmail: string | null;
  requestedByName: string | null;
};

type NewsApprovalRow = {
  slug: string;
  title: string;
  tag: string;
  primaryChapterName?: string | null;
  revision: number | null;
  status: 'draft' | 'scheduled' | 'published';
  date: string;
  updatedAt: string | null;
  requestId: string | null;
  baseRevision: number | null;
  requestedAt: string | null;
  requestedByUserId: string | null;
  requestedByEmail: string | null;
  requestedByName: string | null;
  requestedMode: 'publish' | 'scheduled';
  requestedPublishAt: string | null;
};

type NoticeState =
  | { type: 'idle' }
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string };

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

export function ApprovalsManager() {
  const [pages, setPages] = useState<PageApprovalRow[]>([]);
  const [news, setNews] = useState<NewsApprovalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>({ type: 'idle' });

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/approvals', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setNotice({
        type: 'error',
        title: 'Unable to load approvals',
        message: payload?.error || 'Request failed.'
      });
      setLoading(false);
      return;
    }

    setPages((payload?.pages || []) as PageApprovalRow[]);
    setNews((payload?.news || []) as NewsApprovalRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void load();
  }, [load]);

  const pendingCount = useMemo(() => pages.length + news.length, [news.length, pages.length]);

  const runPageAction = useCallback(
    async (row: PageApprovalRow, action: 'approve' | 'reject') => {
      const key = `page:${row.slug}:${action}`;
      const rejectionReason = action === 'reject' ? window.prompt('Rejection reason (optional):') : null;
      setBusyKey(key);
      const response = await fetch('/api/admin/approvals/page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: row.slug,
          action,
          requestId: row.requestId,
          baseRevision: row.baseRevision,
          rejectionReason: rejectionReason?.trim() || null
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setNotice({
          type: 'error',
          title: action === 'approve' ? 'Page approval failed' : 'Page rejection failed',
          message: payload?.error || 'Request failed.'
        });
        setBusyKey(null);
        return;
      }

      setNotice({
        type: 'success',
        title: action === 'approve' ? 'Page approved' : 'Page request rejected',
        message: `/${row.slug} ${action === 'approve' ? 'is now live' : 'was removed from the queue'}.`
      });
      await load();
      setBusyKey(null);
    },
    [load]
  );

  const runNewsAction = useCallback(
    async (row: NewsApprovalRow, action: 'approve' | 'reject') => {
      const key = `news:${row.slug}:${action}`;
      const rejectionReason = action === 'reject' ? window.prompt('Rejection reason (optional):') : null;
      setBusyKey(key);
      const response = await fetch('/api/admin/approvals/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: row.slug,
          action,
          requestId: row.requestId,
          baseRevision: row.baseRevision,
          rejectionReason: rejectionReason?.trim() || null
        })
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setNotice({
          type: 'error',
          title: action === 'approve' ? 'News approval failed' : 'News rejection failed',
          message: payload?.error || 'Request failed.'
        });
        setBusyKey(null);
        return;
      }

      setNotice({
        type: 'success',
        title: action === 'approve' ? 'Article approved' : 'Article request rejected',
        message: `${row.slug} ${action === 'approve' ? 'was approved' : 'was removed from the queue'}.`
      });
      await load();
      setBusyKey(null);
    },
    [load]
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-3">
            <span>Pending Queue</span>
            <Badge>{pendingCount} pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={loading || !!busyKey}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </CardContent>
      </Card>

      {notice.type === 'error' ? (
        <Alert variant="destructive">
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      {notice.type === 'success' ? (
        <Alert>
          <AlertTitle>{notice.title}</AlertTitle>
          <AlertDescription>{notice.message}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Page Publish Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading page approvals...</p> : null}
          {!loading && pages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                All caught up
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pending page requests from team members will appear here.
              </p>
            </div>
          ) : null}
          {pages.map((row) => {
            const approveKey = `page:${row.slug}:approve`;
            const rejectKey = `page:${row.slug}:reject`;
            return (
              <div key={`page-${row.slug}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <p className="text-xs text-muted-foreground">/{row.slug}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested: {formatDate(row.requestedAt)}
                      {row.requestedByEmail ? ` by ${row.requestedByEmail}` : row.requestedByName ? ` by ${row.requestedByName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Draft updated: {formatDate(row.draftUpdatedAt)} • Live: {formatDate(row.publishedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void runPageAction(row, 'approve')}
                      disabled={busyKey === approveKey || !!busyKey}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve & Publish
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runPageAction(row, 'reject')}
                      disabled={busyKey === rejectKey || !!busyKey}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>News Publish Requests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading news approvals...</p> : null}
          {!loading && news.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-5">
              <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                All caught up
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Pending news requests from team members will appear here.
              </p>
            </div>
          ) : null}
          {news.map((row) => {
            const approveKey = `news:${row.slug}:approve`;
            const rejectKey = `news:${row.slug}:reject`;
            return (
              <div key={`news-${row.slug}`} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{row.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="secondary" className="h-5 px-2 text-[10px]">
                        {row.tag}
                      </Badge>
                      {row.primaryChapterName ? (
                        <Badge variant="outline" className="h-5 px-2 text-[10px]">
                          {row.primaryChapterName}
                        </Badge>
                      ) : null}
                      <span>/news/{row.slug}</span>
                      <span>Status: {row.status}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requested: {formatDate(row.requestedAt)}
                      {row.requestedByEmail ? ` by ${row.requestedByEmail}` : row.requestedByName ? ` by ${row.requestedByName}` : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Mode: {row.requestedMode === 'scheduled' ? 'Schedule' : 'Publish now'}
                      {row.requestedMode === 'scheduled' ? ` (${formatDate(row.requestedPublishAt)})` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={() => void runNewsAction(row, 'approve')}
                      disabled={busyKey === approveKey || !!busyKey}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => void runNewsAction(row, 'reject')}
                      disabled={busyKey === rejectKey || !!busyKey}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
