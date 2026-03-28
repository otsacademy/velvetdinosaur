'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoReviewsWorkspace } from '@/components/demo/reviews/demo-reviews-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoReviewsProps = {
  mainSiteHref: string;
};

export function DemoReviews({ mainSiteHref }: DemoReviewsProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Reviews"
      activeNav="reviews"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The reviews demo has been reset.');
      }}
    >
      <div key={workspaceKey}>
        <DemoReviewsWorkspace />
      </div>
    </DemoWorkspaceShell>
  );
}
