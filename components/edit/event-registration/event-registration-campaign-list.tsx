import { FileText, FunnelX } from 'lucide-react';
import { EventRegistrationEmptyState } from '@/components/edit/event-registration/event-registration-empty-state';
import { formatDate, type CampaignItem } from '@/components/edit/event-registration/event-registration-workspace.shared';
import { CampaignStatusBadge } from '@/components/edit/newsletter/newsletter-workspace-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type EventRegistrationCampaignListProps = {
  items: CampaignItem[];
  selectedCampaignId: string;
  statusFilter: 'all' | CampaignItem['status'];
  isLoading?: boolean;
  selectedEventTitle?: string;
  onClearFilter?: () => void;
  onSelect: (campaign: CampaignItem) => void;
};

export function EventRegistrationCampaignList({
  items,
  selectedCampaignId,
  statusFilter,
  isLoading = false,
  selectedEventTitle,
  onClearFilter,
  onSelect
}: EventRegistrationCampaignListProps) {
  const description =
    statusFilter === 'all'
      ? 'Updates and joining instructions for the selected event.'
      : `Showing ${statusFilter} campaigns for the selected event.`;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Event Campaigns</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {statusFilter !== 'all' && onClearFilter ? (
          <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onClearFilter}>
            <FunnelX className="h-3.5 w-3.5" />
            Clear filter
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading campaigns…</p> : null}
        {!isLoading && items.length === 0 ? (
          <EventRegistrationEmptyState
            icon={FileText}
            title={statusFilter === 'all' ? 'No campaigns yet' : `No ${statusFilter} campaigns`}
            description={
              statusFilter === 'all'
                ? selectedEventTitle
                  ? `Start with a draft for ${selectedEventTitle}, then queue updates or joining instructions when you are ready to send.`
                  : 'Choose a local-registration event to start drafting outreach.'
                : 'Clear the quick filter or create a new campaign draft for this event.'
            }
            className="min-h-[180px]"
          />
        ) : null}
        {items.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            className={cn(
              'w-full rounded-lg border p-3 text-left transition-colors',
              selectedCampaignId === campaign.id ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/30' : 'hover:bg-muted/30'
            )}
            onClick={() => onSelect(campaign)}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{campaign.name}</p>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{campaign.subject}</p>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <span className="capitalize">{campaign.campaignKind}</span>
              <span>Recipients: {campaign.recipientSnapshotCount}</span>
              <span>Sent: {campaign.sentCount}</span>
              <span>Failed: {campaign.failedCount}</span>
              <span>Skipped: {campaign.skippedCount}</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Scheduled: {formatDate(campaign.scheduledAt)}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
