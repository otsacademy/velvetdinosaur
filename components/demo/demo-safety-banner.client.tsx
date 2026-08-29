'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DEMO_ACTION_MESSAGE,
  DEMO_DISCLAIMER,
  isBlockedPublicActionHref,
  isBlockedPublicActionLabel,
  isPublicDemoPath,
  isPublicSearchForm
} from '@/lib/demo-safety';

export function DemoSafetyBanner() {
  const pathname = usePathname() || '/';
  const isPublic = isPublicDemoPath(pathname);
  const [notice, setNotice] = useState('');
  const bannerRef = useRef<HTMLDivElement>(null);
  const announceBlockedAction = useCallback(() => setNotice(DEMO_ACTION_MESSAGE), []);

  useEffect(() => {
    if (!isPublic) return;

    const handleSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement) || isPublicSearchForm(form)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      announceBlockedAction();
    };

    const handleClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a[href]');
      if (link instanceof HTMLAnchorElement && isBlockedPublicActionHref(link.getAttribute('href') || '')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        announceBlockedAction();
        return;
      }

      const button = target.closest('button');
      if (!(button instanceof HTMLButtonElement) || button.type === 'submit') return;
      const label = button.getAttribute('aria-label') || button.textContent || '';
      if (!isBlockedPublicActionLabel(label)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      announceBlockedAction();
    };

    document.addEventListener('submit', handleSubmit, true);
    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('submit', handleSubmit, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [announceBlockedAction, isPublic]);

  useEffect(() => {
    if (!isPublic || !bannerRef.current) return;

    const root = document.documentElement;
    const body = document.body;
    const previousPadding = body.style.getPropertyValue('padding-bottom');
    const previousPriority = body.style.getPropertyPriority('padding-bottom');
    const updateReservedSpace = () => {
      const height = Math.ceil(bannerRef.current?.getBoundingClientRect().height || 0);
      root.style.setProperty('--vd-demo-banner-height', `${height}px`);
      body.style.setProperty('padding-bottom', 'var(--vd-demo-banner-height)');
    };
    const observer = new ResizeObserver(updateReservedSpace);
    observer.observe(bannerRef.current);
    updateReservedSpace();

    return () => {
      observer.disconnect();
      root.style.removeProperty('--vd-demo-banner-height');
      if (previousPadding) body.style.setProperty('padding-bottom', previousPadding, previousPriority);
      else body.style.removeProperty('padding-bottom');
    };
  }, [isPublic]);

  if (!isPublic) return null;

  return (
    <div ref={bannerRef} data-demo-safety-banner className="fixed inset-x-0 bottom-0 z-[100]">
      <Alert className="rounded-none border-x-0 border-b-0 bg-[var(--vd-accent)] px-4 py-3 text-[var(--vd-accent-fg)] shadow-[0_-8px_24px_-16px_color-mix(in_oklch,var(--vd-fg)_45%,transparent)]">
        <div className="mx-auto flex w-full max-w-7xl items-start gap-3">
          <ShieldAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <AlertDescription className="m-0 text-sm font-medium leading-5 text-[var(--vd-accent-fg)]">
            <span>{DEMO_DISCLAIMER}</span>
            <span className="sr-only" aria-live="polite" data-demo-action-notice>
              {notice}
            </span>
            {notice ? <span className="mt-1 block font-normal">{notice}</span> : null}
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}
