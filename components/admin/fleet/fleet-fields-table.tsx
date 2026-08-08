import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/admin/fleet/status-badge';
import { formatFleetTimestamp } from '@/lib/fleet/format';
import type { PresentedStatusField } from '@/lib/fleet/presentation';

function EvidenceList({ refs }: { refs: string[] }) {
  if (refs.length === 0) return <span className="text-[var(--vd-muted-fg)]">None</span>;
  return (
    <ul className="space-y-1">
      {refs.map((reference) => (
        <li key={reference} className="break-all font-mono text-xs text-[var(--vd-muted-fg)]">
          {reference}
        </li>
      ))}
    </ul>
  );
}

export function FleetFieldsTable({ fields, label }: { fields: PresentedStatusField[]; label: string }) {
  if (fields.length === 0) {
    return <p className="text-sm text-[var(--vd-muted-fg)]">No status fields match this view.</p>;
  }

  return (
    <div className="overflow-hidden rounded-[var(--vd-radius)] border border-[var(--vd-border)]">
      <Table className="min-w-[68rem] bg-[var(--vd-bg)]">
        <caption className="sr-only">{label} status fields</caption>
        <TableHeader className="bg-[var(--vd-muted)]/60">
          <TableRow className="hover:bg-transparent">
            <TableHead scope="col" className="w-[18rem]">Field</TableHead>
            <TableHead scope="col" className="w-[12rem]">Value</TableHead>
            <TableHead scope="col" className="w-[11rem]">Status</TableHead>
            <TableHead scope="col" className="w-[15rem]">Observed</TableHead>
            <TableHead scope="col" className="min-w-[22rem]">Explanation</TableHead>
            <TableHead scope="col" className="min-w-[18rem]">Evidence</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, index) => (
            <TableRow key={`${field.key}-${index}`}>
              <TableCell>
                <code className="break-all font-mono text-xs font-semibold text-[var(--vd-fg)]">
                  {field.key}
                </code>
                <div className="mt-1 text-xs text-[var(--vd-muted-fg)]">
                  {field.category}
                  {field.packageName ? ` · ${field.packageName}` : ''}
                  {field.layer ? ` · ${field.layer}` : ''}
                </div>
              </TableCell>
              <TableCell className="break-words font-mono text-xs text-[var(--vd-fg)]">
                {field.value ?? 'Unknown'}
              </TableCell>
              <TableCell>
                <StatusBadge status={field.badgeClass} />
                <div className="mt-1.5 text-xs text-[var(--vd-muted-fg)]">
                  {field.provenance} · {field.freshness.overall}
                </div>
              </TableCell>
              <TableCell>
                <dl className="space-y-1 text-xs text-[var(--vd-muted-fg)]">
                  <div><dt className="inline font-medium text-[var(--vd-fg)]">Source: </dt><dd className="inline tabular-nums">{formatFleetTimestamp(field.times.sourceAt)}</dd></div>
                  <div><dt className="inline font-medium text-[var(--vd-fg)]">Runtime: </dt><dd className="inline tabular-nums">{formatFleetTimestamp(field.times.runtimeAt)}</dd></div>
                  <div><dt className="inline font-medium text-[var(--vd-fg)]">Evidence: </dt><dd className="inline tabular-nums">{formatFleetTimestamp(field.times.evidenceAt)}</dd></div>
                </dl>
              </TableCell>
              <TableCell className="max-w-[34rem] text-sm leading-6 text-[var(--vd-fg)]">
                {field.explanation}
              </TableCell>
              <TableCell><EvidenceList refs={field.evidenceRefs} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
