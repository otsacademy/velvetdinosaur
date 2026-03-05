import * as React from 'react';

export type FeatureIconName = string;

export type Feature17Item = {
  heading: string;
  description: string;
  iconName?: FeatureIconName;
};

export type Feature17Props = {
  id?: string;
  label?: string;
  title?: string;
  features?: Feature17Item[];
  buttonText?: string;
  buttonUrl?: string;
};

export function Feature17({ label, title, features, buttonText, buttonUrl }: Feature17Props) {
  return (
    <section className="container py-16">
      {label ? <p className="text-sm font-semibold text-[var(--vd-muted-fg)]">{label}</p> : null}
      {title ? <h2 className="mt-2 text-3xl font-bold tracking-tight">{title}</h2> : null}
      {features && features.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, idx) => (
            <div key={`${f.heading}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <h3 className="font-semibold">{f.heading}</h3>
              <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{f.description}</p>
            </div>
          ))}
        </div>
      ) : null}
      {buttonText ? (
        <div className="mt-8">
          <a className="text-sm font-semibold underline underline-offset-4" href={buttonUrl || '#'}>
            {buttonText}
          </a>
        </div>
      ) : null}
    </section>
  );
}

