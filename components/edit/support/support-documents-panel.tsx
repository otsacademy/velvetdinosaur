'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { formatDateTime, readJson, type SupportDocSummary } from '@/components/edit/support/support-workspace.shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EMPTY_FORM = {
  title: '',
  description: '',
  module: '',
  category: '',
  linkType: 'view' as 'view' | 'download',
  url: ''
};

export function SupportDocumentsPanel() {
  const [items, setItems] = useState<SupportDocSummary[]>([]);
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      params.set('limit', '120');

      const response = await fetch(`/api/admin/support/docs?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include'
      });
      const payload = (await readJson(response)) as { items?: SupportDocSummary[]; error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to load documents');
      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void load();
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [load]);

  async function createDocument() {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Title and URL are required.');
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/support/docs', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          module: form.module,
          category: form.category,
          linkType: form.linkType,
          url: form.url
        })
      });
      const payload = (await readJson(response)) as { error?: string };
      if (!response.ok) throw new Error(payload.error || 'Unable to save document');
      setForm(EMPTY_FORM);
      await load();
      toast.success('Document saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save document');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Documents</CardTitle>
          <CardDescription>Manage downloadable guides, links, and support resources.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <Label htmlFor="support-doc-title">Title</Label>
            <Input
              id="support-doc-title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Setup guide"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-doc-link-type">Type</Label>
            <Select
              value={form.linkType}
              onValueChange={(value) => setForm((prev) => ({ ...prev, linkType: value as 'view' | 'download' }))}
            >
              <SelectTrigger id="support-doc-link-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Link</SelectItem>
                <SelectItem value="download">Download Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="support-doc-url">URL</Label>
            <Input
              id="support-doc-url"
              value={form.url}
              onChange={(event) => setForm((prev) => ({ ...prev, url: event.target.value }))}
              placeholder="https://..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-doc-category">Category</Label>
            <Input
              id="support-doc-category"
              value={form.category}
              onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
              placeholder="Onboarding"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="support-doc-module">Module</Label>
            <Input
              id="support-doc-module"
              value={form.module}
              onChange={(event) => setForm((prev) => ({ ...prev, module: event.target.value }))}
              placeholder="CRM"
            />
          </div>
          <div className="space-y-2 md:col-span-2 lg:col-span-3">
            <Label htmlFor="support-doc-description">Description</Label>
            <Textarea
              id="support-doc-description"
              value={form.description}
              rows={3}
              onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Short guidance for this document"
            />
          </div>
          <div>
            <Button onClick={() => void createDocument()} disabled={isCreating}>
              {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              Save Document
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Library</CardTitle>
            <CardDescription>Search and open existing support documents.</CardDescription>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left">
                <tr>
                  <th className="px-3 py-2 font-medium">Title</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Module</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Published</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                      Loading documents...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">
                        <a href={item.url} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">
                          {item.title}
                        </a>
                        {item.description ? <p className="line-clamp-1 text-xs text-muted-foreground">{item.description}</p> : null}
                      </td>
                      <td className="px-3 py-2">{item.category || '—'}</td>
                      <td className="px-3 py-2">{item.module || '—'}</td>
                      <td className="px-3 py-2 capitalize">{item.linkType}</td>
                      <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(item.publishedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
