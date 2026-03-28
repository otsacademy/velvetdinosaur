'use client';

import type { ReactNode } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { DemoTravelInventoryKind } from '@/lib/demo-travel-seed';

export function formatTravelMoney(amount?: number | null, currency = 'GBP', isStartingFrom = false) {
  if (typeof amount !== 'number') return 'n/a';
  const formatted = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  return isStartingFrom ? `${formatted} from` : formatted;
}

export function inventoryKindLabel(kind: DemoTravelInventoryKind) {
  return kind === 'stay' ? 'Stay' : 'Route';
}

export function InventoryKindBadge({ kind }: { kind: DemoTravelInventoryKind }) {
  return (
    <Badge
      className={cn(
        'border-transparent',
        kind === 'stay'
          ? 'bg-[color-mix(in_oklch,var(--vd-primary)_12%,var(--vd-card))] text-[var(--vd-primary)]'
          : 'bg-[color-mix(in_oklch,var(--vd-secondary)_34%,var(--vd-card))] text-[var(--vd-secondary-fg)]'
      )}
    >
      {inventoryKindLabel(kind)}
    </Badge>
  );
}

export function DemoTravelStatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--vd-fg)]">{value}</p>
      <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">{detail}</p>
    </div>
  );
}

export function DemoTravelWorkspaceIntro({
  eyebrow,
  title,
  description,
  imageSrc,
  imageAlt,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  children?: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] border border-[var(--vd-border)] bg-[linear-gradient(145deg,color-mix(in_oklch,var(--vd-card)_92%,white),color-mix(in_oklch,var(--vd-primary)_5%,var(--vd-bg)))]">
      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--vd-primary)]">{eyebrow}</p>
          <div className="space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--vd-fg)]">{title}</h2>
            <p className="max-w-3xl text-sm leading-7 text-[var(--vd-muted-fg)]">{description}</p>
          </div>
          {children}
        </div>

        <div className="overflow-hidden rounded-[1.5rem] border border-[var(--vd-border)] bg-[var(--vd-bg)]/70 p-2">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={1600}
            height={1000}
            className="h-auto w-full rounded-[1.25rem] object-cover"
          />
        </div>
      </div>
    </section>
  );
}
