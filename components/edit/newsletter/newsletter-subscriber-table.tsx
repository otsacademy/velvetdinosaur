import { Switch } from '@/components/ui/switch';
import { SubscriberStatusBadge } from '@/components/edit/newsletter/newsletter-workspace-ui';
import { formatDate, type PreferenceItem } from '@/components/edit/newsletter/newsletter-workspace.shared';

type NewsletterSubscriberTableProps = {
  items: PreferenceItem[];
  pendingSubscriberId: string;
  onToggle: (item: PreferenceItem, subscribed: boolean) => void;
};

export function NewsletterSubscriberTable({
  items,
  pendingSubscriberId,
  onToggle
}: NewsletterSubscriberTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[640px] divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Name</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Updated</th>
            <th className="px-3 py-2 text-right">Subscribed</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={5}>
                No subscribers found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 font-medium text-foreground">{item.email}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.firstName || '—'}</td>
                <td className="px-3 py-2">
                  <SubscriberStatusBadge status={item.status} />
                </td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(item.updatedAt)}</td>
                <td className="px-3 py-2 text-right">
                  <Switch
                    checked={item.status === 'subscribed'}
                    onCheckedChange={(checked) => onToggle(item, checked)}
                    disabled={pendingSubscriberId === item.id}
                  />
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
