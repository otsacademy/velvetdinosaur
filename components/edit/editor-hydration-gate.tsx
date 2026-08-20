'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { EditorLoadingScreen } from '@/components/edit/editor-loading-screen';

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
    return <EditorLoadingScreen />;
  }

  return <>{children}</>;
}
