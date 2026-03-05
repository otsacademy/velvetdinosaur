import * as React from 'react';

export type ContentSection = {
  id?: string;
  title?: string;
  body?: string;
};

export type Content1Props = {
  id?: string;
  badgeLabel?: string;
  title?: string;
  description?: string;
  heroImage?: string;
  sections?: ContentSection[];
};

export function Content1({ badgeLabel, title, description, sections }: Content1Props) {
  return (
    <section className="container py-16">
      {badgeLabel ? <p className="text-xs font-semibold text-[var(--vd-muted-fg)]">{badgeLabel}</p> : null}
      {title ? <h2 className="mt-2 text-3xl font-bold tracking-tight">{title}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {sections && sections.length ? (
        <div className="mt-8 space-y-6">
          {sections.map((s, idx) => (
            <article key={s.id || idx} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              {s.title ? <h3 className="font-semibold">{s.title}</h3> : null}
              {s.body ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)] whitespace-pre-wrap">{s.body}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

