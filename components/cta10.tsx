import * as React from 'react';

export type Cta10Button = { text: string; url: string };
export type Cta10Props = {
  id?: string;
  heading?: string;
  description?: string;
  buttons?: {
    primary?: Cta10Button;
    secondary?: Cta10Button;
  };
};

export function Cta10({ heading, description, buttons }: Cta10Props) {
  const primary = buttons?.primary;
  const secondary = buttons?.secondary;
  return (
    <section className="w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-6">
      {heading ? <h2 className="text-xl font-semibold">{heading}</h2> : null}
      {description ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      <div className="mt-4 flex flex-wrap gap-3">
        {primary ? (
          <a
            className="inline-flex items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)]"
            href={primary.url}
          >
            {primary.text}
          </a>
        ) : null}
        {secondary ? (
          <a
            className="inline-flex items-center justify-center rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-4 py-2 text-sm font-semibold"
            href={secondary.url}
          >
            {secondary.text}
          </a>
        ) : null}
      </div>
    </section>
  );
}

