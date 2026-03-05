'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type LegalSlug = 'privacy' | 'terms';

type LegalSection = {
  heading?: string;
  body?: string;
};

type LegalPayload = {
  slug: LegalSlug;
  title?: string;
  lastUpdated?: string;
  sections?: LegalSection[];
};

type LegalDialogLinkProps = {
  label: string;
  slug: LegalSlug;
  fallbackHref: string;
  className?: string;
};

function renderBody(body?: string) {
  if (!body) return null;
  const parts = body
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) return null;
  return parts.map((part, idx) => (
    <p key={`${part}-${idx}`} className="text-sm sm:text-base text-[var(--vd-muted-fg)] leading-relaxed">
      {part}
    </p>
  ));
}

export function LegalDialogLink({ label, slug, fallbackHref, className }: LegalDialogLinkProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [data, setData] = useState<LegalPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDoc = () => {
    if (data?.slug === slug && status === 'success') return;
    setStatus('loading');
    setError(null);
    fetch(`/api/legal?slug=${slug}`, { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load ${slug}`);
        }
        return (await res.json()) as LegalPayload;
      })
      .then((payload) => {
        setData(payload);
        setStatus('success');
      })
      .catch(() => {
        setError('Unable to load this document.');
        setStatus('error');
      });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      loadDoc();
    }
  };

  const sections = data?.sections ?? [];

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <a
          href={fallbackHref}
          onClick={(event) => {
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
              return;
            }
            event.preventDefault();
            handleOpenChange(true);
          }}
          className={cn('hover:text-[var(--vd-primary)] transition-colors', className)}
        >
          {label}
        </a>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-3xl max-h-[85vh] overflow-hidden text-[var(--vd-fg)]">
        <DialogHeader className="pr-8">
          <DialogTitle className="text-2xl font-black uppercase tracking-tight text-[var(--vd-fg)]">
            {data?.title || label}
          </DialogTitle>
          {data?.lastUpdated ? (
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
              Last updated: {data.lastUpdated}
            </p>
          ) : null}
        </DialogHeader>

        <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">
          {status === 'loading' ? (
            <p className="text-sm text-[var(--vd-muted-fg)]">Loading...</p>
          ) : null}
          {status === 'error' ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--vd-muted-fg)]">{error}</p>
              <a href={fallbackHref} className="text-sm font-semibold underline">
                Open the full page
              </a>
            </div>
          ) : null}
          {status === 'success' ? (
            <div className="space-y-8">
              {sections.map((section, idx) => {
                if (!section.heading && !section.body) return null;
                return (
                  <div key={`${section.heading || 'section'}-${idx}`} className="space-y-3">
                    {section.heading ? (
                      <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[var(--vd-fg)]">
                        {section.heading}
                      </h3>
                    ) : null}
                    {renderBody(section.body)}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
