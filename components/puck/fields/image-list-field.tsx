'use client';

import type { CustomFieldRender } from '@measured/puck';
import { useMemo } from 'react';
import { AssetPickerField } from '@/components/puck/fields/asset-picker-field';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ImageListFieldProps = {
  value?: string[];
  onChange: (value: string[]) => void;
  accept?: string;
};

function normalizeList(value?: string[]) {
  return Array.isArray(value) ? value : [];
}

export function ImageListField({ value, onChange, accept = 'image/*' }: ImageListFieldProps) {
  const list = normalizeList(value);
  const displayList = useMemo(() => (list.length ? list : ['']), [list]);

  const updateItem = (index: number, nextValue: string) => {
    const base = list.length ? list : [''];
    const next = [...base];
    next[index] = nextValue;
    onChange(next);
  };

  const removeItem = (index: number) => {
    const base = list.length ? list : [''];
    const next = base.filter((_, idx) => idx !== index);
    onChange(next);
  };

  const addItem = () => {
    onChange([...list, '']);
  };

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
                onClick={() => removeItem(index)}
              >
                Remove
              </Button>
            </div>
            <AssetPickerField value={entry || ''} onChange={(next) => updateItem(index, next)} accept={accept} />
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addItem}>
        Add image
      </Button>
    </div>
  );
}

export function imageListField(options?: { accept?: string }) {
  const accept = options?.accept;
  const render: CustomFieldRender<string[]> = ({ value, onChange }) => (
    <ImageListField value={normalizeList(value as string[])} onChange={onChange} accept={accept} />
  );
  return {
    type: 'custom' as const,
    render
  };
}
