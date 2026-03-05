import { Button } from '@/components/ui/button';

export type AttachmentBlockProps = {
  label?: string;
  fileUrl?: string;
};

export function AttachmentBlock({
  label = 'Download file',
  fileUrl = ''
}: AttachmentBlockProps) {
  if (!fileUrl) {
    return <p className="text-sm text-[var(--vd-muted-fg)]">No file selected.</p>;
  }

  return (
    <Button asChild variant="outline">
      <a href={fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-2">
        <span>{label}</span>
        <span className="text-xs text-[var(--vd-muted-fg)]">(opens in new tab)</span>
      </a>
    </Button>
  );
}
