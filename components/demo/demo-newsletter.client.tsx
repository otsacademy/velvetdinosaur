'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoNewsletterWorkspace } from '@/components/demo/newsletter/demo-newsletter-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoNewsletterProps = {
  mainSiteHref: string;
};

export function DemoNewsletter({ mainSiteHref }: DemoNewsletterProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Newsletter"
      activeNav="newsletter"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The newsletter demo has been reset.');
      }}
    >
      <div key={workspaceKey}>
        <DemoNewsletterWorkspace />
      </div>
    </DemoWorkspaceShell>
  );
}
