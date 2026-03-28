'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { DemoCalendarWorkspace } from '@/components/demo/calendar/demo-calendar-workspace';
import { DemoWorkspaceShell } from '@/components/demo/demo-workspace-shell.client';

type DemoCalendarProps = {
  mainSiteHref: string;
};

export function DemoCalendar({ mainSiteHref }: DemoCalendarProps) {
  const [workspaceKey, setWorkspaceKey] = useState(0);

  return (
    <DemoWorkspaceShell
      breadcrumbLabel="Calendar"
      activeNav="calendar"
      mainSiteHref={mainSiteHref}
      onResetDemo={() => {
        setWorkspaceKey((current) => current + 1);
        toast.success('The calendar demo has been reset.');
      }}
    >
      <DemoCalendarWorkspace key={workspaceKey} />
    </DemoWorkspaceShell>
  );
}
