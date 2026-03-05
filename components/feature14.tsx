import * as React from 'react';

export type Feature14Item = {
  title: string;
  description?: string;
  bullets?: string[];
  image?: string;
  imageAlt?: string;
  badge?: string;
  ctaLabel?: string;
  ctaHref?: string;
};

export type Feature14Props = {
  id?: string;
  heading?: string;
  description?: string;
  items?: Feature14Item[];
};

export function Feature14({ heading, description, items }: Feature14Props) {
  return (
    <section className="container py-16">
      {heading ? <h2 className="text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {items && items.length ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {items.map((it, idx) => (
            <article key={`${it.title}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <h3 className="font-semibold">{it.title}</h3>
              {it.description ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{it.description}</p> : null}
              {it.bullets && it.bullets.length ? (
                <ul className="mt-3 list-disc pl-5 text-sm text-[var(--vd-muted-fg)]">
                  {it.bullets.map((b, bidx) => (
                    <li key={bidx}>{b}</li>
                  ))}
                </ul>
              ) : null}
              {it.ctaLabel ? (
                <a className="mt-4 inline-block text-sm font-semibold underline underline-offset-4" href={it.ctaHref || '#'}>
                  {it.ctaLabel}
                </a>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

