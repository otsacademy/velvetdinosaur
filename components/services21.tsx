import * as React from 'react';

export type ServiceItem = {
  id?: string;
  title?: string;
  image?: string;
  description?: string;
  meta?: string;
};

export type Services21Props = {
  id?: string;
  heading?: string;
  intro?: string;
  services?: ServiceItem[];
  ctaLabel?: string;
  ctaHref?: string;
};

export function Services21({ heading, intro, services, ctaLabel, ctaHref }: Services21Props) {
  return (
    <section className="container py-16">
      {heading ? <h2 className="text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {intro ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{intro}</p> : null}
      {services && services.length ? (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {services.map((s, idx) => (
            <article key={s.id || idx} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <h3 className="font-semibold">{s.title || 'Service'}</h3>
              {s.description ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{s.description}</p> : null}
              {s.meta ? <p className="mt-3 text-xs text-[var(--vd-muted-fg)]">{s.meta}</p> : null}
            </article>
          ))}
        </div>
      ) : null}
      {ctaLabel ? (
        <div className="mt-8">
          <a
            className="inline-flex items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)]"
            href={ctaHref || '#'}
          >
            {ctaLabel}
          </a>
        </div>
      ) : null}
    </section>
  );
}

