'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { DemoNewsArticleRenderer } from '@/components/demo/news/demo-news-article-renderer.client';
import { readDemoNewsPreviewDocument } from '@/components/demo/news/demo-news-storage';
import { type DemoNewsDocument } from '@/lib/demo-news-seed';

type DemoNewsPreviewProps = {
  slug: string;
  mode: 'draft' | 'live';
  homeHref?: string;
  editorHref?: string;
};

export function DemoNewsPreview({
  slug,
  mode,
  homeHref = '/',
  editorHref = '/demo/news',
}: DemoNewsPreviewProps) {
  const [document, setDocument] = useState<DemoNewsDocument | null>(null);

  useEffect(() => {
    setDocument(readDemoNewsPreviewDocument(slug, mode));
  }, [mode, slug]);

  if (!document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--vd-bg)] px-6 text-center">
        <div className="max-w-lg space-y-4 rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-card)] p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">
            Demo article unavailable
          </p>
          <h1 className="text-2xl font-semibold text-[var(--vd-fg)]">
            {mode === 'live' ? 'Nothing has been published in this demo yet.' : 'No draft preview is available.'}
          </h1>
          <p className="text-sm leading-6 text-[var(--vd-muted-fg)]">
            Return to the editor, make a few changes, then save or publish inside the sandbox to refresh this view.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={editorHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--vd-primary)] px-5 text-sm font-medium text-[var(--vd-primary-fg)]"
            >
              Back to editor
            </Link>
            <Link
              href={homeHref}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[var(--vd-border)] px-5 text-sm font-medium text-[var(--vd-fg)]"
            >
              Main site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-3">
          <Link
            href={editorHref}
            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--vd-fg)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to demo editor
          </Link>
          <Link href={homeHref} className="text-sm text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]">
            velvetdinosaur.com
          </Link>
        </div>
      </div>
      <DemoNewsArticleRenderer document={document} mode={mode} />
    </>
  );
}
