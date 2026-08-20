import { Badge } from '@/components/ui/badge';
import { formatDate, type RegistrationItem } from '@/components/edit/event-registration/event-registration-workspace.shared';

type EventRegistrationRegistrantTableProps = {
  items: RegistrationItem[];
};

function statusBadge(status: RegistrationItem['status']) {
  if (status === 'confirmed') {
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">Confirmed</Badge>;
  }
  if (status === 'cancelled') {
    return <Badge variant="outline">Cancelled</Badge>;
  }
  return <Badge variant="secondary">Pending confirmation</Badge>;
}

export function EventRegistrationRegistrantTable({ items }: EventRegistrationRegistrantTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full min-w-[880px] divide-y divide-border text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Registrant</th>
            <th className="px-3 py-2">Email</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Requested</th>
            <th className="px-3 py-2">Confirmed</th>
            <th className="px-3 py-2">Source</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr>
              <td className="px-3 py-4 text-sm text-muted-foreground" colSpan={6}>
                No registrations found.
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr key={item.id}>
                <td className="px-3 py-2 font-medium text-foreground">{item.fullName || item.firstName || '—'}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.email}</td>
                <td className="px-3 py-2">{statusBadge(item.status)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(item.createdAt)}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(item.confirmedAt)}</td>
                <td className="px-3 py-2 text-muted-foreground">{item.source || '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
