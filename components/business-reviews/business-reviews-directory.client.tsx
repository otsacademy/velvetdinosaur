'use client';

import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Loader2, MapPin, Search } from 'lucide-react';
import { GoogleReviews } from '@/components/business-reviews/google-reviews.client';
import { TripadvisorWidget } from '@/components/business-reviews/tripadvisor-widget.client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ExternalReviewBusinessData } from '@/lib/business-reviews/shared';

export function BusinessReviewsDirectory({
  tripadvisorWidgetsEnabled
}: {
  tripadvisorWidgetsEnabled: boolean;
}) {
  const [businesses, setBusinesses] = useState<ExternalReviewBusinessData[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const controller = new AbortController();
    async function loadBusinesses() {
      try {
        const response = await fetch('/api/business-reviews', {
          cache: 'no-store',
          signal: controller.signal
        });
        const payload = (await response.json().catch(() => ({}))) as {
          businesses?: ExternalReviewBusinessData[];
          error?: string;
        };
        if (!response.ok) throw new Error(payload.error || 'Could not load the business directory.');
        setBusinesses(payload.businesses || []);
        setLoadError('');
      } catch (error) {
        if (controller.signal.aborted) return;
        setBusinesses([]);
        setLoadError(error instanceof Error ? error.message : 'Could not load the business directory.');
      }
    }
    void loadBusinesses();
    return () => controller.abort();
  }, [reloadKey]);

  const categories = useMemo(
    () => ['All', ...Array.from(new Set((businesses || []).map((business) => business.category).filter(Boolean))).sort()],
    [businesses]
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (businesses || []).filter((business) => {
      const matchesCategory = category === 'All' || business.category === category;
      const haystack = `${business.name} ${business.location} ${business.category} ${business.summary}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
    });
  }, [businesses, category, query]);

  if (businesses === null) {
    return (
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-2 rounded-xl border border-[var(--vd-border)] bg-[var(--vd-bg)] p-8 text-sm font-medium shadow-sm" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading business reviews…
      </div>
    );
  }

  if (loadError) {
    return (
      <div role="alert" className="mx-auto max-w-2xl rounded-xl border border-destructive/35 bg-[var(--vd-bg)] p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold">The directory could not be loaded</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">{loadError}</p>
        <Button className="mt-4" variant="outline" onClick={() => { setBusinesses(null); setReloadKey((value) => value + 1); }}>Try again</Button>
      </div>
    );
  }

  if (!businesses.length) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-[var(--vd-border)] bg-[var(--vd-bg)] p-8 text-center shadow-sm">
        <h2 className="text-xl font-bold">Reviews are being added</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">The first businesses will appear here soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-[var(--vd-border)] bg-[var(--vd-bg)] p-4 shadow-sm md:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vd-muted-fg)]" aria-hidden="true" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="min-h-11 pl-10" placeholder="Search businesses or places" aria-label="Search businesses" />
        </div>
        {categories.length > 2 ? (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Filter by category">
            {categories.map((item) => (
              <Button key={item} type="button" size="sm" variant={category === item ? 'default' : 'outline'} aria-pressed={category === item} onClick={() => setCategory(item)}>
                {item}
              </Button>
            ))}
          </div>
        ) : null}
      </div>

      {filtered.length ? filtered.map((business) => (
        <BusinessReviewEntry
          key={business.id}
          business={business}
          tripadvisorWidgetsEnabled={tripadvisorWidgetsEnabled}
        />
      )) : (
        <div className="rounded-xl border border-dashed border-[var(--vd-border)] p-10 text-center">
          <h2 className="font-semibold">No matching businesses</h2>
          <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">Try another search or clear the category filter.</p>
          <Button className="mt-4" variant="outline" onClick={() => { setQuery(''); setCategory('All'); }}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}

function BusinessReviewEntry({
  business,
  tripadvisorWidgetsEnabled
}: {
  business: ExternalReviewBusinessData;
  tripadvisorWidgetsEnabled: boolean;
}) {
  const hasTripadvisor = Boolean(business.tripadvisorLocationId || business.tripadvisorUrl);

  return (
    <article id={business.slug} className="scroll-mt-24 overflow-hidden rounded-xl border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-sm">
      <div className="border-b border-[var(--vd-border)] p-6 md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="max-w-3xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {business.category ? <Badge variant="secondary">{business.category}</Badge> : null}
              {business.googlePlaceId ? <Badge variant="outline">Google Reviews</Badge> : null}
              {hasTripadvisor ? <Badge variant="outline">Tripadvisor</Badge> : null}
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--vd-fg)] md:text-3xl">{business.name}</h2>
            {business.location ? <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--vd-muted-fg)]"><MapPin className="h-4 w-4" aria-hidden="true" /> {business.location}</p> : null}
            {business.summary ? <p className="mt-4 max-w-[70ch] text-base leading-7 text-[var(--vd-muted-fg)]">{business.summary}</p> : null}
          </div>
          {business.websiteUrl ? (
            <Button asChild variant="outline">
              <a href={business.websiteUrl} target="_blank" rel="noopener noreferrer">Visit website <ExternalLink className="h-4 w-4" /></a>
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-2">
        {business.googlePlaceId ? (
          <section aria-labelledby={`${business.slug}-google`}>
            <h3 id={`${business.slug}-google`} className="mb-3 text-base font-bold">Google Reviews</h3>
            <GoogleReviews slug={business.slug} name={business.name} placeId={business.googlePlaceId} />
          </section>
        ) : null}
        {hasTripadvisor ? (
          <section aria-labelledby={`${business.slug}-tripadvisor`}>
            <h3 id={`${business.slug}-tripadvisor`} className="mb-3 text-base font-bold">Tripadvisor Reviews</h3>
            <TripadvisorWidget
              locationId={business.tripadvisorLocationId}
              listingUrl={business.tripadvisorUrl}
              enabled={tripadvisorWidgetsEnabled}
            />
          </section>
        ) : null}
      </div>
    </article>
  );
}
