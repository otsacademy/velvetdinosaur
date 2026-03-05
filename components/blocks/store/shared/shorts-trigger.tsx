'use client';

import type { PropsWithChildren } from 'react';
import type { VideoAsset } from '@/lib/content/types';
import { openShorts } from '@/lib/shorts/store';

type Props = {
  videos: VideoAsset[];
  startSlug?: string;
};

export function ShortsTrigger({ videos, startSlug, children }: PropsWithChildren<Props>) {
  return (
    <button
      type="button"
      onClick={() => openShorts({ shorts: videos, startSlug })}
      className="inline-flex items-center gap-2 rounded-[var(--vd-radius)] bg-[var(--vd-primary)] px-3 py-2 text-sm text-[var(--vd-primary-fg)] shadow hover:translate-y-[-1px] hover:shadow-md"
    >
      {children}
    </button>
  );
}
