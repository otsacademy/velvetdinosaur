/* eslint-disable @next/next/no-img-element -- Media library supports arbitrary external URLs */
'use client';

import { AlertCircle, Check, Copy, Download, ExternalLink, Image as ImageIcon, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { buildAssetImageUrl, buildAssetUrl } from '@/lib/uploads';
import {
  assetAlt,
  assetLabel,
  formatDate,
  formatSize,
  isAltMissing,
  isCaptionMissing,
  isLikelyMachineName,
  tagBadgeStyle,
  type AssetListItem,
  type ViewMode
} from './media-library.types';

export function MediaLibraryAssets({
  items,
  viewMode,
  selectedKeys,
  onToggleSelected,
  onPreview,
  onCopy,
  onEdit,
  onDelete,
  onRestore,
  onDragStart,
  usageCountByKey,
  onOpenUsage,
  inTrashView = false
}: {
  items: AssetListItem[];
  viewMode: ViewMode;
  selectedKeys: Set<string>;
  onToggleSelected: (
    key: string,
    options: { index: number; shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }
  ) => void;
  onPreview: (key: string) => void;
  onCopy: (key: string) => void;
  onEdit: (item: AssetListItem) => void;
  onDelete: (key: string) => void;
  onRestore?: (key: string) => void;
  onDragStart?: (key: string) => void;
  usageCountByKey?: Record<string, number>;
  onOpenUsage?: (key: string) => void;
  inTrashView?: boolean;
}) {
  if (viewMode === 'grid') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, index) => {
          const selected = selectedKeys.has(item.key);
          const isImage = (item.mime || '').startsWith('image/');
          const usageCount = usageCountByKey?.[item.key] || 0;
          return (
            <div
              key={item.key}
              className={`group relative overflow-hidden rounded-xl bg-white shadow-sm ${selected ? 'ring-2 ring-[var(--vd-ring)]/35' : ''}`}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/asap-media', item.key);
                onDragStart?.(item.key);
              }}
            >
              <button
                type="button"
                className="absolute left-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-md bg-white/90 ring-1 ring-[var(--vd-border)]/60"
                onClick={(event) =>
                  onToggleSelected(item.key, {
                    index,
                    shiftKey: event.shiftKey,
                    metaKey: event.metaKey,
                    ctrlKey: event.ctrlKey
                  })
                }
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
                  {isCaptionMissing(item) ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Missing caption
                    </Badge>
                  ) : null}
                  {isAltMissing(item) ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      <AlertCircle className="mr-1 h-3 w-3" />
                      Missing alt
                    </Badge>
                  ) : null}
                  {isLikelyMachineName(item.name) ? (
                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                      Needs rename
                    </Badge>
                  ) : null}
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.folder ? item.folder : 'root'}</Badge>
                  {item.width && item.height ? (
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">
                      {item.width}×{item.height}
                    </Badge>
                  ) : null}
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatSize(item.size)}</Badge>
                  {(item.tags || []).slice(0, 3).map((tag) => (
                    <Badge key={`${item.key}-${tag}`} className="border" style={tagBadgeStyle(tag)}>
                      {tag}
                    </Badge>
                  ))}
                  {(item.tags?.length || 0) > 3 ? (
                    <Badge className="bg-white text-[var(--vd-muted-fg)]">+{(item.tags?.length || 0) - 3}</Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {!inTrashView ? (
                    <Button variant="ghost" size="sm" onClick={() => onOpenUsage?.(item.key)}>
                      Used in {usageCount} {usageCount === 1 ? 'place' : 'places'}
                    </Button>
                  ) : null}
                  <Button variant="outline" size="sm" onClick={() => onCopy(item.key)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy URL
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={buildAssetUrl(item.key)} download>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={buildAssetUrl(item.key)} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Open
                    </a>
                  </Button>
                  {inTrashView ? (
                    <Button variant="ghost" size="sm" onClick={() => onRestore?.(item.key)}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Restore
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => onDelete(item.key)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    {inTrashView ? 'Delete forever' : 'Delete'}
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
      {items.map((item, index) => {
        const selected = selectedKeys.has(item.key);
        const isImage = (item.mime || '').startsWith('image/');
        const usageCount = usageCountByKey?.[item.key] || 0;
        return (
          <div
            key={item.key}
            className={`flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm ${selected ? 'ring-2 ring-[var(--vd-ring)]/35' : ''}`}
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData('text/asap-media', item.key);
              onDragStart?.(item.key);
            }}
          >
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-md ring-1 ring-[var(--vd-border)]/60"
              onClick={(event) =>
                onToggleSelected(item.key, {
                  index,
                  shiftKey: event.shiftKey,
                  metaKey: event.metaKey,
                  ctrlKey: event.ctrlKey
                })
              }
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
                {isCaptionMissing(item) ? (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Missing caption
                  </Badge>
                ) : null}
                {isAltMissing(item) ? (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Missing alt
                  </Badge>
                ) : null}
                {isLikelyMachineName(item.name) ? (
                  <Badge variant="outline" className="border-amber-300 text-amber-700">
                    Needs rename
                  </Badge>
                ) : null}
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{item.folder ? item.folder : 'root'}</Badge>
                {item.width && item.height ? (
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">
                    {item.width}×{item.height}
                  </Badge>
                ) : null}
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatSize(item.size)}</Badge>
                <Badge className="bg-white text-[var(--vd-muted-fg)]">{formatDate(item.createdAt)}</Badge>
                {(item.tags || []).slice(0, 3).map((tag) => (
                  <Badge key={`${item.key}-${tag}`} className="border" style={tagBadgeStyle(tag)}>
                    {tag}
                  </Badge>
                ))}
                {(item.tags?.length || 0) > 3 ? (
                  <Badge className="bg-white text-[var(--vd-muted-fg)]">+{(item.tags?.length || 0) - 3}</Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!inTrashView ? (
                <Button variant="ghost" size="sm" onClick={() => onOpenUsage?.(item.key)}>
                  Used in {usageCount} {usageCount === 1 ? 'place' : 'places'}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={() => onCopy(item.key)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={buildAssetUrl(item.key)} download>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={buildAssetUrl(item.key)} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open
                </a>
              </Button>
              {inTrashView ? (
                <Button variant="ghost" size="sm" onClick={() => onRestore?.(item.key)}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => onEdit(item)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => onDelete(item.key)}>
                <Trash2 className="mr-2 h-4 w-4" />
                {inTrashView ? 'Delete forever' : 'Delete'}
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
