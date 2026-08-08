import type { ReactNode } from 'react';

type AdminPageShellProps = {
  header: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ header, children }: AdminPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--vd-bg)] pb-12">
      <a
        href="#admin-main-content"
        className="fixed left-4 top-3 z-50 -translate-y-20 rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-4 py-2 text-sm font-semibold text-[var(--vd-primary-fg)] transition-transform focus:translate-y-0"
      >
        Skip to admin content
      </a>
      <div className="sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/95 backdrop-blur">
        <div className="container py-5">{header}</div>
      </div>
      <div id="admin-main-content" className="container space-y-8 py-8" tabIndex={-1}>
        {children}
      </div>
    </main>
  );
}
