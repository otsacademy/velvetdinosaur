import * as React from 'react';

export type Pricing2Props = {
  id?: string;
  heading?: string;
  description?: string;
  baselineLabel?: string;
  baselinePrice?: string;
  baselineItems?: string[];
  includesTitle?: string;
  includes?: string[];
  hostingTitle?: string;
  hostingDetails?: string[];
  factorsTitle?: string;
  factors?: string[];
  note?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
};

export function Pricing2(props: Pricing2Props) {
  return (
    <section className="container py-16">
      {props.heading ? <h2 className="text-3xl font-bold tracking-tight">{props.heading}</h2> : null}
      {props.description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{props.description}</p> : null}
      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
          <p className="text-sm font-semibold">{props.baselineLabel || 'Baseline'}</p>
          <p className="mt-2 text-2xl font-bold">{props.baselinePrice || ''}</p>
          {props.baselineItems && props.baselineItems.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--vd-muted-fg)]">
              {props.baselineItems.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
          <p className="text-sm font-semibold">{props.includesTitle || 'Includes'}</p>
          {props.includes && props.includes.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--vd-muted-fg)]">
              {props.includes.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
          <p className="text-sm font-semibold">{props.factorsTitle || 'Factors'}</p>
          {props.factors && props.factors.length ? (
            <ul className="mt-4 space-y-2 text-sm text-[var(--vd-muted-fg)]">
              {props.factors.map((it, idx) => (
                <li key={idx}>{it}</li>
              ))}
            </ul>
          ) : null}
          {props.note ? <p className="mt-4 text-xs text-[var(--vd-muted-fg)]">{props.note}</p> : null}
          <div className="mt-5 flex flex-wrap gap-3">
            {props.primaryCtaLabel ? (
              <a
                className="rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)]"
                href={props.primaryCtaHref || '#'}
              >
                {props.primaryCtaLabel}
              </a>
            ) : null}
            {props.secondaryCtaLabel ? (
              <a className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-4 py-2 text-sm font-semibold" href={props.secondaryCtaHref || '#'}>
                {props.secondaryCtaLabel}
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

