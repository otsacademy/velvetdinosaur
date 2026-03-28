'use client';

import { ResponsiveContainer, Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts';
import { Inbox, MessageCircleReply, CheckCircle2, Clock3, type LucideIcon } from 'lucide-react';
import { supportModuleLabel } from '@/components/demo/support/demo-support.shared';
import type { SupportOverview, SupportTicketSummary } from '@/components/demo/support/demo-support.shared';
import { formatDateTime } from '@/components/demo/support/demo-support.shared';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

function StatCard({
  label,
  value,
  icon: Icon,
  iconClassName
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  iconClassName: string;
}) {
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center justify-between text-sm">
          <span>{label}</span>
          <span className={`inline-flex h-7 w-7 items-center justify-center rounded-md border ${iconClassName}`}>
            <Icon className="h-4 w-4" />
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

function RecentTicketTable({
  tickets,
  onSelectTicket
}: {
  tickets: SupportTicketSummary[];
  onSelectTicket: (ticket: SupportTicketSummary) => void;
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
            <th className="px-3 py-2.5 font-medium">Updated</th>
          </tr>
        </thead>
        <tbody>
          {tickets.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                No request activity yet.
              </td>
            </tr>
          ) : (
            tickets.slice(0, 10).map((ticket) => {
              const requesterName = ticket.createdByName?.trim() || ticket.createdByEmail || 'Customer';
              const requesterAvatar = ticket.createdByAvatarUrl?.trim() || '';
              return (
                <tr
                  key={ticket.id}
                  className="cursor-pointer border-t border-border/60 hover:bg-muted/35"
                  onClick={() => onSelectTicket(ticket)}
                >
                  <td className="px-3 py-2 font-medium">{ticket.ticketRef}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border/70">
                        {requesterAvatar ? <AvatarImage src={requesterAvatar} alt={requesterName} className="object-cover" /> : null}
                        <AvatarFallback className="text-[10px] font-semibold">{initials(requesterName)}</AvatarFallback>
                      </Avatar>
                      <span className="line-clamp-1 max-w-32 text-xs font-medium">{requesterName}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <p className="line-clamp-1 font-medium">{ticket.subject}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{supportModuleLabel(ticket.module)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <Badge className={statusBadgeClass(ticket.status)}>{ticket.statusLabel}</Badge>
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

export function DemoSupportDashboard({
  overview,
  onSelectRecentTicket
}: {
  overview: SupportOverview;
  onSelectRecentTicket: (ticket: SupportTicketSummary) => void;
}) {
  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="We're working on"
          value={overview.totals.requiringOurInput}
          icon={Clock3}
          iconClassName="border-primary/20 bg-primary/10 text-primary"
        />
        <StatCard
          label="Needs your response"
          value={overview.totals.requiringYourInput}
          icon={MessageCircleReply}
          iconClassName="border-amber-500/30 bg-amber-500/15 text-amber-700 dark:text-amber-300"
        />
        <StatCard
          label="Open Requests"
          value={overview.totals.open}
          icon={Inbox}
          iconClassName="border-sky-500/30 bg-sky-500/15 text-sky-700 dark:text-sky-300"
        />
        <StatCard
          label="Completed Requests"
          value={overview.totals.closed}
          icon={CheckCircle2}
          iconClassName="border-border bg-muted text-muted-foreground"
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Monthly Request Volume</CardTitle>
          <CardDescription>Requests created during the current calendar year.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.monthly}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--card-foreground)'
                  }}
                />
                <Bar dataKey="count" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Click a request to open its details.</CardDescription>
        </CardHeader>
        <CardContent>
          <RecentTicketTable tickets={overview.recentTickets} onSelectTicket={onSelectRecentTicket} />
        </CardContent>
      </Card>
    </section>
  );
}
