"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SiteRow = {
  slug: string;
  domain: string;
  port: number | null;
};

type JobRow = {
  id: string;
  status: 'queued' | 'running' | 'done';
  createdAt: string;
  site: { slug: string; domain: string };
};

export function SitesDashboard({ sites, jobs }: { sites: SiteRow[]; jobs: JobRow[] }) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const recentJobs = useMemo(() => (jobs || []).slice(0, 6), [jobs]);

  const deleteSite = async (site: SiteRow) => {
    const confirmed = window.confirm(
      `Delete "${site.slug}"? This removes nginx and runtime config and deletes the site files.`
    );
    if (!confirmed) return;
    setDeletingSlug(site.slug);
    setMessage('');
    const params = new URLSearchParams({ purge: 'true' });
    if (site.domain) params.set('domain', site.domain);
    const res = await fetch(
      `/api/installer/sites/${encodeURIComponent(site.slug)}?${params.toString()}`,
      { method: 'DELETE' }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      setMessage(data?.error || 'Delete failed.');
      setDeletingSlug(null);
      return;
    }
    setMessage(`Deleted ${site.slug}.`);
    router.refresh();
    setDeletingSlug(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Sites</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">
            View installed websites and create new ones.
          </p>
          {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
        </div>
        <Button asChild>
          <Link href="/admin/sites/new">Add website</Link>
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No sites yet</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-[var(--vd-muted-fg)]">
            Create your first site to see it listed here.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {sites.map((site) => (
            <Card key={site.slug}>
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">{site.slug}</CardTitle>
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">
                    {site.port ? `:${site.port}` : 'no port'}
                  </Badge>
                </div>
                <p className="text-xs text-[var(--vd-muted-fg)]">{site.domain || '—'}</p>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/sites/${encodeURIComponent(site.slug)}`}>
                    View details
                  </Link>
                </Button>
                {site.domain ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`https://${site.domain}`} target="_blank" rel="noreferrer">
                      Open site
                    </Link>
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => void deleteSite(site)}
                  disabled={deletingSlug === site.slug}
                >
                  {deletingSlug === site.slug ? 'Deleting…' : 'Delete'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Recent installs</h2>
        {recentJobs.length === 0 ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">No installer jobs yet.</p>
        ) : (
          <div className="grid gap-2">
            {recentJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium">{job.site.slug}</p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">{job.site.domain}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">{job.status}</Badge>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/sites/jobs/${encodeURIComponent(job.id)}`}>
                        View log
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
