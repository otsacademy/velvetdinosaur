import * as React from 'react';

export type Contact2Detail = { label: string; value: string; href?: string };

export type Contact2Props = {
  id?: string;
  title?: string;
  description?: string;
  details?: Contact2Detail[];
  formTitle?: string;
  formDescription?: string;
  submitLabel?: string;
  privacyLabel?: string;
  privacyLinkLabel?: string;
  privacyHref?: string;
  optionalLabel?: string;
};

export function Contact2({
  title,
  description,
  details,
  formTitle,
  formDescription,
  submitLabel = 'Send',
  privacyLabel,
  privacyLinkLabel,
  privacyHref
}: Contact2Props) {
  return (
    <section className="container py-16">
      {title ? <h2 className="text-3xl font-bold tracking-tight">{title}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div>
          {details && details.length ? (
            <dl className="space-y-4 text-sm">
              {details.map((d) => (
                <div key={d.label}>
                  <dt className="font-semibold">{d.label}</dt>
                  <dd className="text-[var(--vd-muted-fg)]">
                    {d.href ? (
                      <a className="underline underline-offset-4" href={d.href}>
                        {d.value}
                      </a>
                    ) : (
                      d.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : null}
        </div>
        <form className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
          {formTitle ? <h3 className="text-lg font-semibold">{formTitle}</h3> : null}
          {formDescription ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{formDescription}</p> : null}
          <label className="mt-4 block text-sm font-semibold">
            Email
            <input className="mt-1 w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-2" name="email" />
          </label>
          <label className="mt-4 block text-sm font-semibold">
            Message
            <textarea
              className="mt-1 w-full rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-2"
              name="message"
              rows={4}
            />
          </label>
          <button
            className="mt-4 inline-flex items-center justify-center rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)]"
            type="button"
          >
            {submitLabel}
          </button>
          {privacyLabel ? (
            <p className="mt-3 text-xs text-[var(--vd-muted-fg)]">
              {privacyLabel}{' '}
              {privacyLinkLabel ? (
                <a className="underline underline-offset-4" href={privacyHref || '#'}>
                  {privacyLinkLabel}
                </a>
              ) : null}
            </p>
          ) : null}
        </form>
      </div>
    </section>
  );
}

