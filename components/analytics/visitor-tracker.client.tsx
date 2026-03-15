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
  const searchParams = useSearchParams();
  const lastTrackedRef = useRef('');

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
    if (typeof window === 'undefined') return;

    return createAutoAnalytics();
  }, [pathname]);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LHCI === 'true') return;
    if (typeof window === 'undefined' || !pathname || !shouldTrackPath(pathname)) return;
    if (navigator.doNotTrack === '1') return;

    const search = searchParams?.toString() || '';
    const pathWithSearch = search ? `${pathname}?${search}` : pathname;
    if (lastTrackedRef.current === pathWithSearch) return;
    lastTrackedRef.current = pathWithSearch;

    void trackAnalyticsEvent(buildPageViewPayload(pathWithSearch));
  }, [pathname, searchParams]);

  return null;
}
