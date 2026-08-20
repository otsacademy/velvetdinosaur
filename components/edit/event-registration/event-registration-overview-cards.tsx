'use client';

import { type ComponentType } from 'react';
import { CalendarDays, CheckCircle2, Clock3, Send } from 'lucide-react';
import {
  type EventCampaignStatus,
  type EventRegistrationStatus,
  type OverviewPayload
} from '@/components/edit/event-registration/event-registration-workspace.shared';
import { cn } from '@/lib/utils';

type EventRegistrationOverviewCardsProps = {
  overview: OverviewPayload;
  registrantStatus: 'all' | EventRegistrationStatus;
  campaignStatusFilter: 'all' | EventCampaignStatus;
  onResetFilters: () => void;
  onToggleRegistrantStatus: (status: EventRegistrationStatus) => void;
  onToggleCampaignStatus: (status: EventCampaignStatus) => void;
};

type MetricCardProps = {
  title: string;
  value: number;
  description: string;
  icon: ComponentType<{ className?: string }>;
  active?: boolean;
  accent?: 'default' | 'warning' | 'success' | 'info';
  onClick: () => void;
};

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  active = false,
  accent = 'default',
  onClick
}: MetricCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center justify-between gap-3 rounded-xl border bg-[var(--vd-card)] p-4 text-left transition-colors',
        active
          ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/40 shadow-sm'
          : 'border-[var(--vd-border)] hover:bg-[var(--vd-muted)]/20'
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--vd-muted-fg)]">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-[var(--vd-fg)]">{value}</p>
        <p className="mt-1 text-xs text-[var(--vd-muted-fg)]">{description}</p>
      </div>
      <div
        className={cn(
          'rounded-full p-2.5',
          accent === 'success'
            ? 'bg-emerald-500/12 text-emerald-600'
            : accent === 'warning'
              ? 'bg-amber-500/14 text-amber-600'
              : accent === 'info'
                ? 'bg-sky-500/12 text-sky-700'
                : 'bg-[var(--vd-muted)] text-[var(--vd-fg)]'
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
    </button>
  );
}

export function EventRegistrationOverviewCards({
  overview,
  registrantStatus,
  campaignStatusFilter,
  onResetFilters,
  onToggleRegistrantStatus,
  onToggleCampaignStatus
}: EventRegistrationOverviewCardsProps) {
  const noQuickFilters = registrantStatus === 'all' && campaignStatusFilter === 'all';

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <MetricCard
        title="Local Events"
        value={overview.counts.localEvents}
        description={noQuickFilters ? 'Showing all outreach data' : 'Clear active quick filters'}
        icon={CalendarDays}
        accent="info"
        active={noQuickFilters}
        onClick={onResetFilters}
      />
      <MetricCard
        title="Pending"
        value={overview.counts.pending}
        description="Filter pending registrants"
        icon={Clock3}
        accent="warning"
        active={registrantStatus === 'pending'}
        onClick={() => onToggleRegistrantStatus('pending')}
      />
      <MetricCard
        title="Confirmed"
        value={overview.counts.confirmed}
        description="Filter confirmed registrants"
        icon={CheckCircle2}
        accent="success"
        active={registrantStatus === 'confirmed'}
        onClick={() => onToggleRegistrantStatus('confirmed')}
      />
      <MetricCard
        title="Queued Campaigns"
        value={overview.campaignStatus.queued}
        description="Show queued campaigns"
        icon={Send}
        active={campaignStatusFilter === 'queued'}
        onClick={() => onToggleCampaignStatus('queued')}
      />
    </div>
  );
}
