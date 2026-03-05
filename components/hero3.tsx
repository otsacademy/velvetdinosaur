import * as React from 'react';

export type Hero3Action = { label: string; href: string };
export type Hero3Logo = { name: string; logo?: string };

export type Hero3Props = {
  id?: string;
  headline?: string;
  subheadline?: string;
  primaryAction?: Hero3Action;
  secondaryAction?: Hero3Action;
  trustLogos?: Hero3Logo[];
};

export function Hero3({ headline, subheadline, primaryAction, secondaryAction, trustLogos }: Hero3Props) {
  return (
    <section className="container py-16">
      {headline ? <h1 className="text-4xl font-bold tracking-tight">{headline}</h1> : null}
      {subheadline ? <p className="mt-4 text-base text-[var(--vd-muted-fg)]">{subheadline}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {primaryAction ? (
          <a
            className="rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--vd-primary-fg)]"
            href={primaryAction.href}
          >
            {primaryAction.label}
          </a>
        ) : null}
        {secondaryAction ? (
          <a className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-5 py-2.5 text-sm font-semibold" href={secondaryAction.href}>
            {secondaryAction.label}
          </a>
        ) : null}
      </div>
      {trustLogos && trustLogos.length ? (
        <ul className="mt-8 flex flex-wrap gap-3 text-xs text-[var(--vd-muted-fg)]">
          {trustLogos.map((l, idx) => (
            <li key={`${l.name}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-3 py-2">
              {l.name}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

