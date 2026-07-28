import type { ReactNode } from 'react';

type AdminPageShellProps = {
  header: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({ header, children }: AdminPageShellProps) {
  return (
    <main className="min-h-screen bg-[var(--vd-bg)] pb-12">
      <div className="sticky top-0 z-30 border-b border-[var(--vd-border)] bg-[var(--vd-bg)]/95 backdrop-blur">
        <div className="container py-5">{header}</div>
      </div>
      <div className="container space-y-8 py-8">{children}</div>
    </main>
  );
}
