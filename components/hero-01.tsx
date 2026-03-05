import * as React from 'react';

export type HeroMetaItem = {
  label: string;
  value?: string;
};

export type Hero01Props = {
  id?: string;
  eyebrow?: string;
  headline: string;
  subheadline?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  inputPlaceholder?: string;
  metaLine?: string;
  metaItems?: HeroMetaItem[];
  supportingTitle?: string;
  supportingText?: string;
  supportingLinkLabel?: string;
  supportingLinkHref?: string;
  imageSrc?: string;
  imageAlt?: string;
};

export function Hero01(props: Hero01Props) {
  return (
    <section className="container py-16">
      {props.eyebrow ? <p className="text-sm font-semibold text-[var(--vd-muted-fg)]">{props.eyebrow}</p> : null}
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{props.headline}</h1>
      {props.subheadline ? <p className="mt-4 text-base text-[var(--vd-muted-fg)]">{props.subheadline}</p> : null}
      <div className="mt-6 flex flex-wrap gap-3">
        {props.primaryCtaLabel ? (
          <a
            className="inline-flex items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--vd-primary-fg)]"
            href={props.primaryCtaHref || '#'}
          >
            {props.primaryCtaLabel}
          </a>
        ) : null}
        {props.secondaryCtaLabel ? (
          <a
            className="inline-flex items-center justify-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-5 py-2.5 text-sm font-semibold"
            href={props.secondaryCtaHref || '#'}
          >
            {props.secondaryCtaLabel}
          </a>
        ) : null}
      </div>
      {props.metaLine || (props.metaItems && props.metaItems.length) ? (
        <div className="mt-8 text-sm text-[var(--vd-muted-fg)]">
          {props.metaLine ? <p>{props.metaLine}</p> : null}
          {props.metaItems && props.metaItems.length ? (
            <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {props.metaItems.map((item, idx) => (
                <li key={`${item.label}-${idx}`} className="font-medium">
                  {item.label}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

