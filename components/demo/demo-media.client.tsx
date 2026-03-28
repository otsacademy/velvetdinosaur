'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { MediaLibraryClient } from '@/components/edit/media-library.client';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';
import { resetDemoEditorAssets } from '@/lib/demo-editor-assets';

type DemoMediaProps = {
  mainSiteHref: string;
};

export function DemoMedia({ mainSiteHref }: DemoMediaProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Media Library"
      activeNav="media"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        resetDemoEditorAssets();
        setWorkspaceKey((current) => current + 1);
        toast.success('The media library demo has been reset.');
      }}
    >
      <div key={workspaceKey} className="py-2">
        <MediaLibraryClient />
      </div>
    </DemoWorkspaceShell>
  );
}
