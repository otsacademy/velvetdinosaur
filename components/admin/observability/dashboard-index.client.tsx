"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BellRing } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Observability</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated dashboards powered by Prometheus exporter data.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <Button asChild variant="outline" size="sm">
            <Link href="/edit">
              <ArrowLeft className="h-4 w-4" />
              Editor
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/admin/alertmanager">
              <BellRing className="h-4 w-4" />
              Active alerts
            </Link>
          </Button>
          <Input
            className="w-full sm:w-72"
            placeholder="Search dashboards or tags..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-sm font-semibold text-foreground">Filter by tag</p>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {Object.entries(tagGroups).map(([group, tags]) => (
            <div key={group} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
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
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No dashboards match your filters.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((dashboard) => (
            <div
              key={dashboard.slug}
              className="rounded-lg border border-border bg-card p-5 shadow-sm transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{dashboard.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{dashboard.description}</p>
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
