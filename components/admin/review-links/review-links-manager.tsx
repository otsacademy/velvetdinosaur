'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, FileDown, Link2, LockOpen, Mail, RefreshCw, ShieldOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { reviewSlugToPathname } from '@/lib/review/pathname-slug';

type ReviewLinkRow = {
  id: string;
  tokenId: string;
  slug: string;
  recipientEmail: string | null;
  deadlineAt: string;
  createdAt: string | null;
  revokedAt: string | null;
  reminderSentAt: string | null;
  overrideLock: boolean;
  createdByUserId: string | null;
  lastSentAt: string | null;
  expired: boolean;
};

type CreateResponse = {
  link: ReviewLinkRow;
  reviewUrl: string;
  emailSent: boolean;
};

type NoticeState =
  | { type: 'idle' }
  | { type: 'error'; title: string; message: string }
  | { type: 'success'; title: string; message: string; reviewUrl?: string | null };

function formatDate(value?: string | null) {
  if (!value) return '-';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleString();
}

function isSoon(deadlineAt: string) {
  const parsed = new Date(deadlineAt);
  if (Number.isNaN(parsed.getTime())) return false;
  const remaining = parsed.getTime() - Date.now();
  return remaining > 0 && remaining < 24 * 60 * 60 * 1000;
}

function formatReviewTarget(value: string) {
  return reviewSlugToPathname(value) || value;
}

export function ReviewLinksManager({
  availableSlugs,
  defaultDeadlineValue,
  allowFullCommentAccess
}: {
  availableSlugs: string[];
  defaultDeadlineValue: string;
  allowFullCommentAccess: boolean;
}) {
  const [links, setLinks] = useState<ReviewLinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slug, setSlug] = useState(availableSlugs[0] || 'home');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [deadlineAt, setDeadlineAt] = useState(defaultDeadlineValue);
  const [notice, setNotice] = useState<NoticeState>({ type: 'idle' });

  const sortedLinks = useMemo(
    () =>
      [...links].sort((a, b) => {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }),
    [links]
  );

  const loadLinks = useCallback(async () => {
    setLoading(true);
    const response = await fetch('/api/admin/review-links', { cache: 'no-store' });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setLoading(false);
      setNotice({
        type: 'error',
        title: 'Unable to load review links',
        message: payload?.error || 'Request failed.'
      });
      return;
    }
    setLinks((payload?.links || []) as ReviewLinkRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch
    void loadLinks();
  }, [loadLinks]);

  const copyToClipboard = useCallback(async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice({ type: 'success', title: 'Copied', message: 'Link copied to clipboard.' });
    } catch {
      setNotice({ type: 'error', title: 'Copy failed', message: 'Could not copy to clipboard.' });
    }
  }, []);

  const createLink = useCallback(
    async (sendEmail: boolean) => {
      setSubmitting(true);
      setNotice({ type: 'idle' });
      const response = await fetch('/api/admin/review-links', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          slug,
          recipientEmail,
          deadlineAt,
          sendEmail
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | CreateResponse
        | { error?: string }
        | null;
      if (!response.ok) {
        setSubmitting(false);
        setNotice({
          type: 'error',
          title: 'Create failed',
          message: payload && 'error' in payload && payload.error ? payload.error : 'Request failed.'
        });
        return;
      }

      const created = payload as CreateResponse;
      setLinks((prev) => [created.link, ...prev]);
      const requestedEmail = sendEmail && Boolean(recipientEmail.trim());
      setNotice({
        type: 'success',
        title: requestedEmail
          ? created.emailSent
            ? 'Link generated and email sent'
            : 'Link generated (email not sent)'
          : 'Link generated',
        message: requestedEmail
          ? created.emailSent
            ? `Review email sent${recipientEmail ? ` to ${recipientEmail}` : ''}.`
            : 'Link was created, but email delivery is not configured on this server yet.'
          : 'Share the generated link with the reviewer.',
        reviewUrl: created.reviewUrl
      });
      if (sendEmail) {
        setRecipientEmail('');
      }
      setSubmitting(false);
    },
    [deadlineAt, recipientEmail, slug]
  );

  const revoke = useCallback(async (id: string) => {
    const ok = window.confirm('Revoke this review link? It will stop working immediately.');
    if (!ok) return;
    const response = await fetch('/api/admin/review-links/revoke', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({
        type: 'error',
        title: 'Revoke failed',
        message: payload?.error || 'Request failed.'
      });
      return;
    }
    setLinks((prev) => prev.map((row) => (row.id === id ? (payload.link as ReviewLinkRow) : row)));
    setNotice({ type: 'success', title: 'Link revoked', message: 'The review link has been revoked.' });
  }, []);

  const toggleOverride = useCallback(async (id: string, overrideLock: boolean) => {
    const response = await fetch('/api/admin/review-links/override', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id, overrideLock })
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      setNotice({
        type: 'error',
        title: 'Override update failed',
        message: payload?.error || 'Request failed.'
      });
      return;
    }
    setLinks((prev) => prev.map((row) => (row.id === id ? (payload.link as ReviewLinkRow) : row)));
    setNotice({
      type: 'success',
      title: overrideLock ? 'Review reopened' : 'Review lock restored',
      message: overrideLock
        ? 'Comments are allowed again for this expired review link.'
        : 'Expired review is locked again.'
    });
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create Review Link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="review-slug">Start page (slug or path)</Label>
              <Input
                id="review-slug"
                list="review-slug-options"
                value={slug}
                onChange={(event) => setSlug(event.target.value)}
                placeholder="/admin/review-links or about"
              />
              <datalist id="review-slug-options">
                {availableSlugs.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
              <p className="text-xs text-muted-foreground">
                Review links can start from public or internal routes. Invited reviewers can access only public routes.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="review-deadline">Deadline</Label>
              <Input
                id="review-deadline"
                type="datetime-local"
                value={deadlineAt}
                onChange={(event) => setDeadlineAt(event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review-recipient">Recipient email (optional)</Label>
            <Input
              id="review-recipient"
              type="email"
              value={recipientEmail}
              onChange={(event) => setRecipientEmail(event.target.value)}
              placeholder="reviewer@example.com"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void createLink(false)} disabled={submitting || !slug.trim()}>
              <Link2 className="mr-2 size-4" />
              Generate Link
            </Button>
            <Button
              variant="outline"
              onClick={() => void createLink(true)}
              disabled={submitting || !slug.trim() || !recipientEmail.trim()}
            >
              <Mail className="mr-2 size-4" />
              Generate &amp; Send Email
            </Button>
            <Button variant="ghost" onClick={() => void loadLinks()} disabled={loading}>
              <RefreshCw className="mr-2 size-4" />
              Refresh
            </Button>
          </div>
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
          <AlertDescription className="space-y-2">
            <p>{notice.message}</p>
            {notice.reviewUrl ? (
              <div className="flex flex-wrap items-center gap-2">
                <code className="rounded bg-muted px-2 py-1 text-xs">{notice.reviewUrl}</code>
                <Button size="sm" variant="outline" onClick={() => void copyToClipboard(notice.reviewUrl || '')}>
                  <Copy className="mr-2 size-4" />
                  Copy
                </Button>
              </div>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Existing Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-[var(--vd-muted-fg)]">Loading review links...</p> : null}
          {!loading && sortedLinks.length === 0 ? (
            <p className="text-sm text-[var(--vd-muted-fg)]">No review links created yet.</p>
          ) : null}
          {sortedLinks.map((link) => {
            const revoked = Boolean(link.revokedAt);
            const expired = Boolean(link.expired);
            const warning = !revoked && !expired && isSoon(link.deadlineAt);
            const reopened = !revoked && expired && link.overrideLock;
            const locked = !revoked && expired && !link.overrideLock;
            const statusLabel = revoked
              ? 'Revoked'
              : reopened
                ? 'Reopened'
                : locked
                  ? 'Locked'
                  : 'Active';

            return (
              <div key={link.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{formatReviewTarget(link.slug)}</Badge>
                    <Badge variant={revoked || locked ? 'secondary' : 'default'}>{statusLabel}</Badge>
                    {warning ? <Badge variant="secondary">Less than 24h left</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allowFullCommentAccess ? (
                      <Button variant="outline" size="sm" asChild disabled={!expired || revoked}>
                        <a href={`/admin/review-export/${encodeURIComponent(link.tokenId)}`}>
                          <FileDown className="mr-2 size-4" />
                          Export PDF
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={revoked || !expired}
                      onClick={() => void toggleOverride(link.id, !link.overrideLock)}
                    >
                      <LockOpen className="mr-2 size-4" />
                      {link.overrideLock ? 'Restore Lock' : 'Reopen Review'}
                    </Button>
                    <Button variant="outline" size="sm" disabled={revoked} onClick={() => void revoke(link.id)}>
                      <ShieldOff className="mr-2 size-4" />
                      Revoke
                    </Button>
                  </div>
                </div>
                <dl className="mt-3 grid gap-1 text-xs text-[var(--vd-muted-fg)]">
                  <div>
                    <dt className="inline font-medium text-foreground">Deadline:</dt> {formatDate(link.deadlineAt)}
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Created:</dt> {formatDate(link.createdAt)}
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Recipient:</dt> {link.recipientEmail || '-'}
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Email sent:</dt>{' '}
                    {link.lastSentAt ? formatDate(link.lastSentAt) : 'Not sent'}
                  </div>
                  <div>
                    <dt className="inline font-medium text-foreground">Reminder sent:</dt>{' '}
                    {link.reminderSentAt ? formatDate(link.reminderSentAt) : 'Not sent'}
                  </div>
                </dl>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
