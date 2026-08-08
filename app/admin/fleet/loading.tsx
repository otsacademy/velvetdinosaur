import { AdminPageShell } from '@/components/admin/admin-page-shell';
import { Skeleton } from '@/components/ui/skeleton';

export default function FleetLoading() {
  return (
    <AdminPageShell
      header={
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-11 w-full max-w-2xl" />
        </div>
      }
    >
      <div className="space-y-4" aria-label="Loading fleet status" aria-busy="true">
        <Skeleton className="h-20 w-full max-w-2xl" />
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    </AdminPageShell>
  );
}
