'use client';

import { useLayoutEffect } from 'react';

const TYPOGRAPHY_STYLE_ID = 'tweakcn-typography';

export function DisableThemeTypography() {
  useLayoutEffect(() => {
    const disable = () => {
      const style = document.getElementById(TYPOGRAPHY_STYLE_ID) as HTMLStyleElement | null;
      if (!style) return;
      style.disabled = true;
      style.remove();
    };

    disable();

    const observer = new MutationObserver(disable);
    observer.observe(document.head, { childList: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
