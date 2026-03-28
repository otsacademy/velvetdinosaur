'use client';

import { useMemo, useState } from 'react';
import { Loader2, Plus, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';
import {
  deriveSupportSearchResults,
  formatDateTime,
  type SupportArticleSummary,
  type SupportDevelopmentHoursPayload,
  type SupportDocSummary,
  type SupportGlobalSearchResult,
  type SupportSystemStatusPayload,
  type SupportTicketStatus,
  type SupportTicketSummary
} from '@/components/demo/support/demo-support.shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const EMPTY_DOC_FORM = {
  title: '',
  description: '',
  module: '',
  category: '',
  linkType: 'view' as 'view' | 'download',
  url: ''
};

const EMPTY_ARTICLE_FORM = {
  title: '',
  summary: '',
  bodyText: '',
  category: '',
  module: ''
};

function round(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
}

function statusClassName(status: SupportSystemStatusPayload['checks'][number]['status']) {
  if (status === 'operational') return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  if (status === 'degraded') return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
  if (status === 'outage') return 'border-rose-500/40 bg-rose-500/15 text-rose-700 dark:text-rose-300';
  return 'border-border bg-muted text-muted-foreground';
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}

function SearchPanel({
  results,
  query,
  onQueryChange,
  onResultSelect
}: {
  results: SupportGlobalSearchResult[];
  query: string;
  onQueryChange: (value: string) => void;
  onResultSelect: (result: SupportGlobalSearchResult) => void;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Global Portal Search</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search tickets, docs, and articles" className="pl-8" />
        </div>

        {!query.trim() ? (
          <p className="text-sm text-muted-foreground">Type to search across tickets, documents, and support articles.</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matching records found.</p>
        ) : (
          <div className="space-y-2">
            {results.map((result) => (
              <button
                key={`${result.kind}-${result.id}`}
                type="button"
                className="w-full rounded-md border p-3 text-left hover:bg-muted/40"
                onClick={() => onResultSelect(result)}
              >
                <p className="text-xs uppercase text-muted-foreground">{result.kind}</p>
                <p className="font-medium">{result.title}</p>
                <p className="line-clamp-1 text-sm text-muted-foreground">{result.subtitle}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(result.updatedAt)}</p>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DocumentsPanel({
  items,
  onCreate
}: {
  items: SupportDocSummary[];
  onCreate: (input: { title: string; description: string; module: string; category: string; linkType: 'view' | 'download'; url: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState(EMPTY_DOC_FORM);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      [item.title, item.description, item.category, item.module, item.tags.join(' ')].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [items, query]);

  async function submit() {
    if (!form.title.trim() || !form.url.trim()) {
      toast.error('Title and URL are required.');
      return;
    }
    setIsCreating(true);
    try {
      onCreate({
        title: form.title.trim(),
        description: form.description.trim(),
        module: form.module.trim(),
        category: form.category.trim(),
        linkType: form.linkType,
        url: form.url.trim()
      });
      setForm(EMPTY_DOC_FORM);
      toast.info('This document only exists in the demonstration session.');
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
            <Select value={form.linkType} onValueChange={(value) => setForm((prev) => ({ ...prev, linkType: value as 'view' | 'download' }))}>
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
              placeholder="#support-doc-custom"
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
              placeholder="Booking"
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
            <Button onClick={() => void submit()} disabled={isCreating}>
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
            <CardDescription>Search and review support documents.</CardDescription>
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
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr key={item.id} id={`support-doc-${item.id}`} className="border-t">
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.title}</p>
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

function ArticlePanel({
  items,
  type,
  title,
  description,
  onCreate
}: {
  items: SupportArticleSummary[];
  type: 'knowledge' | 'announcement' | 'feature';
  title: string;
  description: string;
  onCreate: (input: { type: 'knowledge' | 'announcement' | 'feature'; title: string; summary: string; bodyText: string; category: string; module: string }) => void;
}) {
  const [query, setQuery] = useState('');
  const [form, setForm] = useState(EMPTY_ARTICLE_FORM);
  const [isCreating, setIsCreating] = useState(false);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const scoped = items.filter((item) => item.type === type);
    if (!normalizedQuery) return scoped;
    return scoped.filter((item) =>
      [item.title, item.summary, item.bodyText, item.category, item.module, item.tags.join(' ')].join(' ').toLowerCase().includes(normalizedQuery)
    );
  }, [items, query, type]);

  async function submit() {
    if (!form.title.trim()) {
      toast.error('Title is required.');
      return;
    }

    setIsCreating(true);
    try {
      onCreate({
        type,
        title: form.title.trim(),
        summary: form.summary.trim(),
        bodyText: form.bodyText.trim(),
        category: form.category.trim(),
        module: form.module.trim()
      });
      setForm(EMPTY_ARTICLE_FORM);
      toast.info('This article only exists in the demonstration session.');
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
              placeholder="Booking"
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
            <Button onClick={() => void submit()} disabled={isCreating}>
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
            {filteredItems.length === 0 ? (
              <div className="rounded-md border p-6 text-center text-muted-foreground">No entries found.</div>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} id={`support-article-${item.slug}`} className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{item.title}</p>
                    <Badge variant="outline" className="text-xs uppercase">{item.type}</Badge>
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

export function DemoSupportToolkit({
  tickets,
  documents,
  articles,
  systemStatus,
  developmentHours,
  onSelectTicket,
  onCreateDocument,
  onCreateArticle,
  onRefreshSystemStatus,
  onRefreshDevelopmentHours
}: {
  tickets: SupportTicketSummary[];
  documents: SupportDocSummary[];
  articles: SupportArticleSummary[];
  systemStatus: SupportSystemStatusPayload;
  developmentHours: SupportDevelopmentHoursPayload;
  onSelectTicket: (ticketId: string, status?: SupportTicketStatus) => void;
  onCreateDocument: (input: { title: string; description: string; module: string; category: string; linkType: 'view' | 'download'; url: string }) => void;
  onCreateArticle: (input: { type: 'knowledge' | 'announcement' | 'feature'; title: string; summary: string; bodyText: string; category: string; module: string }) => void;
  onRefreshSystemStatus: () => void;
  onRefreshDevelopmentHours: () => void;
}) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => deriveSupportSearchResults(query, tickets, documents, articles), [articles, documents, query, tickets]);

  function selectResult(result: SupportGlobalSearchResult) {
    if (result.kind === 'ticket') {
      onSelectTicket(result.id, result.status as SupportTicketStatus);
      return;
    }

    const element = document.getElementById(result.link);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      toast.info('Showing the seeded demo resource inside this workspace.');
      return;
    }

    toast.info('That resource belongs to the demonstration session only.');
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <SearchPanel results={results} query={query} onQueryChange={setQuery} onResultSelect={selectResult} />
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Quick Help</CardTitle>
            <CardDescription>Shortcuts for day-to-day support triage.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>Use Global Portal Search to jump straight to a ticket, support document, or knowledge note.</p>
            <p>System Status and Development Schedule are seeded snapshots so the demo stays realistic without hitting live integrations.</p>
            <p>Any new document, article, or reply is local to this demonstration session and resets when the page reloads.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>System Status</CardTitle>
                <CardDescription>
                  Source: {systemStatus.source}
                  {systemStatus.fetchedAt ? ` · Updated ${new Date(systemStatus.fetchedAt).toLocaleString()}` : ''}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={onRefreshSystemStatus}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                <Stat label="Checks" value={systemStatus.summary.totalChecks} />
                <Stat label="Operational" value={systemStatus.summary.operational} />
                <Stat label="Degraded" value={systemStatus.summary.degraded} />
                <Stat label="Outage" value={systemStatus.summary.outage} />
                <Stat label="Unknown" value={systemStatus.summary.unknown} />
                <Stat label="Incidents" value={systemStatus.summary.incidents} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Checks</CardTitle>
              <CardDescription>Latest health checks from the seeded status board.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Service</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Detail</th>
                      <th className="px-3 py-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemStatus.checks.map((check) => (
                      <tr key={check.key} className="border-t">
                        <td className="px-3 py-2 font-medium">{check.label}</td>
                        <td className="px-3 py-2">
                          <Badge className={statusClassName(check.status)}>{check.status}</Badge>
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">{check.detail || '—'}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {check.updatedAt ? new Date(check.updatedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Incidents</CardTitle>
              <CardDescription>Active and recently resolved incidents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {systemStatus.incidents.length === 0 ? (
                <p className="text-sm text-muted-foreground">No incidents reported.</p>
              ) : (
                systemStatus.incidents.map((incident) => (
                  <div key={incident.id} className="rounded-md border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{incident.title}</p>
                      <Badge>{incident.status}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{incident.detail || 'No incident details.'}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Started: {incident.startedAt ? new Date(incident.startedAt).toLocaleString() : '—'} · Resolved:{' '}
                      {incident.resolvedAt ? new Date(incident.resolvedAt).toLocaleString() : '—'}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>

        <section className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle>Development Schedule</CardTitle>
                <CardDescription>
                  Source: {developmentHours.source} · {developmentHours.totals.period}
                  {developmentHours.fetchedAt ? ` · Updated ${new Date(developmentHours.fetchedAt).toLocaleString()}` : ''}
                </CardDescription>
              </div>
              <Button variant="outline" onClick={onRefreshDevelopmentHours}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat label="Planned" value={round(developmentHours.totals.planned)} />
                <Stat label="Used" value={round(developmentHours.totals.used)} />
                <Stat label="Remaining" value={round(developmentHours.totals.remaining)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Module Breakdown</CardTitle>
              <CardDescription>Planned vs used development hours by module.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-left">
                    <tr>
                      <th className="px-3 py-2 font-medium">Module</th>
                      <th className="px-3 py-2 font-medium">Planned</th>
                      <th className="px-3 py-2 font-medium">Used</th>
                      <th className="px-3 py-2 font-medium">Remaining</th>
                      <th className="px-3 py-2 font-medium">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {developmentHours.items.map((item, index) => (
                      <tr key={`${item.module}-${index}`} className="border-t">
                        <td className="px-3 py-2 font-medium">{item.module}</td>
                        <td className="px-3 py-2">{round(item.planned)}</td>
                        <td className="px-3 py-2">{round(item.used)}</td>
                        <td className="px-3 py-2">{round(item.remaining)}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          {item.updatedAt ? new Date(item.updatedAt).toLocaleString() : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      <DocumentsPanel items={documents} onCreate={onCreateDocument} />

      <div className="grid gap-6 xl:grid-cols-3">
        <ArticlePanel
          items={articles}
          type="knowledge"
          title="Knowledge Base"
          description="Practical guides and repeatable support notes."
          onCreate={onCreateArticle}
        />
        <ArticlePanel
          items={articles}
          type="announcement"
          title="Announcements"
          description="Updates about support coverage, releases, and planning windows."
          onCreate={onCreateArticle}
        />
        <ArticlePanel
          items={articles}
          type="feature"
          title="Feature Notes"
          description="Short release notes and small product improvements."
          onCreate={onCreateArticle}
        />
      </div>
    </section>
  );
}
