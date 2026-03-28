'use client';

import '@measured/puck/no-external.css';

import Image from 'next/image';
import { Puck, type Data } from '@measured/puck';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { Button } from '@/components/ui/button';
import { DemoOnboardingControls } from '@/components/demo/onboarding/demo-onboarding-controls.client';
import { PuckEditorShell } from '@/components/puck/editor/PuckEditorShell';
import { DemoThemeEditorDrawer } from '@/components/demo/demo-theme-editor-drawer.client';
import { resetDemoEditorAssets } from '@/lib/demo-editor-assets';
import { editorConfig } from '@/puck/editor-config';
import { defaultData } from '@/puck/defaults';
import { sanitizeData } from '@/puck/validate';

const DEMO_THEME_STORAGE_KEY = 'tweakcn-css-vars:velvetdinosaur:demo-editor';

type DemoEditorClientProps = {
  initialSlug?: string;
  closeHref?: string;
  mainSiteHref?: string;
  initialData?: Data;
  initialThemePayload?: ThemeStatePayload | null;
};

function formatTitle(slug: string) {
  if (slug === 'home') return 'Home';
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function DemoEditorClient({
  initialSlug = 'new-page',
  closeHref = '/',
  mainSiteHref = '/',
  initialData,
  initialThemePayload
}: DemoEditorClientProps) {
  const router = useRouter();
  const seedData = useMemo(
    () => sanitizeData(initialData ?? defaultData(initialSlug)),
    [initialData, initialSlug]
  );
  const [data, setData] = useState<Data>(seedData);

  useEffect(() => {
    try {
      window.localStorage.removeItem(DEMO_THEME_STORAGE_KEY);
    } catch {
      // Ignore storage access issues in restricted browser contexts.
    }
    resetDemoEditorAssets();
    return () => {
      try {
        window.localStorage.removeItem(DEMO_THEME_STORAGE_KEY);
      } catch {
        // Ignore storage access issues in restricted browser contexts.
      }
      resetDemoEditorAssets();
    };
  }, []);

  useEffect(() => {
    setData(seedData);
  }, [seedData]);

  const handleSave = () => {
    toast.info('This is a live demo, so changes are not saved.');
  };

  const handlePublish = () => {
    toast.info('Publishing is switched off in this demo.');
  };

  const handleReset = () => {
    setData(seedData);
    resetDemoEditorAssets();
    toast.success('The demo page has been reset.');
  };

  const handleClose = () => {
    router.push(closeHref);
  };

  const title = formatTitle(initialSlug);
  const canvasHeightClassName = 'h-[calc(100dvh-9.5rem)] min-h-[32rem]';
  const canvasPaddingClassName = 'px-6 py-6';
  const canvasClassName = `mx-auto w-full max-w-6xl ${canvasPaddingClassName} ${canvasHeightClassName}`;
  const brandLink = (
    <>
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="h-9 w-9 rounded-full border border-[var(--vd-border)] p-0 hover:bg-[var(--vd-muted)]"
      >
        <a href={mainSiteHref} aria-label="Back to Velvet Dinosaur home page">
          <Image
            src="/logo.webp"
            alt="Velvet Dinosaur"
            width={28}
            height={28}
            className="h-7 w-7 rounded-full object-contain"
          />
        </a>
      </Button>
      <DemoOnboardingControls pageKey="pages" />
    </>
  );

  return (
    <Puck config={editorConfig} data={data} onChange={(nextData) => setData(sanitizeData(nextData))}>
      <PuckEditorShell
        title={title}
        statusLabel="Demo workspace"
        headerActionAfterSave={brandLink}
        onSaveDraft={handleSave}
        onResetDraft={handleReset}
        onPublish={handlePublish}
        themePanel={
          <DemoThemeEditorDrawer
            initialSlug={initialSlug}
            previewData={data}
            initialPayload={initialThemePayload}
          />
        }
        onClose={handleClose}
      >
        <div className={canvasClassName}>
          <Puck.Preview />
        </div>
      </PuckEditorShell>
    </Puck>
  );
}
