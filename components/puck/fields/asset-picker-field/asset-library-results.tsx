/* eslint-disable @next/next/no-img-element -- asset picker supports arbitrary external URLs */
'use client';

import { Eye, Image as ImageIcon, Pencil, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { buildAssetImageUrl, type AssetFolderItem } from '@/lib/uploads';
import {
  FOLDER_ROOT,
  assetPickerLabel,
  formatAssetPickerSize,
  isAssetImage,
  type AssetPickerListItem
} from './shared';

type SharedResultsProps = {
  accept: string;
  items: AssetPickerListItem[];
  folders: AssetFolderItem[];
  testIdBase?: string;
  editingKey: string | null;
  startEditing: (item: AssetPickerListItem) => void;
  cancelEditing: () => void;
  saveEditing: (key: string) => void;
  draftName: string;
  setDraftName: (value: string) => void;
  draftCaption: string;
  setDraftCaption: (value: string) => void;
  draftAlt: string;
  setDraftAlt: (value: string) => void;
  draftFolder: string;
  setDraftFolder: (value: string) => void;
  savingKey: string | null;
  onUse: (item: AssetPickerListItem) => void;
  onPreview: (item: AssetPickerListItem) => void;
};

export function AssetLibraryResults({
  viewMode,
  ...props
}: SharedResultsProps & {
  viewMode: 'grid' | 'list';
}) {
  if (viewMode === 'grid') {
    return <AssetGridResults {...props} />;
  }

  return <AssetListResults {...props} />;
}

function AssetGridResults(props: SharedResultsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {props.items.map((item) => (
        <div key={item.key} className="rounded-xl border border-[var(--vd-border)] bg-white/90 shadow-sm">
          {props.editingKey === item.key ? (
            <div className="space-y-3 p-4">
              <AssetInlineEditor item={item} {...props} />
            </div>
          ) : (
            <AssetGridCard item={item} {...props} />
          )}
        </div>
      ))}
    </div>
  );
}

function AssetListResults(props: SharedResultsProps) {
  return (
    <div className="space-y-3">
      {props.items.map((item) => (
        <div
          key={item.key}
          className="rounded-xl border border-[var(--vd-border)] bg-white/90 p-3 shadow-sm"
          data-testid={`asset-item-${item.key}`}
        >
          {props.editingKey === item.key ? (
            <AssetInlineEditor item={item} {...props} />
          ) : (
            <AssetListRow item={item} {...props} />
          )}
        </div>
      ))}
    </div>
  );
}

function AssetGridCard({
  accept,
  item,
  startEditing,
  onUse,
  onPreview
}: SharedResultsProps & {
  item: AssetPickerListItem;
}) {
  const isImage = isAssetImage(item, accept);
  const sizeLabel = formatAssetPickerSize(item.size);
  const showDescriptionPrompt = !item.caption?.trim();
  const showAltPrompt = isImage && !item.alt?.trim();

  return (
    <>
      <button
        type="button"
        className="group block w-full text-left"
        onClick={() => onPreview(item)}
        aria-label={`Preview ${assetPickerLabel(item)}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl bg-[var(--vd-muted)]/25">
          {isImage ? (
            <img
              src={buildAssetImageUrl(item.key, { width: 720, height: 540, fit: 'cover', quality: 80 })}
              alt={item.alt || assetPickerLabel(item)}
              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--vd-muted-fg)]">
              <ImageIcon className="h-8 w-8" />
              <span className="text-xs font-medium uppercase tracking-[0.18em]">File</span>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <Badge className="border-white/40 bg-white/90 text-[var(--vd-fg)] shadow-sm">
              {item.folder ? item.folder : 'root'}
            </Badge>
            {showDescriptionPrompt ? (
              <Badge variant="outline" className="border-amber-300 bg-white/90 text-amber-700 shadow-sm">
                Needs description
              </Badge>
            ) : null}
          </div>
        </div>
      </button>

      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{assetPickerLabel(item)}</p>
          <p className="line-clamp-2 text-xs leading-5 text-[var(--vd-muted-fg)]">
            {item.caption?.trim() || 'Add a description to make this easier to find later.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {showAltPrompt ? (
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              Missing alt text
            </Badge>
          ) : null}
          {item.width && item.height ? (
            <Badge variant="outline" className="text-[var(--vd-muted-fg)]">
              {item.width}×{item.height}
            </Badge>
          ) : null}
          {sizeLabel ? (
            <Badge variant="outline" className="text-[var(--vd-muted-fg)]">
              {sizeLabel}
            </Badge>
          ) : null}
          {!isImage && item.mime ? (
            <Badge variant="outline" className="text-[var(--vd-muted-fg)]">
              {item.mime}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => onUse(item)}
            data-testid={`asset-use-${item.key}`}
          >
            Use
          </Button>
          <Button size="sm" variant="outline" onClick={() => onPreview(item)} aria-label={`Preview ${assetPickerLabel(item)}`}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => startEditing(item)} aria-label={`Edit ${assetPickerLabel(item)}`}>
            <Pencil className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );
}

function AssetListRow({
  accept,
  item,
  startEditing,
  onUse,
  onPreview
}: SharedResultsProps & {
  item: AssetPickerListItem;
}) {
  const isImage = isAssetImage(item, accept);
  const sizeLabel = formatAssetPickerSize(item.size);
  const showDescriptionPrompt = !item.caption?.trim();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <button
        type="button"
        className="h-20 w-full overflow-hidden rounded-lg bg-[var(--vd-muted)]/25 sm:w-24"
        onClick={() => onPreview(item)}
        aria-label={`Preview ${assetPickerLabel(item)}`}
      >
        {isImage ? (
          <img
            src={buildAssetImageUrl(item.key, { width: 192, height: 160, fit: 'cover', quality: 80 })}
            alt={item.alt || assetPickerLabel(item)}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--vd-muted-fg)]">
            <ImageIcon className="h-6 w-6" />
          </div>
        )}
      </button>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="space-y-1">
          <p className="truncate text-sm font-semibold text-[var(--vd-fg)]">{assetPickerLabel(item)}</p>
          <p className="line-clamp-2 text-xs leading-5 text-[var(--vd-muted-fg)]">
            {item.caption?.trim() || 'Add a description to make this easier to scan.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--vd-muted-fg)]">
          <Badge variant="outline">{item.folder ? item.folder : 'root'}</Badge>
          {item.width && item.height ? <span>{item.width}×{item.height}</span> : null}
          {sizeLabel ? <span>{sizeLabel}</span> : null}
          {!isImage && item.mime ? <span>{item.mime}</span> : null}
          {showDescriptionPrompt ? (
            <span className="inline-flex items-center gap-1 text-amber-700">
              <Sparkles className="h-3 w-3" />
              Needs description
            </span>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:self-start">
        <Button size="sm" onClick={() => onUse(item)} data-testid={`asset-use-${item.key}`}>
          Use
        </Button>
        <Button size="sm" variant="outline" onClick={() => onPreview(item)}>
          <Eye className="h-4 w-4" />
          Preview
        </Button>
        <Button size="sm" variant="ghost" onClick={() => startEditing(item)}>
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
      </div>
    </div>
  );
}

function AssetInlineEditor({
  item,
  folders,
  cancelEditing,
  saveEditing,
  draftName,
  setDraftName,
  draftCaption,
  setDraftCaption,
  draftAlt,
  setDraftAlt,
  draftFolder,
  setDraftFolder,
  savingKey
}: SharedResultsProps & {
  item: AssetPickerListItem;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[var(--vd-fg)]">Edit metadata</p>
          <p className="text-xs text-[var(--vd-muted-fg)]">{assetPickerLabel(item)}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={cancelEditing} aria-label={`Cancel editing ${assetPickerLabel(item)}`}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Input
          placeholder="File name"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          disabled={savingKey === item.key}
        />
        <Input
          placeholder="Description"
          value={draftCaption}
          onChange={(event) => setDraftCaption(event.target.value)}
          disabled={savingKey === item.key}
        />
      </div>

      <Input
        placeholder="Alt text"
        value={draftAlt}
        onChange={(event) => setDraftAlt(event.target.value)}
        disabled={savingKey === item.key}
      />

      <Select value={draftFolder} onValueChange={setDraftFolder} disabled={savingKey === item.key}>
        <SelectTrigger>
          <SelectValue placeholder="Folder" />
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

      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => saveEditing(item.key)} disabled={savingKey === item.key}>
          {savingKey === item.key ? 'Saving…' : 'Save'}
        </Button>
        <Button size="sm" variant="outline" onClick={cancelEditing} disabled={savingKey === item.key}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
