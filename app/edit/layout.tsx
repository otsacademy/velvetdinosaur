import './editor.css';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { unstable_noStore } from 'next/cache';
import { EditorHydrationGate } from '@/components/edit/editor-hydration-gate';
import { EditorLoadingScreen } from '@/components/edit/editor-loading-screen';
import { ChunkReloadGuard } from '@/components/edit/chunk-reload-guard.client';
import { ThemeRootClient } from '@/components/theme/theme-root-client';
import { DisableThemeTypography } from '@/components/theme/disable-typography';
import { Toaster } from '@/components/ui/sonner';
import { getThemePayload } from '@/lib/theme';

export default function EditLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<EditorLoadingScreen />}>
      <EditLayoutContent>{children}</EditLayoutContent>
    </Suspense>
  );
}

async function EditLayoutContent({
  children
}: {
  children: React.ReactNode;
}) {
  unstable_noStore();
  await connection();
  const payload = await getThemePayload();
  const slug = process.env.SITE_SLUG || 'default';
  const storageKey = `tweakcn-css-vars:${slug}:v2`;

  return (
    <EditorHydrationGate>
      <ThemeRootClient initialPayload={payload} storageKey={storageKey}>
        <div className="vd-editor min-h-screen">
          {children}
          <ChunkReloadGuard />
          <DisableThemeTypography />
          <Toaster />
        </div>
      </ThemeRootClient>
    </EditorHydrationGate>
  );
}
