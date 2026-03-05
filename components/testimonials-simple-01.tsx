import * as React from 'react';

export type TestimonialsSimpleItem = {
  quote: string;
  name?: string;
  role?: string;
  company?: string;
  outcome?: string;
  image?: string;
};

export type TestimonialsSimple01Props = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  items?: TestimonialsSimpleItem[];
};

export function TestimonialsSimple01({ eyebrow, heading, description, items }: TestimonialsSimple01Props) {
  return (
    <section className="container py-16">
      {eyebrow ? <p className="text-sm font-semibold text-[var(--vd-muted-fg)]">{eyebrow}</p> : null}
      {heading ? <h2 className="mt-2 text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {items && items.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.slice(0, 6).map((t, idx) => (
            <figure key={`${t.name || 'item'}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <blockquote className="text-sm">&ldquo;{t.quote}&rdquo;</blockquote>
              <figcaption className="mt-3 text-xs text-[var(--vd-muted-fg)]">
                {t.name ? <span className="font-semibold text-[var(--vd-fg)]">{t.name}</span> : null}
                {t.role || t.company ? <span> {t.role || ''}{t.company ? `, ${t.company}` : ''}</span> : null}
              </figcaption>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}
