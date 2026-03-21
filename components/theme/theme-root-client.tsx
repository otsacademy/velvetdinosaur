'use client';

import type { ReactNode } from 'react';
import type { ThemeStatePayload } from 'tweakcn-ui';
import { ThemeRoot, ThemeScript } from 'tweakcn-ui/client';

const DEFAULT_SKIP_FONTS = ['PT Sans', 'Space Grotesk', 'Bebas Neue', 'JetBrains Mono'];

type ThemeRootClientProps = {
  children: ReactNode;
  initialPayload?: ThemeStatePayload | null;
  storageKey?: string;
};

export function ThemeRootClient({ children, initialPayload, storageKey }: ThemeRootClientProps) {
  const initial = initialPayload ?? undefined;
  const key = storageKey || 'tweakcn-css-vars';

  return (
    <>
      <ThemeScript
        initialPayload={initial}
        localStorageKey={key}
        skipGoogleFonts={DEFAULT_SKIP_FONTS}
        fontTargets={{ sans: ['body'], serif: ['h1', 'h2', 'h3'], mono: ['code', 'pre'] }}
      />
      <ThemeRoot
        initialThemePayload={initial}
        localStorageKey={key}
        skipGoogleFonts={DEFAULT_SKIP_FONTS}
        tailwindVersion="4"
        fontTargets={{ sans: ['body'], serif: ['h1', 'h2', 'h3'], mono: ['code', 'pre'] }}
      >
        {children}
      </ThemeRoot>
    </>
  );
}
