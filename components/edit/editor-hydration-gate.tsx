'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

type EditorHydrationGateProps = {
  children: ReactNode;
};

export function EditorHydrationGate({ children }: EditorHydrationGateProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-6 text-sm text-[var(--vd-muted-fg)]">
        Loading editor...
      </div>
    );
  }

  return <>{children}</>;
}
