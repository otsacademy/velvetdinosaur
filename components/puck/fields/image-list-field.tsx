/* eslint-disable @next/next/no-img-element */
'use client';

import type { CustomFieldRender } from '@puckeditor/core';
import { useState } from 'react';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import { Button } from '@/components/ui/button';
import { resolveAssetImageUrl } from '@/lib/uploads';
import { cn } from '@/lib/utils';

type ImageListLayout = 'stack' | 'thumbnails';
type ImageListPickerMode = 'full' | 'simple';

type ImageListFieldProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  accept?: string;
  layout?: ImageListLayout;
  pickerMode?: ImageListPickerMode;
};

function normalizeList(value?: string[]) {
  return Array.isArray(value) ? value : [];
}

function getDisplayList(list: string[]) {
  return list.length ? list : [''];
}

function replaceListEntry(list: string[], index: number, nextValue: string) {
  const base = list.length ? list : [''];
  const next = [...base];
  next[index] = nextValue;
  return next;
}

function removeListEntry(list: string[], index: number) {
  const base = list.length ? list : [''];
  return base.filter((_, idx) => idx !== index);
}

function appendListEntry(list: string[]) {
  return [...list, ''];
}

function resolveThumbnailActiveIndex(activeIndex: number | null, listLength: number) {
  if (listLength <= 0) return null;
  return Math.max(0, Math.min(activeIndex ?? 0, listLength - 1));
}

function getNextThumbnailActiveIndex(
  currentActiveIndex: number | null,
  removedIndex: number,
  nextLength: number
) {
  if (nextLength <= 0) return null;
  if (currentActiveIndex === null || currentActiveIndex >= nextLength) {
    return nextLength - 1;
  }
  if (currentActiveIndex === removedIndex) {
    return Math.max(0, removedIndex - 1);
  }
  return currentActiveIndex;
}

type SharedImageListEditorProps = {
  list: string[];
  accept: string;
  pickerMode: ImageListPickerMode;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, nextValue: string) => void;
};

function StackImageListEditor({
  list,
  accept,
  pickerMode,
  onAdd,
  onRemove,
  onUpdate
}: SharedImageListEditorProps) {
  const displayList = getDisplayList(list);

  return (
    <div className="space-y-3">
      <div className="space-y-4">
        {displayList.map((entry, index) => (
          <div
            key={`image-${index}`}
            className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3"
          >
            <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
              <span>Image {index + 1}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn(displayList.length <= 1 && !list.length && 'hidden')}
                onClick={() => onRemove(index)}
              >
                Remove
              </Button>
            </div>
            <AssetPickerField
              value={entry || ''}
              onChange={(next) => onUpdate(index, next)}
              accept={accept}
              simple={pickerMode === 'simple'}
            />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onAdd}>
        Add image
      </Button>
    </div>
  );
}

type ThumbnailImageListEditorProps = SharedImageListEditorProps & {
  activeIndex: number | null;
  onSelect: (index: number) => void;
};

function ThumbnailImageListEditor({
  list,
  accept,
  pickerMode,
  activeIndex,
  onAdd,
  onRemove,
  onSelect,
  onUpdate
}: ThumbnailImageListEditorProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {list.map((entry, index) => (
          <button
            key={`gallery-thumb-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={cn(
              'rounded-[var(--vd-radius)] border bg-[var(--vd-card)] p-2 text-left transition',
              activeIndex === index
                ? 'border-[var(--vd-primary)] ring-1 ring-[var(--vd-primary)]/30'
                : 'border-[var(--vd-border)] hover:border-[var(--vd-primary)]/40'
            )}
          >
            <div className="h-20 overflow-hidden rounded-md bg-[var(--vd-muted)]/40">
              {entry ? (
                <img
                  src={resolveAssetImageUrl(entry, { width: 320, height: 160, fit: 'cover' })}
                  alt={`Gallery image ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-[11px] text-[var(--vd-muted-fg)]">
                  No image
                </div>
              )}
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--vd-fg)]">Photo {index + 1}</span>
              <span className="text-[11px] text-[var(--vd-muted-fg)]">{activeIndex === index ? 'Editing' : 'Edit'}</span>
            </div>
          </button>
        ))}
        <Button
          type="button"
          variant="outline"
          className="h-full min-h-28 border-dashed text-xs"
          onClick={onAdd}
        >
          + Add photo
        </Button>
      </div>
      {activeIndex !== null ? (
        <div className="rounded-[var(--vd-radius)] border border-[var(--vd-border)] bg-[var(--vd-card)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--vd-muted-fg)]">
              Photo {activeIndex + 1}
            </p>
            <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(activeIndex)}>
              Remove
            </Button>
          </div>
          <AssetPickerField
            value={list[activeIndex] || ''}
            onChange={(next) => onUpdate(activeIndex, next)}
            accept={accept}
            simple={pickerMode === 'simple'}
          />
        </div>
      ) : (
        <div className="rounded-[var(--vd-radius)] border border-dashed border-[var(--vd-border)] p-4 text-xs text-[var(--vd-muted-fg)]">
          Add a photo to start your gallery.
        </div>
      )}
    </div>
  );
}

export function ImageListField({
  value,
  onChange,
  accept = 'image/*',
  layout = 'stack',
  pickerMode = 'full'
}: ImageListFieldProps) {
  const list = normalizeList(value);
  const [activeIndex, setActiveIndex] = useState<number | null>(list.length ? 0 : null);
  const resolvedActiveIndex = resolveThumbnailActiveIndex(activeIndex, list.length);

  const updateItem = (index: number, nextValue: string) => {
    onChange(replaceListEntry(list, index, nextValue));
  };

  const removeItem = (index: number) => {
    const next = removeListEntry(list, index);
    onChange(next);
    if (layout !== 'thumbnails') return;
    setActiveIndex(getNextThumbnailActiveIndex(resolvedActiveIndex, index, next.length));
  };

  const addItem = () => {
    const next = appendListEntry(list);
    onChange(next);
    if (layout === 'thumbnails') {
      setActiveIndex(next.length - 1);
    }
  };

  if (layout === 'thumbnails') {
    return (
      <ThumbnailImageListEditor
        list={list}
        accept={accept}
        pickerMode={pickerMode}
        activeIndex={resolvedActiveIndex}
        onAdd={addItem}
        onRemove={removeItem}
        onSelect={setActiveIndex}
        onUpdate={updateItem}
      />
    );
  }

  return (
    <StackImageListEditor
      list={list}
      accept={accept}
      pickerMode={pickerMode}
      onAdd={addItem}
      onRemove={removeItem}
      onUpdate={updateItem}
    />
  );
}

export function imageListField(options?: {
  accept?: string;
  layout?: ImageListLayout;
  pickerMode?: ImageListPickerMode;
}) {
  const accept = options?.accept;
  const layout = options?.layout;
  const pickerMode = options?.pickerMode;
  const render: CustomFieldRender<string[]> = ({ value, onChange }) => (
    <ImageListField
      value={normalizeList(value as string[])}
      onChange={onChange}
      accept={accept}
      layout={layout}
      pickerMode={pickerMode}
    />
  );
  return {
    type: 'custom' as const,
    render
  };
}
