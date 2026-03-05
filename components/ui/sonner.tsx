'use client';

import type { CSSProperties } from 'react';
import { CircleCheck, Info, Loader2, OctagonX, TriangleAlert } from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

export function Toaster({ theme = 'light', ...props }: ToasterProps) {
  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheck className="h-4 w-4" />,
        info: <Info className="h-4 w-4" />,
        warning: <TriangleAlert className="h-4 w-4" />,
        error: <OctagonX className="h-4 w-4" />,
        loading: <Loader2 className="h-4 w-4 animate-spin" />
      }}
      style={
        {
          '--normal-bg': 'var(--vd-bg)',
          '--normal-text': 'var(--vd-fg)',
          '--normal-border': 'var(--vd-border)',
          '--border-radius': 'var(--vd-radius)'
        } as CSSProperties
      }
      {...props}
    />
  );
}
