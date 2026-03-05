import './admin.css';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { ThemeRootClient } from '@/components/theme/theme-root-client';
import { DisableThemeTypography } from '@/components/theme/disable-typography';
import { Toaster } from '@/components/ui/sonner';
import { ChunkReloadGuard } from '@/components/edit/chunk-reload-guard.client';
import { getThemePayload } from '@/lib/theme';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading admin...</div>}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  await connection();
  const payload = await getThemePayload();
  const slug = process.env.SITE_SLUG || 'default';
  const storageKey = `tweakcn-css-vars:${slug}:v2`;

  return (
    <ThemeRootClient initialPayload={payload} storageKey={storageKey}>
      {children}
      <ChunkReloadGuard />
      <DisableThemeTypography />
      <Toaster />
    </ThemeRootClient>
  );
}
