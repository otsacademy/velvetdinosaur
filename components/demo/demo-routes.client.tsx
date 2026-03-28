'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoRoutesWorkspace } from '@/components/demo/travel/demo-routes-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoRoutesProps = {
  mainSiteHref: string;
};

export function DemoRoutes({ mainSiteHref }: DemoRoutesProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Routes"
      activeNav="routes"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The routes demo has been reset.');
      }}
    >
      <DemoRoutesWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
