import '../../edit/editor.css';
import { Suspense } from 'react';
import { connection } from 'next/server';
import { EditorHydrationGate } from '@/components/edit/editor-hydration-gate';
import { ChunkReloadGuard } from '@/components/edit/chunk-reload-guard.client';
import { ThemeRootClient } from '@/components/theme/theme-root-client';
import { DisableThemeTypography } from '@/components/theme/disable-typography';
import { Toaster } from '@/components/ui/sonner';
import { getThemePayload } from '@/lib/theme';

export default function DemoNewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>}>
      <DemoNewsLayoutContent>{children}</DemoNewsLayoutContent>
    </Suspense>
  );
}

async function DemoNewsLayoutContent({ children }: { children: React.ReactNode }) {
  await connection();
  const payload = await getThemePayload();
  const storageKey = 'tweakcn-css-vars:velvetdinosaur:demo-editor';

  return (
    <EditorHydrationGate>
      <ThemeRootClient initialPayload={payload} storageKey={storageKey}>
        <div className="min-h-screen bg-[var(--vd-bg)] text-[var(--vd-fg)]">
          {children}
          <ChunkReloadGuard />
          <DisableThemeTypography />
          <Toaster />
        </div>
      </ThemeRootClient>
    </EditorHydrationGate>
  );
}
