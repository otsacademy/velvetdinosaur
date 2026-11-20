'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  buildPageViewPayload,
  createAutoAnalytics,
  shouldTrackPath,
  trackAnalyticsEvent
} from '@/lib/analytics/client';

export function VisitorTracker() {
  const pathname = usePathname();
  // Pages opened from emailed links carry a signed token in the address.
  const disabled = ['/newsletter/unsubscribe', '/newsletter/confirm', '/events/registration/confirm'].includes(pathname);
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef('');

  useEffect(() => {
    if (disabled) return;
    if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
    if (typeof window === 'undefined') return;

    return createAutoAnalytics();
  }, [disabled, pathname]);

  useEffect(() => {
    if (disabled) return;
    if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
    if (typeof window === 'undefined' || !pathname || !shouldTrackPath(pathname)) return;
    if (navigator.doNotTrack === '1') return;

    const search = searchParams?.toString() || '';
    const pathWithSearch = search ? `${pathname}?${search}` : pathname;
    if (lastTrackedRef.current === pathWithSearch) return;
    lastTrackedRef.current = pathWithSearch;

    void trackAnalyticsEvent(buildPageViewPayload(pathWithSearch));
  }, [disabled, pathname, searchParams]);

  return null;
}
