/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { Check, Copy, ExternalLink, Image as ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildAssetImageUrl, buildAssetUrl } from '@/lib/uploads';
import { assetAlt, assetLabel, formatDate, formatSize, type AssetListItem, type ViewMode } from './media-library.types';

export function MediaLibraryAssets({
  items,
  viewMode,
  selectedKeys,
  onToggleSelected,
  onPreview,
  onCopy,
  onEdit,
  onDelete
}: {
  items: AssetListItem[];
  viewMode: ViewMode;
  selectedKeys: Set<string>;
  onToggleSelected: (key: string) => void;
  onPreview: (key: string) => void;
  onCopy: (key: string) => void;
  onEdit: (item: AssetListItem) => void;
  onDelete: (key: string) => void;
}) {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const selected = selectedKeys.has(item.key);
          const isImage = (item.mime || '').startsWith('image/');
          return (
            <div key={item.key} className="group relative overflow-hidden rounded-xl border border-[var(--vd-border)] bg-white">
              <button
                type="button"
                className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-[var(--vd-border)] bg-white/90"
                onClick={() => onToggleSelected(item.key)}
                aria-label={selected ? 'Unselect' : 'Select'}
              >
                {selected ? <Check className="h-4 w-4" /> : null}
              </button>
              <button type="button" className="block w-full" onClick={() => onPreview(item.key)} aria-label="Preview asset">
                <div className="aspect-[16/10] w-full bg-[var(--vd-muted)]/30">
                  {isImage ? (
                    <img
                      src={buildAssetImageUrl(item.key, { width: 480, height: 300, fit: 'cover', quality: 75 })}
                      alt={assetAlt(item)}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[var(--vd-muted-fg)]">
                      <ImageIcon className="h-8 w-8" />
                    </div>
                  )}
                </div>
              </button>
              <div className="space-y-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{assetLabel(item)}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--vd-muted-fg)]">{item.caption || 'No caption'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.folder ? item.folder : 'root'}</Badge>
                  {item.width && item.height ? (
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">
                      {item.width}×{item.height}
                    </Badge>
                  ) : null}
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatSize(item.size)}</Badge>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => onCopy(item.key)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={buildAssetUrl(item.key)} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.key)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const selected = selectedKeys.has(item.key);
        const isImage = (item.mime || '').startsWith('image/');
        return (
          <div key={item.key} className="flex items-center gap-3 rounded-xl border border-[var(--vd-border)] bg-white p-3">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md border border-[var(--vd-border)]"
              onClick={() => onToggleSelected(item.key)}
              aria-label={selected ? 'Unselect' : 'Select'}
            >
              {selected ? <Check className="h-4 w-4" /> : null}
            </button>
            <button
              type="button"
              className="h-14 w-14 overflow-hidden rounded-lg bg-[var(--vd-muted)]/30"
              onClick={() => onPreview(item.key)}
            >
              {isImage ? (
                <img
                  src={buildAssetImageUrl(item.key, { width: 112, height: 112, fit: 'cover', quality: 75 })}
                  alt={assetAlt(item)}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[var(--vd-muted-fg)]">
                  <ImageIcon className="h-5 w-5" />
                </div>
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{assetLabel(item)}</p>
              <p className="mt-1 line-clamp-1 text-xs text-[var(--vd-muted-fg)]">{item.caption || 'No caption'}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.folder ? item.folder : 'root'}</Badge>
                {item.width && item.height ? (
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">
                    {item.width}×{item.height}
                  </Badge>
                ) : null}
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatSize(item.size)}</Badge>
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatDate(item.createdAt)}</Badge>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => onCopy(item.key)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={buildAssetUrl(item.key)} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </a>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.key)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
