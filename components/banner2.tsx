import * as React from 'react';

export type Banner2Props = {
  id?: string;
  title?: string;
  description?: string;
  linkText?: string;
  linkUrl?: string;
  defaultVisible?: boolean;
};

export function Banner2({
  title,
  description,
  linkText,
  linkUrl,
  defaultVisible = true
}: Banner2Props) {
  if (!defaultVisible) return null;
  const href = linkUrl || '#';

  return (
    <section className="w-full border border-[var(--vd-border)] rounded-[var(--vd-radius)] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {title ? <p className="font-semibold">{title}</p> : null}
          {description ? <p className="text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
        </div>
        {linkText ? (
          <a className="text-sm font-semibold underline underline-offset-4" href={href}>
            {linkText}
          </a>
        ) : null}
      </div>
    </section>
  );
}

