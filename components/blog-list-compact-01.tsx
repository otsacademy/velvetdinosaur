import * as React from 'react';

export type BlogListCompactPost = {
  id?: string;
  title: string;
  href?: string;
  excerpt?: string;
  category?: string;
  date?: string;
  readTime?: string;
  views?: string;
  thumbnail?: string;
  authorName?: string;
  authorAvatar?: string;
};

export type BlogListCompact01Props = {
  id?: string;
  heading?: string;
  description?: string;
  posts?: BlogListCompactPost[];
  show?: boolean | 'true' | 'false';
  emptyMessage?: string;
};

export function BlogListCompact01({ heading, description, posts, show, emptyMessage }: BlogListCompact01Props) {
  const visible = show === true || show === 'true';
  if (!visible) return null;
  const list = posts || [];
  return (
    <section className="container py-16">
      {heading ? <h2 className="text-3xl font-bold tracking-tight">{heading}</h2> : null}
      {description ? <p className="mt-3 text-sm text-[var(--vd-muted-fg)]">{description}</p> : null}
      {list.length ? (
        <ul className="mt-8 space-y-4">
          {list.map((p, idx) => (
            <li key={p.id || idx} className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] p-5">
              <a className="font-semibold underline underline-offset-4" href={p.href || '#'}>
                {p.title}
              </a>
              {p.excerpt ? <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">{p.excerpt}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-sm text-[var(--vd-muted-fg)]">{emptyMessage || 'No posts yet.'}</p>
      )}
    </section>
  );
}

