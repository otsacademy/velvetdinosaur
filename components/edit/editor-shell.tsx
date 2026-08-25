'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data } from '@puckeditor/core';
import { EditorLoadingScreen } from '@/components/edit/editor-loading-screen';
import type { SiteChrome } from '@/lib/site-chrome';

const EditorClient = dynamic(
  () => import('./editor-client').then((mod) => mod.EditorClient),
  {
    ssr: false,
    loading: () => <EditorLoadingScreen />
  }
);

type EditorShellProps = {
  initialData?: Data;
  initialSlug?: string;
  initialChrome?: SiteChrome | null;
  isAdmin?: boolean;
  activeProfile?: {
    primaryChapterSlug: string;
    chapterSlugs: string[];
  } | null;
};

export function EditorShell({
  initialData,
  initialSlug,
  initialChrome = null,
  isAdmin = false,
  activeProfile = null
}: EditorShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <EditorLoadingScreen />;
  }

  return (
    <EditorClient
      initialData={initialData}
      initialSlug={initialSlug}
      initialChrome={initialChrome}
      isAdmin={isAdmin}
      activeProfile={activeProfile}
    />
  );
}
