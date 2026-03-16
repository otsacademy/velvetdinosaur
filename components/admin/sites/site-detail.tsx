"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type SiteSummary = {
  slug: string;
  domain: string;
  port: number | null;
  envPath: string;
  envExists: boolean;
  env: Record<string, string>;
};

type JobRow = {
  id: string;
  status: 'queued' | 'running' | 'done';
  createdAt: string;
  site: { slug: string; domain: string };
};

type Props = {
  slug: string;
  site: SiteSummary;
  jobs: JobRow[];
};

export function SiteDetail({ slug, site, jobs }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState('');

  const deleteSite = async () => {
    if (!site) return;
    const confirmed = window.confirm(
      `Delete "${site.slug}"? This removes nginx and runtime config and deletes the site files.`
    );
    if (!confirmed) return;
    setDeleting(true);
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
      setDeleting(false);
      return;
    }
    router.push('/admin/sites');
  }

  const siteJobs = jobs.filter((job) => job.site.slug === slug).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{site.slug}</h1>
          <p className="text-sm text-[var(--vd-muted-fg)]">{site.domain || '—'}</p>
          {message ? <p className="text-xs text-[var(--vd-muted-fg)]">{message}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/sites">Back</Link>
          </Button>
          {site.domain ? (
            <Button asChild>
              <Link href={`https://${site.domain}`} target="_blank" rel="noreferrer">
                Open site
              </Link>
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="border-red-300 text-red-600 hover:bg-red-50"
            onClick={() => void deleteSite()}
            disabled={deleting}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--vd-muted-fg)]">Domain</span>
            <span>{site.domain || '—'}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--vd-muted-fg)]">Port</span>
            <Badge className="bg-white text-[var(--vd-muted-fg)]">
              {site.port ?? '—'}
            </Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[var(--vd-muted-fg)]">Env file</span>
            <span className="truncate text-xs">{site.envPath}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Env summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {site.envExists ? (
            Object.keys(site.env).length === 0 ? (
              <p className="text-[var(--vd-muted-fg)]">No safe env keys found.</p>
            ) : (
              <div className="grid gap-2">
                {Object.entries(site.env).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between gap-4">
                    <span className="text-xs text-[var(--vd-muted-fg)]">{key}</span>
                    <span className="text-xs">{value}</span>
                  </div>
                ))}
              </div>
            )
          ) : (
            <p className="text-[var(--vd-muted-fg)]">Env file not found.</p>
          )}
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Install jobs</h2>
        {siteJobs.length === 0 ? (
          <p className="text-sm text-[var(--vd-muted-fg)]">No jobs for this site yet.</p>
        ) : (
          <div className="grid gap-2">
            {siteJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-medium">{job.id}</p>
                    <p className="text-xs text-[var(--vd-muted-fg)]">{job.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">{job.status}</Badge>
                    <Button asChild size="sm" variant="outline">
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
