import * as React from 'react';

export type Help2FaqItem = { question: string; answer: string; category: string };
export type Help2Button = { label: string; href: string; icon?: 'MessageSquare' | 'Mail' | 'Phone' };

export type Help2Props = {
  id?: string;
  title?: string;
  description?: string;
  faqs?: Help2FaqItem[];
  searchPlaceholder?: string;
  emptyMessage?: string;
  contactHeading?: string;
  contactDescription?: string;
  contactButtons?: Help2Button[];
};

export function Help2({ title, description, faqs, contactHeading, contactDescription, contactButtons }: Help2Props) {
  return (
    <section className="container py-16">
      {title ? <h2 className="text-3xl font-bold tracking-tight">{title}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {faqs && faqs.length ? (
        <div className="mt-8 space-y-4">
          {faqs.slice(0, 6).map((f, idx) => (
            <details key={`${f.question}-${idx}`} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-4">
              <summary className="cursor-pointer font-semibold">{f.question}</summary>
              <p className="mt-2 text-sm text-[var(--vd-muted-fg)] whitespace-pre-wrap">{f.answer}</p>
            </details>
          ))}
        </div>
      ) : null}
      {contactHeading || contactDescription ? (
        <div className="mt-10 rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
          {contactHeading ? <h3 className="font-semibold">{contactHeading}</h3> : null}
          {contactDescription ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{contactDescription}</p> : null}
          {contactButtons && contactButtons.length ? (
            <div className="mt-4 flex flex-wrap gap-3">
              {contactButtons.map((b) => (
                <a key={b.href} className="underline underline-offset-4 text-sm font-semibold" href={b.href}>
                  {b.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

