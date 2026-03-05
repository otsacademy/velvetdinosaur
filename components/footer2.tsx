import * as React from 'react';

export type Footer2Link = { text: string; url: string };
export type Footer2MenuItem = { title: string; links: Footer2Link[] };

export type Footer2Props = {
  id?: string;
  logo?: { url: string; src: string; alt: string; title: string };
  tagline?: string;
  menuItems?: Footer2MenuItem[];
  copyright?: string;
  bottomLinks?: Footer2Link[];
};

export function Footer2({ tagline, menuItems, bottomLinks, copyright }: Footer2Props) {
  return (
    <footer className="border-t border-[var(--vd-border)] mt-16">
      <div className="container py-10">
        {tagline ? <p className="text-sm text-[var(--vd-muted-fg)]">{tagline}</p> : null}
        {menuItems && menuItems.length ? (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {menuItems.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-semibold">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm">
                  {group.links.map((l) => (
                    <li key={l.url}>
                      <a className="text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]" href={l.url}>
                        {l.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : null}
        {bottomLinks && bottomLinks.length ? (
          <div className="mt-8 flex flex-wrap gap-4 text-sm">
            {bottomLinks.map((l) => (
              <a key={l.url} className="text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]" href={l.url}>
                {l.text}
              </a>
            ))}
          </div>
        ) : null}
        {copyright ? <p className="mt-6 text-xs text-[var(--vd-muted-fg)]">{copyright}</p> : null}
      </div>
    </footer>
  );
}

