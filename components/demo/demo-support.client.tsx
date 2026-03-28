'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoSupportWorkspace } from '@/components/demo/support/demo-support-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoSupportProps = {
  mainSiteHref: string;
};

export function DemoSupport({ mainSiteHref }: DemoSupportProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Support Portal"
      activeNav="support"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The support portal demo has been reset.');
      }}
    >
      <DemoSupportWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
