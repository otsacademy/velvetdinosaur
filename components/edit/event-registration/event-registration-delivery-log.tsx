import { Badge } from '@/components/ui/badge';
import {
  formatDate,
  type CampaignItem,
  type DeliveryItem
} from '@/components/edit/event-registration/event-registration-workspace.shared';

type EventRegistrationDeliveryLogProps = {
  items: DeliveryItem[];
  campaigns: CampaignItem[];
  loading?: boolean;
};

function statusBadge(status: DeliveryItem['status']) {
  if (status === 'sent') return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Sent</Badge>;
  if (status === 'failed') return <Badge variant="destructive">Failed</Badge>;
  if (status === 'pending') return <Badge variant="outline">Pending</Badge>;
  return <Badge variant="secondary">Skipped: Unconfirmed</Badge>;
}

export function EventRegistrationDeliveryLog({
  items,
  campaigns,
  loading = false
}: EventRegistrationDeliveryLogProps) {
  const campaignNames = new Map(campaigns.map((campaign) => [campaign.id, campaign.name]));

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[880px] divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Campaign</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Sent</th>
            <th className="px-3 py-2">Postmark ID</th>
            <th className="px-3 py-2">Error</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {loading ? (
            <tr>
              <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={6}>
                Loading delivery rows…
              </td>
            </tr>
          ) : null}
          {!loading && items.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={6}>
                No delivery rows found.
              </td>
            </tr>
          ) : null}
          {!loading
            ? items.map((item) => (
                <tr key={item.id}>
                  <td className="px-3 py-2 font-medium text-foreground">{item.email}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {campaignNames.get(item.campaignId) || item.campaignId}
                  </td>
                  <td className="px-3 py-2">{statusBadge(item.status)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{formatDate(item.sentAt || item.createdAt)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.postmarkMessageId || '—'}</td>
                  <td className="px-3 py-2 text-muted-foreground">{item.error || '—'}</td>
                </tr>
              ))
            : null}
        </tbody>
      </table>
    </div>
  );
}
