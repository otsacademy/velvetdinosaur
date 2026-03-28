'use client';

import { useMemo } from 'react';
import { Plate, usePlateEditor } from 'platejs/react';
import { CalendarDays, Clock3 } from 'lucide-react';
import { Editor, EditorContainer } from '@/registry/ui/editor';
import { NEWS_EDITOR_PLUGINS } from '@/components/edit/news-editor/news-document-toolbar';
import { createArticleExcerpt } from '@/lib/news-presentation';
import { type DemoNewsDocument } from '@/lib/demo-news-seed';

type DemoNewsArticleRendererProps = {
  document: DemoNewsDocument;
  mode: 'draft' | 'live';
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function estimateReadTime(content: unknown[]) {
  const text = JSON.stringify(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(words / 220))} min read`;
}

export function DemoNewsArticleRenderer({ document, mode }: DemoNewsArticleRendererProps) {
  const editor = usePlateEditor(
    {
      plugins: NEWS_EDITOR_PLUGINS,
      value: document.content as never,
    },
    [document.content],
  );

  const lead = useMemo(() => {
    return createArticleExcerpt(document.desc, { maxChars: 180, preferSentence: true });
  }, [document.desc]);

  return (
    <div className="min-h-screen bg-[var(--vd-bg)] text-[var(--vd-fg)]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <article className="overflow-hidden rounded-[2rem] border border-[var(--vd-border)] bg-[var(--vd-card)] shadow-[0_30px_90px_-70px_color-mix(in_oklch,var(--vd-fg)_30%,transparent)]">
          <div className="border-b border-[var(--vd-border)] bg-[color-mix(in_oklch,var(--vd-primary)_4%,var(--vd-bg))] px-6 py-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--vd-muted-fg)]">
              <span>{document.tag}</span>
              <span className="h-1 w-1 rounded-full bg-[var(--vd-border)]" />
              <span>{mode === 'live' ? 'Published demo article' : 'Draft preview'}</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-[var(--vd-fg)] md:text-5xl">
              {document.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--vd-muted-fg)]">{lead}</p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-[var(--vd-muted-fg)]">
              <span className="inline-flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                {formatDate(document.publishDate)}
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4" />
                {estimateReadTime(document.content)}
              </span>
              <span>By {document.authorName}</span>
            </div>
          </div>

          <div className="px-6 py-6">
            {document.heroImage ? (
              <figure className="overflow-hidden rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-muted)]/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={document.heroImage}
                  alt={document.imageCaption || document.title}
                  className="h-auto w-full object-cover"
                />
                {document.imageCaption ? (
                  <figcaption className="border-t border-[var(--vd-border)] px-4 py-3 text-sm text-[var(--vd-muted-fg)]">
                    {document.imageCaption}
                  </figcaption>
                ) : null}
              </figure>
            ) : null}

            <div className="mx-auto mt-8 max-w-4xl">
              <Plate editor={editor} readOnly>
                <EditorContainer className="h-auto overflow-visible">
                  <Editor
                    readOnly
                    variant="fullWidth"
                    className="min-h-0 px-0 pb-0 pt-0 text-base leading-8 [&_h1]:mt-12 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-4 [&_blockquote]:my-8 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--vd-primary)]/30 [&_blockquote]:pl-5 [&_blockquote]:italic [&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--vd-border)] [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-[var(--vd-border)] [&_th]:bg-[var(--vd-muted)]/25 [&_th]:px-3 [&_th]:py-2 [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_img]:my-8 [&_img]:rounded-[1.25rem] [&_img]:border [&_img]:border-[var(--vd-border)]"
                  />
                </EditorContainer>
              </Plate>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
