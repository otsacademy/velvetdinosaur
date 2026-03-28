'use client';

import { useMemo, useState } from 'react';
import { Copy, Link2, MessageSquarePlus } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DemoHelpTooltip } from '@/components/demo/demo-help-tooltip';
import { DemoReviewProgressDashboard } from '@/components/demo/reviews/demo-review-progress-dashboard';
import {
  buildShareUrl,
  deriveReviewProgress,
  formatReviewDate,
  nextReviewCommentId,
  nextReviewLinkId
} from '@/components/demo/reviews/demo-reviews-utils';
import { createDemoReviewSeed, type DemoReviewComment, type DemoReviewLink } from '@/lib/demo-reviews-seed';
import { cn } from '@/lib/utils';

export function DemoReviewsWorkspace() {
  const seed = useMemo(() => createDemoReviewSeed(), []);
  const [links, setLinks] = useState<DemoReviewLink[]>(seed.links);
  const [comments, setComments] = useState<DemoReviewComment[]>(seed.comments);
  const [selectedLinkId, setSelectedLinkId] = useState(seed.links[0]?.id ?? '');
  const [statusFilter, setStatusFilter] = useState<'all' | DemoReviewComment['status']>('all');
  const [newComment, setNewComment] = useState('');
  const [newLink, setNewLink] = useState({
    label: 'Homepage review round',
    pathname: '/',
    reviewerName: 'Ivy Harper',
    reviewerEmail: 'ivy@harbourandpine.example',
    expiresAt: '2026-03-31T16:00'
  });

  const selectedLink = links.find((item) => item.id === selectedLinkId) ?? links[0] ?? null;
  const visibleComments = comments.filter((comment) => {
    if (selectedLink && comment.reviewTokenId !== selectedLink.token) return false;
    if (statusFilter !== 'all' && comment.status !== statusFilter) return false;
    return true;
  });
  const progress = useMemo(() => deriveReviewProgress(comments), [comments]);

  function createLink() {
    if (!newLink.label.trim() || !newLink.pathname.trim() || !newLink.reviewerEmail.trim()) {
      toast.error('Label, path, and reviewer email are required.');
      return;
    }

    const link: DemoReviewLink = {
      id: nextReviewLinkId(),
      token: `rvw_${Math.random().toString(36).slice(2, 8)}`,
      label: newLink.label.trim(),
      pathname: newLink.pathname.trim(),
      reviewerName: newLink.reviewerName.trim() || 'Reviewer',
      reviewerEmail: newLink.reviewerEmail.trim(),
      expiresAt: new Date(newLink.expiresAt || new Date().toISOString()).toISOString(),
      status: 'active',
      createdAt: new Date().toISOString()
    };

    setLinks((current) => [link, ...current]);
    setSelectedLinkId(link.id);
    toast.info('A review link has been created for this demo session only. No invitation has been sent.');
  }

  function addComment() {
    if (!selectedLink) {
      toast.error('Select a review link before adding a comment.');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Write a comment before adding it to the demo feed.');
      return;
    }

    const comment: DemoReviewComment = {
      id: nextReviewCommentId(),
      slug: selectedLink.pathname === '/' ? 'home' : selectedLink.pathname.replace(/^\//, ''),
      pathname: selectedLink.pathname,
      reviewTokenId: selectedLink.token,
      annotationId: `anno_${Math.random().toString(36).slice(2, 7)}`,
      authorName: selectedLink.reviewerName,
      reviewerEmail: selectedLink.reviewerEmail,
      body: newComment.trim(),
      status: 'open',
      createdAt: new Date().toISOString()
    };

    setComments((current) => [comment, ...current]);
    setNewComment('');
    toast.info('Comment added to the demonstration review feed.');
  }

  function toggleCommentStatus(comment: DemoReviewComment) {
    setComments((current) =>
      current.map((item) =>
        item.id === comment.id ? { ...item, status: item.status === 'open' ? 'resolved' : 'open' } : item
      )
    );
    toast.info('Comment status updated for this demo session.');
  }

  function toggleLinkStatus(link: DemoReviewLink) {
    setLinks((current) =>
      current.map((item) =>
        item.id === link.id
          ? { ...item, status: item.status === 'active' ? 'revoked' : 'active' }
          : item
      )
    );
    toast.info('Review link status updated in the demo.');
  }

  function copyLink(link: DemoReviewLink) {
    void navigator.clipboard?.writeText(buildShareUrl(link));
    toast.info('Demo review link copied.');
  }

  return (
    <div className="space-y-6">
      <DemoReviewProgressDashboard stats={progress.stats} activity={progress.activity} />

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-[var(--vd-border)] shadow-none">
          <CardHeader>
            <CardTitle>Review links</CardTitle>
            <CardDescription>Issue, revoke, and inspect fake review links without inviting real reviewers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {links.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => setSelectedLinkId(link.id)}
                  className={cn(
                    'w-full rounded-[1.25rem] border p-4 text-left transition-colors',
                    selectedLink?.id === link.id
                      ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/50'
                      : 'border-[var(--vd-border)] bg-[var(--vd-card)] hover:bg-[var(--vd-muted)]/40'
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[var(--vd-fg)]">{link.label}</p>
                    <Badge variant={link.status === 'active' ? 'secondary' : link.status === 'expired' ? 'outline' : 'destructive'}>
                      {link.status}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{link.pathname}</p>
                  <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{link.reviewerName} · {link.reviewerEmail}</p>
                  <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">
                    Expires {formatReviewDate(link.expiresAt)}
                  </p>
                </button>
              ))}
            </div>

            <div className="rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[var(--vd-primary)]" />
                <p className="font-semibold text-[var(--vd-fg)]">Create demo link</p>
              </div>
              <div className="mt-4 grid gap-3">
                <Input value={newLink.label} onChange={(event) => setNewLink((current) => ({ ...current, label: event.target.value }))} placeholder="Label" />
                <Input value={newLink.pathname} onChange={(event) => setNewLink((current) => ({ ...current, pathname: event.target.value }))} placeholder="/page-path" />
                <Input value={newLink.reviewerName} onChange={(event) => setNewLink((current) => ({ ...current, reviewerName: event.target.value }))} placeholder="Reviewer name" />
                <Input value={newLink.reviewerEmail} onChange={(event) => setNewLink((current) => ({ ...current, reviewerEmail: event.target.value }))} placeholder="Reviewer email" />
                <Input type="datetime-local" value={newLink.expiresAt} onChange={(event) => setNewLink((current) => ({ ...current, expiresAt: event.target.value }))} />
                <DemoHelpTooltip content="Generate a fictional share link for review rounds without inviting a real customer or editor.">
                  <Button onClick={createLink}>Create review link</Button>
                </DemoHelpTooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-[var(--vd-border)] shadow-none">
            <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <CardTitle>Comment feed</CardTitle>
                <CardDescription>
                  Reviewers can leave notes, and the team can resolve them locally in this sandbox.
                </CardDescription>
              </div>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as 'all' | DemoReviewComment['status'])}>
                <SelectTrigger className="md:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All comments</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                <div className="flex items-center gap-2">
                  <MessageSquarePlus className="h-4 w-4 text-[var(--vd-primary)]" />
                  <p className="font-semibold text-[var(--vd-fg)]">Add a demo comment</p>
                </div>
                <Textarea
                  rows={4}
                  value={newComment}
                  onChange={(event) => setNewComment(event.target.value)}
                  placeholder="Add a review note for the selected page"
                  className="mt-4"
                />
                <div className="mt-3 flex flex-wrap gap-2">
                  <DemoHelpTooltip content="Add a fresh review note against the selected page so the team can demonstrate comment triage.">
                    <Button onClick={addComment}>Add comment</Button>
                  </DemoHelpTooltip>
                  {selectedLink ? (
                    <>
                      <DemoHelpTooltip content="Copy the fictional review URL so you can show how a client or stakeholder would access the page review.">
                        <Button variant="outline" onClick={() => copyLink(selectedLink)}>
                          <Copy className="h-4 w-4" />
                          Copy link
                        </Button>
                      </DemoHelpTooltip>
                      <DemoHelpTooltip content="Disable or reopen the selected review link locally without affecting any real reviewer access.">
                        <Button variant="outline" onClick={() => toggleLinkStatus(selectedLink)}>
                          {selectedLink.status === 'active' ? 'Revoke link' : 'Reactivate link'}
                        </Button>
                      </DemoHelpTooltip>
                    </>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3">
                {visibleComments.map((comment) => (
                  <div key={comment.id} className="rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={comment.status === 'resolved' ? 'secondary' : 'default'}>{comment.status}</Badge>
                      <Badge variant="outline">{comment.pathname}</Badge>
                      <span className="text-xs text-[var(--vd-muted-fg)]">{formatReviewDate(comment.createdAt)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--vd-fg)]">{comment.body}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--vd-muted-fg)]">
                      <span>{comment.authorName}</span>
                      <span>{comment.reviewerEmail}</span>
                      <span>{comment.annotationId}</span>
                    </div>
                    <div className="mt-4">
                      <DemoHelpTooltip content="Flip the note between open and resolved so prospects can see the review workflow end to end.">
                        <Button variant="outline" size="sm" onClick={() => toggleCommentStatus(comment)}>
                          Mark as {comment.status === 'open' ? 'resolved' : 'open'}
                        </Button>
                      </DemoHelpTooltip>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedLink ? (
            <Card className="border-[var(--vd-border)] shadow-none">
              <CardHeader>
                <CardTitle>Selected link</CardTitle>
                <CardDescription>Shareable review URL and reviewer context for the current demo link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Share URL</p>
                  <p className="mt-2 font-mono text-sm text-[var(--vd-fg)]">{buildShareUrl(selectedLink)}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Reviewer</p>
                    <p className="mt-2 font-medium text-[var(--vd-fg)]">{selectedLink.reviewerName}</p>
                    <p className="text-sm text-[var(--vd-muted-fg)]">{selectedLink.reviewerEmail}</p>
                  </div>
                  <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">Expiry</p>
                    <p className="mt-2 font-medium text-[var(--vd-fg)]">{formatReviewDate(selectedLink.expiresAt)}</p>
                    <p className="text-sm text-[var(--vd-muted-fg)]">Status: {selectedLink.status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
