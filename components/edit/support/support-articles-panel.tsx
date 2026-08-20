'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime, readJson, type SupportArticleSummary } from '@/components/edit/support/support-workspace.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const EMPTY_FORM = {
  title: '',
  summary: '',
  bodyText: '',
  category: '',
  module: ''
};

type SupportArticlesPanelProps = {
  type: 'knowledge' | 'announcement' | 'feature';
  title: string;
  description: string;
};

export function SupportArticlesPanel({ type, title, description }: SupportArticlesPanelProps) {
  const [items, setItems] = useState<SupportArticleSummary[]>([]);
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('type', type);
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '120');

      const response = await fetch(`/api/admin/support/articles?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as { items?: SupportArticleSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load articles');
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load articles');
    } finally {
      setIsLoading(false);
    }
  }, [query, type]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function createArticle() {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/support/articles', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          type,
          summary: form.summary,
          bodyText: form.bodyText,
          category: form.category,
          module: form.module
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to save article');
      setForm(EMPTY_FORM);
      await load();
      toast.success('Article saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save article');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`support-article-title-${type}`}>Title</Label>
            <Input
              id={`support-article-title-${type}`}
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Article title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`support-article-category-${type}`}>Category</Label>
            <Input
              id={`support-article-category-${type}`}
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Support"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`support-article-module-${type}`}>Module</Label>
            <Input
              id={`support-article-module-${type}`}
              value={form.module}
              onChange={(event) => setForm((prev) => ({ ...prev, module: event.target.value }))}
              placeholder="Billing"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`support-article-summary-${type}`}>Summary</Label>
            <Textarea
              id={`support-article-summary-${type}`}
              rows={3}
              value={form.summary}
              onChange={(event) => setForm((prev) => ({ ...prev, summary: event.target.value }))}
              placeholder="Short summary"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor={`support-article-body-${type}`}>Body</Label>
            <Textarea
              id={`support-article-body-${type}`}
              rows={6}
              value={form.bodyText}
              onChange={(event) => setForm((prev) => ({ ...prev, bodyText: event.target.value }))}
              placeholder="Article content"
            />
          </div>
          <div>
            <Button onClick={() => void createArticle()} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Save {type}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Published {type}s</CardTitle>
            <CardDescription>Search and review published entries.</CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${type}s`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {isLoading ? (
              <div className="rounded-md border p-6 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                Loading articles...
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-muted-foreground">No entries found.</div>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <span className="text-xs uppercase text-muted-foreground">{item.type}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.summary || item.bodyText || '—'}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category || 'Uncategorized'} · {item.module || 'General'} · {formatDateTime(item.publishedAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
