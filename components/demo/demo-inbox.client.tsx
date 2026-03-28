'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoInboxWorkspace } from '@/components/demo/inbox/demo-inbox-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoInboxProps = {
  mainSiteHref: string;
};

export function DemoInbox({ mainSiteHref }: DemoInboxProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Inbox"
      activeNav="inbox"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The inbox demo has been reset.');
      }}
    >
      <DemoInboxWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
