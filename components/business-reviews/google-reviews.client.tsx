'use client';

import { useState } from 'react';
import { ExternalLink, Loader2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { GooglePlaceReviewsData, GoogleReviewData } from '@/lib/business-reviews/shared';

function googleMapsSearchUrl(placeId: string, name: string) {
  const params = new URLSearchParams({ api: '1', query: name, query_place_id: placeId });
  return `https://www.google.com/maps/search/?${params.toString()}`;
}

function StarRating({ rating, label }: { rating: number; label: string }) {
  const rounded = Math.round(rating);
  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      <span className="inline-flex text-[var(--vd-primary)]" aria-hidden="true">
        {Array.from({ length: 5 }, (_, index) => (
          <Star key={index} className="h-4 w-4" fill={index < rounded ? 'currentColor' : 'none'} />
        ))}
      </span>
      <span className="font-semibold tabular-nums text-[var(--vd-fg)]">{rating.toFixed(1)}</span>
    </span>
  );
}

function formatVisitDate(visitDate: GoogleReviewData['visitDate']) {
  if (!visitDate) return '';
  const date = new Date(Date.UTC(visitDate.year, visitDate.month - 1, 1));
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
}

function ReviewItem({ review, placeUrl }: { review: GoogleReviewData; placeUrl: string }) {
  const sourceUrl = review.googleMapsUri || placeUrl;
  const visitLabel = formatVisitDate(review.visitDate);
  const translated = Boolean(review.originalText && review.text && review.originalText !== review.text);

  return (
    <article className="border-t border-[var(--vd-border)] py-5 first:border-t-0 first:pt-0">
      <div className="flex items-start gap-3">
        {review.author.photoUri ? (
          // Google supplies this avatar URL with the required author attribution.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={review.author.photoUri} alt="" width={40} height={40} loading="lazy" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--vd-muted)] text-sm font-semibold text-[var(--vd-muted-fg)]" aria-hidden="true">
            {review.author.displayName.slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              {review.author.uri ? (
                <a href={review.author.uri} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--vd-fg)] underline-offset-4 hover:underline">
                  {review.author.displayName}
                </a>
              ) : (
                <p className="font-semibold text-[var(--vd-fg)]">{review.author.displayName}</p>
              )}
              <p className="text-xs text-[var(--vd-muted-fg)]">
                {review.relativePublishTimeDescription || 'Google Maps review'}
                {visitLabel ? ` · Visited ${visitLabel}` : ''}
              </p>
            </div>
            <StarRating rating={review.rating} label={`${review.rating} out of 5 stars`} />
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[var(--vd-fg)]">
            {review.text || 'This reviewer left a star rating without written feedback.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            {translated ? <span className="text-[var(--vd-muted-fg)]">Translated by Google</span> : null}
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-[var(--vd-primary)] underline-offset-4 hover:underline">
              View on Google Maps <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

export function GoogleReviews({ slug, name, placeId }: { slug: string; name: string; placeId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const [place, setPlace] = useState<GooglePlaceReviewsData | null>(null);
  const [error, setError] = useState('');
  const fallbackUrl = googleMapsSearchUrl(placeId, name);

  async function loadReviews() {
    if (state === 'loading') return;
    setState('loading');
    setError('');
    try {
      const response = await fetch(`/api/business-reviews/google/${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const payload = (await response.json().catch(() => ({}))) as { place?: GooglePlaceReviewsData; error?: string };
      if (!response.ok || !payload.place) throw new Error(payload.error || 'Could not load Google reviews.');
      setPlace(payload.place);
      setState('loaded');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not load Google reviews.');
      setState('error');
    }
  }

  if (state === 'idle') {
    return (
      <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5">
        <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
          Google supplies up to five relevant reviews. They load only when requested to keep API use under control.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button onClick={() => void loadReviews()}>Show Google reviews</Button>
          <Button asChild variant="outline"><a href={fallbackUrl} target="_blank" rel="noopener noreferrer">Open Google Maps <ExternalLink className="h-4 w-4" /></a></Button>
        </div>
      </div>
    );
  }

  if (state === 'loading') {
    return (
      <div className="space-y-4 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5" aria-live="polite">
        <p className="flex items-center gap-2 text-sm font-medium"><Loader2 className="h-4 w-4 animate-spin" /> Loading Google reviews…</p>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (state === 'error' || !place) {
    return (
      <div role="alert" className="rounded-lg border border-destructive/35 bg-destructive/5 p-5">
        <p className="font-medium text-[var(--vd-fg)]">Google reviews could not be loaded</p>
        <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{error}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void loadReviews()}>Try again</Button>
          <Button asChild variant="ghost"><a href={fallbackUrl} target="_blank" rel="noopener noreferrer">Open Google Maps <ExternalLink className="h-4 w-4" /></a></Button>
        </div>
      </div>
    );
  }

  const placeUrl = place.googleMapsUri || fallbackUrl;
  return (
    <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--vd-border)] pb-4">
        <div>
          <p translate="no" className="text-sm font-normal tracking-normal text-[var(--vd-muted-fg)]">Google Maps</p>
          {place.rating !== null ? (
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <StarRating rating={place.rating} label={`${place.rating} out of 5 stars on Google Maps`} />
              {place.userRatingCount !== null ? <span className="text-sm text-[var(--vd-muted-fg)]">from {place.userRatingCount.toLocaleString('en-GB')} ratings</span> : null}
            </div>
          ) : null}
        </div>
        <a href={placeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--vd-primary)] underline-offset-4 hover:underline">
          See all on Google Maps <ExternalLink className="h-4 w-4" />
        </a>
      </div>
      <p className="py-4 text-xs leading-5 text-[var(--vd-muted-fg)]">
        Reviews are selected and ordered by Google for relevance. Google does not verify every review, but may remove content that breaks its policies.
      </p>
      <div>
        {place.reviews.length ? place.reviews.map((review) => <ReviewItem key={review.id} review={review} placeUrl={placeUrl} />) : (
          <p className="py-5 text-sm text-[var(--vd-muted-fg)]">Google did not return any written reviews for this business.</p>
        )}
      </div>
    </div>
  );
}
