'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type PageRow = {
  slug: string;
  title?: string;
  updatedAt?: string;
  publishedAt?: string;
  draftUpdatedAt?: string;
};

function liveHref(slug: string) {
  if (slug === 'home') return '/';
  return `/${slug}`;
}

export function PagesManager() {
  const [pages, setPages] = useState<PageRow[] | null>(null);
  const [slug, setSlug] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/pages/list');
    const data = await res.json().catch(() => null);
    if (res.ok) {
      setPages(data?.pages || []);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial page list fetch
    void load();
  }, [load]);

  const normalizedSlug = useMemo(() => slug.trim().toLowerCase(), [slug]);

  const create = useCallback(async () => {
    setBusy(true);
    setMessage('');
    const res = await fetch('/api/pages/create', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: normalizedSlug })
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || 'Create failed');
      setBusy(false);
      return;
    }
    setSlug('');
    setMessage(`Created ${data.slug}`);
    await load();
    setBusy(false);
  }, [load, normalizedSlug]);

  const remove = useCallback(
    async (pageSlug: string) => {
      if (!window.confirm(`Delete page "${pageSlug}"? This cannot be undone.`)) return;
      setBusy(true);
      setMessage('');
      const res = await fetch('/api/pages/delete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ slug: pageSlug })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(data?.error || 'Delete failed');
        setBusy(false);
        return;
      }
      setMessage(`Deleted ${pageSlug}`);
      await load();
      setBusy(false);
    },
    [load]
  );

  if (!pages) {
    return <p className="text-sm text-[var(--vd-muted-fg)]">Loading pages...</p>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Pages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              placeholder="new-page-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <Button onClick={() => void create()} disabled={busy || !normalizedSlug}>
              Create page
            </Button>
            {message ? <span className="text-xs text-[var(--vd-muted-fg)]">{message}</span> : null}
          </div>
        </CardContent>
      </Card>

      {pages.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No pages found</CardTitle>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {pages.map((page) => {
            const live = liveHref(page.slug);
            const editHref = `/edit/${encodeURIComponent(page.slug)}`;
            const previewHref = `/preview/${encodeURIComponent(page.slug)}`;
            const isPublished = Boolean(page.publishedAt);
            return (
              <Card key={page.slug}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{page.slug}</CardTitle>
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">
                      {page.publishedAt ? 'Published' : 'Draft'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    {page.draftUpdatedAt
                      ? `Draft updated ${new Date(page.draftUpdatedAt).toLocaleString()}`
                      : 'No draft yet'}
                    {page.publishedAt
                      ? ` • Published ${new Date(page.publishedAt).toLocaleString()}`
                      : null}
                  </p>
                  <p className="text-xs text-[var(--vd-muted-fg)]">
                    Live URL: {live}
                    {isPublished ? '' : ' (not published)'}
                  </p>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={editHref}>Edit</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={previewHref} target="_blank" rel="noreferrer">
                      Preview
                    </Link>
                  </Button>
                  {isPublished ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={live} target="_blank" rel="noreferrer">
                        View live
                      </Link>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      View live
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={busy || page.slug === 'home'}
                    onClick={() => void remove(page.slug)}
                  >
                    Delete
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
