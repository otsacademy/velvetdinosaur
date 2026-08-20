import { Button } from '@/components/ui/button';

type EditIndexPaginationProps = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export function EditIndexPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange
}: EditIndexPaginationProps) {
  if (totalItems <= pageSize || totalPages <= 1) return null;

  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = (clampedPage - 1) * pageSize + 1;
  const end = Math.min(clampedPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-[var(--vd-radius)] bg-[var(--vd-bg)]/80 px-3 py-2">
      <p className="text-xs text-[var(--vd-muted-fg)]">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={clampedPage <= 1}
        >
          Previous
        </Button>
        <span className="text-xs text-[var(--vd-muted-fg)]">
          Page {clampedPage} of {totalPages}
        </span>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={clampedPage >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
