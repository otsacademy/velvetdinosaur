import type { ReactNode } from 'react';

/**
 * Site-owned visual wrapper shared by the public renderer, Puck canvas and
 * authenticated preview. Prospect builds replace this file with their fonts,
 * stylesheet import and root design class.
 */
export function SiteDesignFrame({ children }: { children: ReactNode }) {
  return <div data-site-design-frame>{children}</div>;
}
