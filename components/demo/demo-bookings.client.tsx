'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoBookingsWorkspace } from '@/components/demo/travel/demo-bookings-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoBookingsProps = {
  mainSiteHref: string;
};

export function DemoBookings({ mainSiteHref }: DemoBookingsProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Booking API"
      activeNav="bookings"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The booking demo has been reset.');
      }}
    >
      <DemoBookingsWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
