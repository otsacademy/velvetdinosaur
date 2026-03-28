'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoContactTemplatesWorkspace } from '@/components/demo/contact/demo-contact-templates-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoContactTemplatesProps = {
  mainSiteHref: string;
};

export function DemoContactTemplates({ mainSiteHref }: DemoContactTemplatesProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Contact Templates"
      activeNav="contact-templates"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The contact templates demo has been reset.');
      }}
    >
      <div key={workspaceKey}>
        <DemoContactTemplatesWorkspace />
      </div>
    </DemoWorkspaceShell>
  );
}
