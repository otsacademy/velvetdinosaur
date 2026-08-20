/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { Check, Download, ExternalLink, Image as ImageIcon, Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { buildAssetImageUrl, buildAssetUrl } from '@/lib/uploads';
import { assetPickerLabel, formatAssetPickerSize, isAssetImage, type AssetPickerListItem } from './shared';

export function AssetLibraryPreviewDialog({
  accept,
  item,
  open,
  onOpenChange,
  onUse,
  onEdit
}: {
  accept: string;
  item: AssetPickerListItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUse: (item: AssetPickerListItem) => void;
  onEdit: (item: AssetPickerListItem) => void;
}) {
  const isImage = item ? isAssetImage(item, accept) : false;
  const sizeLabel = formatAssetPickerSize(item?.size);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Asset preview</DialogTitle>
          <DialogDescription>Inspect the file before using it in the editor.</DialogDescription>
        </DialogHeader>
        {item ? (
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[var(--vd-border)] bg-[var(--vd-muted)]/20">
              {isImage ? (
                <img
                  src={buildAssetImageUrl(item.key, { width: 1600, height: 1100, fit: 'contain', quality: 90 })}
                  alt={item.alt || assetPickerLabel(item)}
                  className="h-auto max-h-[62vh] w-full object-contain"
                  loading="eager"
                />
              ) : (
                <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 px-6 text-center text-[var(--vd-muted-fg)]">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-[var(--vd-fg)]">{assetPickerLabel(item)}</p>
                    <p className="text-xs">Preview is not available for this file type inside the picker.</p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-base font-semibold text-[var(--vd-fg)]">{assetPickerLabel(item)}</p>
                <p className="text-sm text-[var(--vd-muted-fg)]">{item.caption?.trim() || 'No description yet.'}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{item.folder ? item.folder : 'root'}</Badge>
                {item.width && item.height ? <Badge variant="outline">{item.width}×{item.height}</Badge> : null}
                {sizeLabel ? <Badge variant="outline">{sizeLabel}</Badge> : null}
                {item.mime ? <Badge variant="outline">{item.mime}</Badge> : null}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button onClick={() => onUse(item)}>
                  <Check className="h-4 w-4" />
                  Use this asset
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    onEdit(item);
                    onOpenChange(false);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                  Edit metadata
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildAssetUrl(item.key)} download>
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={buildAssetUrl(item.key)} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Open raw
                  </a>
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
