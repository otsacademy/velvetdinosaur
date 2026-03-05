import * as React from 'react';

export type ProcessStep = {
  title: string;
  description?: string;
};

export type Process3Props = {
  id?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  note?: string;
  steps?: ProcessStep[];
};

export function Process3({ eyebrow, heading, description, note, steps }: Process3Props) {
  return (
    <section className="container py-16">
      {eyebrow ? <p className="text-sm font-semibold text-[var(--vd-muted-fg)]">{eyebrow}</p> : null}
      {heading ? <h2 className="mt-2 text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {steps && steps.length ? (
        <ol className="mt-8 grid gap-4 md:grid-cols-3">
          {steps.map((s, idx) => (
            <li key={`${s.title}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <p className="text-xs font-semibold text-[var(--vd-muted-fg)]">Step {idx + 1}</p>
              <h3 className="mt-2 font-semibold">{s.title}</h3>
              {s.description ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{s.description}</p> : null}
            </li>
          ))}
        </ol>
      ) : null}
      {note ? <p className="mt-6 text-xs text-[var(--vd-muted-fg)]">{note}</p> : null}
    </section>
  );
}

