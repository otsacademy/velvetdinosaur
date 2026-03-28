'use client';

import { Loader2 } from 'lucide-react';
import { supportModuleLabel, supportWaitingOnLabel } from '@/components/demo/support/demo-support.shared';
import type { SupportTicketSummary } from '@/components/demo/support/demo-support.shared';
import { formatDateTime } from '@/components/demo/support/demo-support.shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

function initials(value: string) {
  const parts = value
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 2);
  if (parts.length === 0) return 'NA';
  return parts.map((part) => part.charAt(0).toUpperCase()).join('');
}

function statusBadgeClass(status: string) {
  if (status === 'resolved' || status === 'closed') {
    return 'border-border bg-muted text-muted-foreground';
  }
  if (status === 'open') {
    return 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';
  }
  if (status === 'on_hold') {
    return 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300';
  }
  return 'border-sky-500/40 bg-sky-500/15 text-sky-700 dark:text-sky-300';
}

function waitingBadgeClass(waitingOn: SupportTicketSummary['waitingOn']) {
  return waitingOn === 'customer'
    ? 'border-amber-500/40 bg-amber-500/15 text-amber-700 dark:text-amber-300'
    : 'border-primary/30 bg-primary/10 text-primary';
}

export function DemoSupportTicketTable({
  tickets,
  selectedTicketId,
  isLoading,
  onSelectTicket
}: {
  tickets: SupportTicketSummary[];
  selectedTicketId: string;
  isLoading: boolean;
  onSelectTicket: (ticketId: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-2.5 font-medium">Reference</th>
            <th className="px-3 py-2.5 font-medium">Requester</th>
            <th className="px-3 py-2.5 font-medium">Subject</th>
            <th className="px-3 py-2.5 font-medium">Status</th>
            <th className="px-3 py-2.5 font-medium">Ownership</th>
            <th className="px-3 py-2.5 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                <Loader2 className="mx-auto mb-2 h-4 w-4 animate-spin" />
                Loading tickets...
              </td>
            </tr>
          ) : tickets.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                No requests found.
              </td>
            </tr>
          ) : (
            tickets.map((ticket) => {
              const requesterName = ticket.createdByName?.trim() || ticket.createdByEmail || 'Customer';
              const requesterAvatar = ticket.createdByAvatarUrl?.trim() || '';
              return (
                <tr
                  key={ticket.id}
                  className={`cursor-pointer border-t border-border/60 transition-colors hover:bg-muted/35 ${
                    selectedTicketId === ticket.id ? 'bg-muted/50' : ''
                  }`}
                  onClick={() => onSelectTicket(ticket.id)}
                >
                  <td className="px-3 py-2 font-medium">{ticket.ticketRef}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border/70">
                        {requesterAvatar ? <AvatarImage src={requesterAvatar} alt={requesterName} className="object-cover" /> : null}
                        <AvatarFallback className="text-[10px] font-semibold">{initials(requesterName)}</AvatarFallback>
                      </Avatar>
                      <span className="line-clamp-1 max-w-36 text-xs font-medium">{requesterName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="line-clamp-1 font-medium">{ticket.subject}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{supportModuleLabel(ticket.module)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={statusBadgeClass(ticket.status)}>{ticket.statusLabel}</Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={waitingBadgeClass(ticket.waitingOn)}>{supportWaitingOnLabel(ticket.waitingOn)}</Badge>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">{formatDateTime(ticket.lastActivityAt)}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
