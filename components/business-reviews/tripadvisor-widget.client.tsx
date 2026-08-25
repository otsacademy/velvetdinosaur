'use client';

import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function widgetUniqueId(locationId: string) {
  const digits = locationId.replace(/\D/g, '');
  return digits.slice(-9) || '1';
}

export function TripadvisorWidget({
  locationId,
  listingUrl,
  enabled
}: {
  locationId: string;
  listingUrl: string;
  enabled: boolean;
}) {
  const [requested, setRequested] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const scriptHost = useRef<HTMLDivElement>(null);
  const uniq = widgetUniqueId(locationId);

  useEffect(() => {
    if (!enabled || !locationId || !requested || !scriptHost.current) return;
    const params = new URLSearchParams({
      wtype: 'selfserveprop',
      uniq,
      locationId,
      lang: 'en_UK',
      rating: 'true',
      nreviews: '5',
      writereviewlink: 'true',
      popIdx: 'false',
      iswide: 'true',
      border: 'true',
      display_version: '2'
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.jscache.com/wejs?${params.toString()}`;
    script.addEventListener('load', () => setReady(true));
    script.addEventListener('error', () => setFailed(true));
    scriptHost.current.appendChild(script);
    return () => script.remove();
  }, [enabled, locationId, requested, uniq]);

  if (!enabled || !locationId) {
    return (
      <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5">
        <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
          Read the current rating and reviews on the official Tripadvisor listing.
        </p>
        {listingUrl ? (
          <Button asChild className="mt-4" variant="outline">
            <a href={listingUrl} target="_blank" rel="noopener noreferrer">Open Tripadvisor <ExternalLink className="h-4 w-4" /></a>
          </Button>
        ) : null}
      </div>
    );
  }

  if (!requested) {
    return (
      <div className="rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5">
        <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
          Tripadvisor’s official widget loads current ratings and review snippets directly from Tripadvisor.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setRequested(true)}>Show Tripadvisor reviews</Button>
          {listingUrl ? <Button asChild variant="outline"><a href={listingUrl} target="_blank" rel="noopener noreferrer">Open Tripadvisor <ExternalLink className="h-4 w-4" /></a></Button> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-40 rounded-lg border border-[var(--vd-border)] bg-[var(--vd-bg)] p-5">
      {failed ? (
        <div role="alert">
          <p className="font-medium">The Tripadvisor widget could not be loaded.</p>
          {listingUrl ? <a href={listingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[var(--vd-primary)] underline-offset-4 hover:underline">Open Tripadvisor <ExternalLink className="h-4 w-4" /></a> : null}
        </div>
      ) : !ready ? (
        <p className="mb-4 flex items-center gap-2 text-sm text-[var(--vd-muted-fg)]"><Loader2 className="h-4 w-4 animate-spin" /> Loading the official Tripadvisor widget…</p>
      ) : null}
      <div id={`TA_selfserveprop${uniq}`} className="TA_selfserveprop">
        <ul id={`TA_links${uniq}`} className="TA_links list-none p-0">
          <li>
            <a href="https://www.tripadvisor.co.uk/" target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--vd-fg)]">Tripadvisor</a>
          </li>
        </ul>
      </div>
      <div ref={scriptHost} aria-hidden="true" />
      <noscript>
        {listingUrl ? <a href={listingUrl}>Read reviews on Tripadvisor</a> : 'JavaScript is required to load Tripadvisor reviews.'}
      </noscript>
    </div>
  );
}
