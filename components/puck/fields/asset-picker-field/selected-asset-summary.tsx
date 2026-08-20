/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { resolveAssetImageUrl } from '@/lib/uploads';

export function SelectedAssetSummary({
  value,
  label
}: {
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--vd-border)] bg-white/70 p-2">
      <div className="h-16 w-16 overflow-hidden rounded-md bg-[var(--vd-muted)]/50">
        <img
          src={resolveAssetImageUrl(value, { width: 160, height: 160, fit: 'cover' })}
          alt="Selected asset"
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 text-[11px] text-[var(--vd-muted-fg)]">
        <p className="text-xs font-medium text-[var(--vd-fg)]">Selected asset</p>
        <p className="truncate">{label}</p>
      </div>
    </div>
  );
}

