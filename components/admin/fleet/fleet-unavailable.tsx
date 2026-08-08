import Link from 'next/link';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { AdminRouteNav } from '@/components/admin/admin-route-nav';
import { Button } from '@/components/ui/button';
import type { FleetStatusErrorCode } from '@/lib/fleet/client';

const messages: Record<FleetStatusErrorCode, string> = {
  configuration: 'The server-side fleet connection is not configured safely.',
  unavailable: 'The local fleet status service could not be reached.',
  'upstream-response': 'The local fleet status service returned an unsuccessful response.',
  'content-type': 'The local fleet status service returned an unexpected response type.',
  'response-too-large': 'The fleet status response exceeded the accepted size limit.',
  'invalid-json': 'The fleet status response could not be decoded.',
  'invalid-contract': 'The fleet status response did not match the supported read-only contract.'
};

export function FleetUnavailable({ code }: { code: FleetStatusErrorCode }) {
  return (
    <AdminPageShell
      header={
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[var(--vd-fg)]">Fleet status</h1>
            <p className="mt-1 text-sm text-[var(--vd-muted-fg)]">The protected status view is temporarily unavailable.</p>
          </div>
          <AdminRouteNav current="fleet" />
        </div>
      }
    >
      <section className="max-w-2xl rounded-[var(--vd-radius)] border border-[var(--vd-status-danger-border)] bg-[var(--vd-status-danger-bg)] p-6" aria-labelledby="fleet-error-heading">
        <div className="flex gap-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[var(--vd-status-danger-fg)]" aria-hidden="true" />
          <div>
            <h2 id="fleet-error-heading" className="font-semibold text-[var(--vd-status-danger-fg)]">
              Status data unavailable
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--vd-fg)]">{messages[code]}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--vd-muted-fg)]">
              No fleet action was attempted. Retry the read or check the local dashboard service.
            </p>
            <Button asChild variant="outline" className="mt-5 min-h-11 bg-[var(--vd-bg)]">
              <Link href="/admin/fleet">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                Retry status
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}
