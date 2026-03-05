'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import type { Data } from '@measured/puck';

const EditorClient = dynamic(
  () => import('./editor-client').then((mod) => mod.EditorClient),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>
    )
  }
);

type EditorShellProps = {
  initialData?: Data;
  initialSlug?: string;
};

export function EditorShell({ initialData, initialSlug }: EditorShellProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="p-6 text-sm text-[var(--vd-muted-fg)]">Loading editor...</div>
    );
  }

  return <EditorClient initialData={initialData} initialSlug={initialSlug} />;
}
