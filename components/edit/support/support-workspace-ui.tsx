'use client';

import { SUPPORT_TICKET_CATEGORIES, SUPPORT_TICKET_STATUSES } from '@/lib/support/constants';
import type { SupportTicketStatus, SupportWaitingOn } from '@/components/edit/support/support-workspace.shared';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type SupportWorkspaceTab = 'my-requests' | 'report-problem' | 'request-feature' | 'past-requests';

export const SUPPORT_WORKSPACE_TABS: Array<{ value: SupportWorkspaceTab; label: string }> = [
  { value: 'my-requests', label: 'My Requests' },
  { value: 'report-problem', label: 'Report a Problem' },
  { value: 'request-feature', label: 'Request a Feature' },
  { value: 'past-requests', label: 'Past Requests' }
];

export function SupportTicketQueueFilters({
  statusFilter,
  categoryFilter,
  waitingOnFilter,
  query,
  onStatusFilterChange,
  onCategoryFilterChange,
  onWaitingOnFilterChange,
  onQueryChange
}: {
  statusFilter: 'all' | SupportTicketStatus;
  categoryFilter: 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'];
  waitingOnFilter: 'all' | SupportWaitingOn;
  query: string;
  onStatusFilterChange: (value: 'all' | SupportTicketStatus) => void;
  onCategoryFilterChange: (value: 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key']) => void;
  onWaitingOnFilterChange: (value: 'all' | SupportWaitingOn) => void;
  onQueryChange: (value: string) => void;
}) {
  const customerVisibleCategories = SUPPORT_TICKET_CATEGORIES.filter((item) => item.customerVisible !== false);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Select value={statusFilter} onValueChange={(value) => onStatusFilterChange(value as 'all' | SupportTicketStatus)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          {SUPPORT_TICKET_STATUSES.map((item) => (
            <SelectItem key={item} value={item}>
              {item.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={categoryFilter}
        onValueChange={(value) =>
          onCategoryFilterChange(value as 'all' | (typeof SUPPORT_TICKET_CATEGORIES)[number]['key'])
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All categories</SelectItem>
          {customerVisibleCategories.map((item) => (
            <SelectItem key={item.key} value={item.key}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={waitingOnFilter} onValueChange={(value) => onWaitingOnFilterChange(value as 'all' | SupportWaitingOn)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All ownership</SelectItem>
          <SelectItem value="support">We are working on this</SelectItem>
          <SelectItem value="customer">Needs your response</SelectItem>
        </SelectContent>
      </Select>

      <Input
        placeholder="Search by reference or subject"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </div>
  );
}
