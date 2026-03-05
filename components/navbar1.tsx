import * as React from 'react';

export type Navbar1MenuItem = {
  title: string;
  url: string;
  description?: string;
};

export type Navbar1Button = {
  title: string;
  url: string;
};

export type Navbar1Props = {
  id?: string;
  sticky?: boolean;
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
    className?: string;
  };
  menu?: Navbar1MenuItem[];
  primaryButton?: Navbar1Button;
  secondaryButton?: Navbar1Button;
};

export function Navbar1({ sticky, logo, menu, primaryButton, secondaryButton }: Navbar1Props) {
  return (
    <header className={sticky ? 'sticky top-0 z-40 bg-[var(--vd-bg)]/90 backdrop-blur' : ''}>
      <div className="container flex items-center justify-between py-4">
        <a className="font-semibold" href={logo?.url || '/'}>
          {logo?.title || 'Site'}
        </a>
        {menu && menu.length ? (
          <nav aria-label="Primary navigation" className="hidden gap-6 text-sm sm:flex">
            {menu.map((item) => (
              <a key={item.url} className="text-[var(--vd-muted-fg)] hover:text-[var(--vd-fg)]" href={item.url}>
                {item.title}
              </a>
            ))}
          </nav>
        ) : null}
        <div className="flex items-center gap-2">
          {secondaryButton ? (
            <a className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] px-3 py-2 text-sm font-semibold" href={secondaryButton.url}>
              {secondaryButton.title}
            </a>
          ) : null}
          {primaryButton ? (
            <a
              className="rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-3 py-2 text-sm font-semibold text-[var(--vd-primary-fg)]"
              href={primaryButton.url}
            >
              {primaryButton.title}
            </a>
          ) : null}
        </div>
      </div>
    </header>
  );
}

