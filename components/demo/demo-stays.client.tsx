'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoStaysWorkspace } from '@/components/demo/travel/demo-stays-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoStaysProps = {
  mainSiteHref: string;
};

export function DemoStays({ mainSiteHref }: DemoStaysProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Stays"
      activeNav="stays"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The stays demo has been reset.');
      }}
    >
      <DemoStaysWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
