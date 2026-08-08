import { CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/admin/fleet/status-badge';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatFleetTimestamp } from '@/lib/fleet/format';
import type { DashboardView } from '@/lib/fleet/schema';

function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] px-4 py-5 text-sm text-[var(--vd-muted-fg)]">
      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--vd-status-success-fg)]" aria-hidden="true" />
      {children}
    </div>
  );
}

export function RegistryDiscrepanciesTable({
  items
}: {
  items: DashboardView['report']['registryDiscrepancies'];
}) {
  if (items.length === 0) return <EmptyState>No registry discrepancies match this view.</EmptyState>;
  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)]">
      <Table className="min-w-[52rem] bg-[var(--vd-card)]">
        <caption className="sr-only">Registry discrepancies</caption>
        <TableHeader className="bg-[var(--vd-muted)]/60"><TableRow className="hover:bg-transparent">
          <TableHead scope="col">Action</TableHead><TableHead scope="col">Target</TableHead>
          <TableHead scope="col">Explanation</TableHead><TableHead scope="col">Evidence</TableHead>
        </TableRow></TableHeader>
        <TableBody>{items.map((item) => <TableRow key={`${item.action}-${item.target}`}>
          <TableCell><Badge variant="outline">{item.action}</Badge></TableCell>
          <TableCell className="break-all font-mono text-xs">{item.target}</TableCell>
          <TableCell className="max-w-[32rem] leading-6">{item.explanation}</TableCell>
          <TableCell className="break-all font-mono text-xs text-[var(--vd-muted-fg)]">{item.evidenceRef}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
  );
}

export function OpenExceptionsTable({ items }: { items: DashboardView['report']['openExceptions'] }) {
  if (items.length === 0) return <EmptyState>No open exceptions match this view.</EmptyState>;
  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)]">
      <Table className="min-w-[58rem] bg-[var(--vd-card)]">
        <caption className="sr-only">Open exceptions</caption>
        <TableHeader className="bg-[var(--vd-muted)]/60"><TableRow className="hover:bg-transparent">
          <TableHead scope="col">Status</TableHead><TableHead scope="col">Finding</TableHead>
          <TableHead scope="col">Subject</TableHead><TableHead scope="col">Exception</TableHead>
          <TableHead scope="col">Expires</TableHead><TableHead scope="col">Evidence</TableHead>
        </TableRow></TableHeader>
        <TableBody>{items.map((item) => <TableRow key={`${item.findingId}-${item.exceptionId}`}>
          <TableCell><StatusBadge status="exception-open" /></TableCell>
          <TableCell className="font-mono text-xs font-semibold">{item.findingId}</TableCell>
          <TableCell><span className="text-xs text-[var(--vd-muted-fg)]">{item.subjectKind}</span><br /><code className="break-all text-xs">{item.subjectId}</code></TableCell>
          <TableCell className="font-mono text-xs">{item.exceptionId}</TableCell>
          <TableCell className="tabular-nums">{formatFleetTimestamp(item.expiresAt)}</TableCell>
          <TableCell className="break-all font-mono text-xs text-[var(--vd-muted-fg)]">{item.evidenceRef}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
  );
}

export function BlockersTable({ items }: { items: DashboardView['report']['blockers'] }) {
  if (items.length === 0) return <EmptyState>No blockers match this view.</EmptyState>;
  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)]">
      <Table className="min-w-[58rem] bg-[var(--vd-card)]">
        <caption className="sr-only">Fleet blockers</caption>
        <TableHeader className="bg-[var(--vd-muted)]/60"><TableRow className="hover:bg-transparent">
          <TableHead scope="col">Status</TableHead><TableHead scope="col">Code</TableHead>
          <TableHead scope="col">Scope</TableHead><TableHead scope="col">Subject</TableHead>
          <TableHead scope="col">Message</TableHead><TableHead scope="col">Observed</TableHead>
        </TableRow></TableHeader>
        <TableBody>{items.map((item, index) => <TableRow key={`${item.code}-${item.subject}-${index}`}>
          <TableCell><StatusBadge status="blocked" /></TableCell>
          <TableCell className="font-mono text-xs font-semibold">{item.code}</TableCell>
          <TableCell>{item.scope}</TableCell>
          <TableCell className="break-all font-mono text-xs">{item.subject}</TableCell>
          <TableCell className="max-w-[34rem] leading-6">{item.message}</TableCell>
          <TableCell className="tabular-nums text-[var(--vd-muted-fg)]">{formatFleetTimestamp(item.observedAt)}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
  );
}
