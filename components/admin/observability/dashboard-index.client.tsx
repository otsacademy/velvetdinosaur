"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, X } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminRouteNav } from '@/components/admin/admin-route-nav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type DashboardMeta = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
};

type TagGroups = Record<string, string[]>;

type Props = {
  dashboards: DashboardMeta[];
  tagGroups: TagGroups;
};

export function DashboardIndex({ dashboards, tagGroups }: Props) {
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const toggleTag = (tag: string) => {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dashboards.filter((dashboard) => {
      const matchesQuery =
        !q ||
        dashboard.title.toLowerCase().includes(q) ||
        dashboard.description.toLowerCase().includes(q) ||
        dashboard.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesTags =
        activeTags.length === 0 || activeTags.some((tag) => dashboard.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [activeTags, dashboards, query]);

  return (
    <AdminPageShell
      header={
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">
                  Observability
                </h1>
                <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">
                  Curated dashboards powered by Prometheus exporter data.
                </p>
              </div>
              <Badge className="text-[11px]">
                Showing {filtered.length} of {dashboards.length} dashboards
              </Badge>
            </div>
          </div>
          <AdminRouteNav current="observability" />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" />
              <Input
                className="pl-9"
                placeholder="Search dashboards or tags"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            {query || activeTags.length ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery('');
                  setActiveTags([]);
                }}
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
      }
    >
      <section className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5">
        <p className="text-sm font-semibold text-[var(--vd-fg)]">Filter by tag</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {Object.entries(tagGroups).map(([group, tags]) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--vd-muted-fg)]">
                {group}
              </p>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isActive = activeTags.includes(tag);
                  return (
                    <Button
                      key={tag}
                      variant={isActive ? 'default' : 'outline'}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {filtered.length === 0 ? (
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-8 text-center text-sm text-[var(--vd-muted-fg)]">
          No dashboards match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((dashboard) => (
            <article
              key={dashboard.slug}
              className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-5 transition-colors hover:border-[color-mix(in_oklch,var(--vd-primary)_40%,var(--vd-border))]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-[var(--vd-fg)]">{dashboard.title}</h2>
                  <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{dashboard.description}</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link href={`/admin/observability/dashboards/${dashboard.slug}`}>
                    Open
                  </Link>
                </Button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {dashboard.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </AdminPageShell>
  );
}
