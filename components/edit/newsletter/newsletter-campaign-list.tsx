import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignStatusBadge } from '@/components/edit/newsletter/newsletter-workspace-ui';
import { formatDate, type CampaignItem } from '@/components/edit/newsletter/newsletter-workspace.shared';
import { cn } from '@/lib/utils';

type NewsletterCampaignListProps = {
  items: CampaignItem[];
  selectedCampaignId: string;
  isLoading?: boolean;
  onSelect: (campaign: CampaignItem) => void;
};

export function NewsletterCampaignList({
  items,
  selectedCampaignId,
  isLoading = false,
  onSelect
}: NewsletterCampaignListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
        <CardDescription>Draft, queued, and completed sends.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? <p className="text-sm text-muted-foreground">Loading campaigns…</p> : null}
        {items.length === 0 ? <p className="text-sm text-muted-foreground">No campaigns yet.</p> : null}
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
