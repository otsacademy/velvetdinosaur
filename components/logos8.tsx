import * as React from 'react';

export type Logos8Item = { name: string; logo?: string };
export type Logos8Props = {
  id?: string;
  heading?: string;
  logos?: Logos8Item[];
};

export function Logos8({ heading, logos }: Logos8Props) {
  return (
    <section className="container py-12">
      {heading ? <h2 className="text-xl font-semibold">{heading}</h2> : null}
      {logos && logos.length ? (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {logos.map((l, idx) => (
            <li key={`${l.name}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-4 text-sm">
              {l.name}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

