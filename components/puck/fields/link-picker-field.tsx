'use client';

import { useMemo, useState } from 'react';
import type { CustomFieldRender } from '@puckeditor/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { slugToPathname } from '@/lib/site-pages';

type PageListItem = {
  slug: string;
  path?: string | null;
  title?: string | null;
};

async function fetchPages() {
  const res = await fetch('/api/pages/list');
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || 'Failed to load pages');
  const rawPages: unknown[] = Array.isArray(data?.pages) ? data.pages : [];
  return rawPages
    .map((item: unknown): PageListItem | null => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      const slug = typeof record.slug === 'string' ? record.slug.trim() : '';
      if (!slug) return null;
      const title = typeof record.title === 'string' ? record.title : null;
      return { slug, title };
    })
    .filter((item: PageListItem | null): item is PageListItem => item !== null);
}

function hrefForPage(page: { slug: string; path?: string | null }) {
  if (page.path) return `/${page.path}`;
  const mapped = slugToPathname(page.slug);
  if (mapped) return mapped;
  return page.slug === 'home' ? '/' : `/${page.slug}`;
}

export function LinkPickerField({
  value,
  onChange
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [pages, setPages] = useState<PageListItem[]>([]);
  const loadPages = async () => {
    setBusy(true);
    setError('');
    try {
      const items = await fetchPages();
      setPages(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pages');
    } finally {
      setBusy(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((page) => {
      const slug = typeof page.slug === 'string' ? page.slug.toLowerCase() : '';
      const title = typeof page.title === 'string' ? page.title.toLowerCase() : '';
      return slug.includes(q) || title.includes(q);
    });
  }, [pages, query]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={value || ''}
          placeholder="https://… or /about"
          onChange={(event) => onChange(event.target.value)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen((current) => {
              const nextOpen = !current;
              if (nextOpen && pages.length === 0 && !busy) {
                void loadPages();
              }
              return nextOpen;
            });
          }}
        >
          Pages
        </Button>
        {value ? (
          <Button type="button" variant="outline" onClick={() => onChange('')}>
            Clear
          </Button>
        ) : null}
      </div>

      {open ? (
        <Card className="bg-white/70">
          <CardHeader className="space-y-1">
            <CardTitle className="text-sm">Internal pages</CardTitle>
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--vd-muted-fg)]">
              <Badge>Private</Badge>
              <span>Pick a page slug to link internally.</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input
              value={query}
              placeholder="Search pages…"
              onChange={(event) => setQuery(event.target.value)}
            />
            {busy ? (
              <p className="text-xs text-[var(--vd-muted-fg)]">Loading pages…</p>
            ) : error ? (
              <p className="text-xs text-rose-700">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="text-xs text-[var(--vd-muted-fg)]">No pages found.</p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {filtered.map((page) => {
                  const href = hrefForPage(page);
                  const label = typeof page.title === 'string' && page.title.trim() ? page.title : page.slug;
                  return (
                    <button
                      key={page.slug}
                      type="button"
                      className="rounded-md border border-[var(--vd-border)] bg-white p-3 text-left text-sm hover:bg-[var(--vd-muted)]"
                      onClick={() => {
                        onChange(href);
                        setOpen(false);
                        setQuery('');
                      }}
                    >
                      <div className="font-medium">{label}</div>
                      <div className="mt-1 text-xs text-[var(--vd-muted-fg)]">{href}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function linkPickerField() {
  const render: CustomFieldRender<string> = ({ value, onChange }) => (
    <LinkPickerField value={value || ''} onChange={onChange} />
  );
  return {
    type: 'custom' as const,
    render
  };
}
