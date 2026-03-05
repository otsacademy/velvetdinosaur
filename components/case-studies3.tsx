import * as React from 'react';

export type CaseStudyCard = {
  title: string;
  client?: string;
  summary?: string;
  outcome?: string;
  image?: string;
  logo?: string;
  link?: string;
  tags?: string[];
};

export type CaseStudies3Props = {
  id?: string;
  heading?: string;
  description?: string;
  featured?: CaseStudyCard;
  items?: CaseStudyCard[];
  linkLabel?: string;
};

export function CaseStudies3({ heading, description, featured, items }: CaseStudies3Props) {
  const rest = items || [];
  return (
    <section className="container py-16">
      {heading ? <h2 className="text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        {featured ? (
          <article className="lg:col-span-2 rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
            <h3 className="text-lg font-semibold">{featured.title}</h3>
            {featured.client ? <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{featured.client}</p> : null}
            {featured.summary ? <p className="mt-3 text-sm">{featured.summary}</p> : null}
            {featured.link ? (
              <a className="mt-4 inline-block text-sm font-semibold underline underline-offset-4" href={featured.link}>
                View
              </a>
            ) : null}
          </article>
        ) : null}
        <div className="grid gap-4">
          {rest.slice(0, 4).map((c, idx) => (
            <article key={`${c.title}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <h3 className="font-semibold">{c.title}</h3>
              {c.client ? <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{c.client}</p> : null}
              {c.link ? (
                <a className="mt-3 inline-block text-sm font-semibold underline underline-offset-4" href={c.link}>
                  View
                </a>
              ) : null}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

