import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CampaignStatusBadge } from '@/components/demo/newsletter/demo-newsletter-ui';
import { formatCampaignMeta } from '@/components/demo/newsletter/demo-newsletter-helpers';
import { cn } from '@/lib/utils';
import type { DemoNewsletterCampaign } from '@/lib/demo-newsletter-seed';

type DemoNewsletterCampaignListProps = {
  items: DemoNewsletterCampaign[];
  selectedCampaignId: string;
  onSelect: (campaign: DemoNewsletterCampaign) => void;
};

export function DemoNewsletterCampaignList({
  items,
  selectedCampaignId,
  onSelect
}: DemoNewsletterCampaignListProps) {
  return (
    <Card className="border-[var(--vd-border)] shadow-none">
      <CardHeader>
        <CardTitle>Campaigns</CardTitle>
        <CardDescription>Draft, queued, and completed sends in this demo session.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((campaign) => (
          <button
            key={campaign.id}
            type="button"
            onClick={() => onSelect(campaign)}
            className={cn(
              'w-full rounded-[1.25rem] border p-4 text-left transition-colors',
              selectedCampaignId === campaign.id
                ? 'border-[var(--vd-ring)] bg-[var(--vd-muted)]/50'
                : 'border-[var(--vd-border)] bg-[var(--vd-card)] hover:bg-[var(--vd-muted)]/40'
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{campaign.name}</p>
              <CampaignStatusBadge status={campaign.status} />
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--vd-muted-fg)]">{campaign.subject}</p>
            <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-[var(--vd-muted-fg)]">{formatCampaignMeta(campaign)}</p>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
