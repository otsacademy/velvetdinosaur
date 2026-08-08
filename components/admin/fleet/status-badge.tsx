import {
  BadgeCheck,
  CircleAlert,
  CircleHelp,
  CircleX,
  Clock3,
  ScanSearch,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { BadgeClass } from '@/lib/fleet/schema';

const config: Record<BadgeClass, {
  label: string;
  icon: typeof BadgeCheck;
  className: string;
}> = {
  fresh: {
    label: 'Fresh',
    icon: Clock3,
    className: 'border-[var(--vd-status-success-border)] bg-[var(--vd-status-success-bg)] text-[var(--vd-status-success-fg)]'
  },
  verified: {
    label: 'Verified',
    icon: ShieldCheck,
    className: 'border-[var(--vd-status-success-border)] bg-[var(--vd-status-success-bg)] text-[var(--vd-status-success-fg)]'
  },
  remediated: {
    label: 'Remediated',
    icon: BadgeCheck,
    className: 'border-[var(--vd-status-success-border)] bg-[var(--vd-status-success-bg)] text-[var(--vd-status-success-fg)]'
  },
  stale: {
    label: 'Stale',
    icon: CircleAlert,
    className: 'border-[var(--vd-status-warning-border)] bg-[var(--vd-status-warning-bg)] text-[var(--vd-status-warning-fg)]'
  },
  'exception-open': {
    label: 'Exception open',
    icon: CircleAlert,
    className: 'border-[var(--vd-status-warning-border)] bg-[var(--vd-status-warning-bg)] text-[var(--vd-status-warning-fg)]'
  },
  blocked: {
    label: 'Blocked',
    icon: CircleX,
    className: 'border-[var(--vd-status-danger-border)] bg-[var(--vd-status-danger-bg)] text-[var(--vd-status-danger-fg)]'
  },
  inferred: {
    label: 'Inferred',
    icon: ScanSearch,
    className: 'border-[var(--vd-status-info-border)] bg-[var(--vd-status-info-bg)] text-[var(--vd-status-info-fg)]'
  },
  unknown: {
    label: 'Unknown',
    icon: CircleHelp,
    className: 'border-[var(--vd-border)] bg-[var(--vd-muted)] text-[var(--vd-fg)]'
  }
};

export function StatusBadge({ status }: { status: BadgeClass }) {
  const selected = config[status];
  const Icon = selected.icon;
  return (
    <Badge variant="outline" className={`gap-1.5 whitespace-nowrap ${selected.className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {selected.label}
    </Badge>
  );
}
