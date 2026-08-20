/* eslint-disable @next/next/no-img-element -- asset upload controls support arbitrary external URLs */
'use client';

import { ChevronDown, Loader2, UploadIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from '@/components/ui/dropzone';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { type AssetFolderItem } from '@/lib/uploads';
import { FOLDER_ROOT } from './shared';

type AssetUploadControlsProps = {
  accept: string;
  busy: boolean;
  queuedFiles: File[] | null;
  onDrop: (files: File[]) => void;
  onUpload: () => void;
  onClearSelection: () => void;
  onPasteSvg?: () => void;
  uploadProgress: number | null;
  uploadBatch: { current: number; total: number } | null;
  uploadName: string;
  setUploadName: (value: string) => void;
  uploadCaption: string;
  setUploadCaption: (value: string) => void;
  uploadAlt: string;
  setUploadAlt: (value: string) => void;
  uploadFolder: string;
  setUploadFolder: (value: string) => void;
  folders: AssetFolderItem[];
  value?: string;
  onValueChange?: (value: string) => void;
  showUrlInput?: boolean;
  showAdvancedOptions?: boolean;
  useCompactLayout?: boolean;
  advancedOpen?: boolean;
  onAdvancedOpenChange?: (open: boolean) => void;
  testIdBase?: string;
  variant?: 'field' | 'library';
  className?: string;
};

export function AssetUploadControls({
  accept,
  busy,
  queuedFiles,
  onDrop,
  onUpload,
  onClearSelection,
  onPasteSvg,
  uploadProgress,
  uploadBatch,
  uploadName,
  setUploadName,
  uploadCaption,
  setUploadCaption,
  uploadAlt,
  setUploadAlt,
  uploadFolder,
  setUploadFolder,
  folders,
  value = '',
  onValueChange,
  showUrlInput = true,
  showAdvancedOptions = true,
  useCompactLayout = false,
  advancedOpen = false,
  onAdvancedOpenChange,
  testIdBase,
  variant = 'field',
  className
}: AssetUploadControlsProps) {
  const hasQueuedFiles = Boolean(queuedFiles && queuedFiles.length > 0);
  const showExpandedMetadata = !useCompactLayout;
  const showCompactAdvanced = useCompactLayout && showAdvancedOptions;
  const showPasteSvg = Boolean(onPasteSvg);

  const metadataFields = (
    <>
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="File name (for library)"
          value={uploadName}
          onChange={(event) => setUploadName(event.target.value)}
          disabled={busy}
        />
        <Input
          placeholder="Caption (optional)"
          value={uploadCaption}
          onChange={(event) => setUploadCaption(event.target.value)}
          disabled={busy}
        />
      </div>
      <Input
        placeholder="Alt text (recommended)"
        value={uploadAlt}
        onChange={(event) => setUploadAlt(event.target.value)}
        disabled={busy}
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-[var(--vd-muted-fg)]">Upload folder</p>
          <Select value={uploadFolder} onValueChange={setUploadFolder} disabled={busy}>
            <SelectTrigger>
              <SelectValue placeholder="Upload to folder" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FOLDER_ROOT}>Root</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder.path} value={folder.path}>
                  {folder.label ? `${folder.label} (${folder.path})` : folder.path}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end text-xs text-[var(--vd-muted-fg)]">
          Uploads are stored in R2. Folder assignment is for organization and search.
        </div>
      </div>
    </>
  );

  return (
    <div
      className={cn(
        'space-y-2',
        variant === 'library' && 'rounded-xl border border-[var(--vd-border)] bg-white/85 p-4',
        className
      )}
    >
      {variant === 'library' ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-[var(--vd-fg)]">Upload assets</p>
            <p className="text-xs text-[var(--vd-muted-fg)]">
              New files are available here immediately after upload.
            </p>
          </div>
        </div>
      ) : null}

      <div data-testid={testIdBase ? `puck-asset-drop-${testIdBase}` : undefined}>
        <Dropzone
          src={queuedFiles ?? undefined}
          onDrop={onDrop}
          accept={accept.startsWith('image/') ? { 'image/*': [] } : undefined}
          maxFiles={20}
          maxSize={10 * 1024 * 1024}
          disabled={busy}
          className={cn(
            'rounded-lg border-dashed bg-white/50 text-[var(--vd-muted-fg)]',
            variant === 'library' && 'bg-[var(--vd-bg)]/70'
          )}
        >
          <DropzoneContent>
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <UploadIcon size={16} />
              </div>
              <p className="w-full truncate text-wrap text-center text-sm font-medium">
                {queuedFiles?.length
                  ? `${queuedFiles.length} file${queuedFiles.length === 1 ? '' : 's'} selected`
                  : 'Upload files'}
              </p>
              <p className="w-full truncate text-wrap text-center text-xs text-muted-foreground">
                Drag and drop or click to upload
              </p>
            </div>
          </DropzoneContent>
          <DropzoneEmptyState />
        </Dropzone>
      </div>

      {showUrlInput && !useCompactLayout && onValueChange ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste a URL, upload, or pick from library"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            data-testid={testIdBase ? `puck-asset-input-${testIdBase}` : undefined}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => onValueChange('')}
            disabled={busy || !value}
            data-testid={testIdBase ? `puck-asset-clear-${testIdBase}` : undefined}
          >
            Clear
          </Button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={onUpload} disabled={busy || !hasQueuedFiles}>
          {busy ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading…
            </>
          ) : (
            'Upload'
          )}
        </Button>
        <Button type="button" variant="outline" onClick={onClearSelection} disabled={busy || !hasQueuedFiles}>
          <X className="mr-2 h-4 w-4" />
          Clear selection
        </Button>
        {!useCompactLayout && showPasteSvg ? (
          <Button type="button" variant="outline" onClick={onPasteSvg} disabled={busy}>
            Paste SVG
          </Button>
        ) : null}
      </div>

      {uploadBatch ? (
        <p className="text-xs text-[var(--vd-muted-fg)]">
          Uploading {uploadBatch.current} of {uploadBatch.total}
          {typeof uploadProgress === 'number' ? ` (${Math.round(uploadProgress)}%)` : ''}
        </p>
      ) : null}

      {showCompactAdvanced ? (
        <Collapsible open={advancedOpen} onOpenChange={onAdvancedOpenChange}>
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="w-full justify-between px-2">
              Advanced upload options
              <ChevronDown className={`h-4 w-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 pt-1">
            {showUrlInput && onValueChange ? (
              <div className="space-y-2">
                <Input
                  placeholder="Paste a URL (advanced)"
                  value={value}
                  onChange={(event) => onValueChange(event.target.value)}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onValueChange('')}
                  disabled={busy || !value}
                  className="w-full"
                >
                  Clear URL
                </Button>
              </div>
            ) : null}
            {showPasteSvg ? (
              <Button type="button" variant="outline" onClick={onPasteSvg} disabled={busy} className="w-full">
                Paste SVG
              </Button>
            ) : null}
            {metadataFields}
          </CollapsibleContent>
        </Collapsible>
      ) : showExpandedMetadata ? (
        <>
          {metadataFields}
          <p className="text-xs text-[var(--vd-muted-fg)]">
            Names and captions are optional. They improve media library search and display only.
          </p>
        </>
      ) : null}
    </div>
  );
}
