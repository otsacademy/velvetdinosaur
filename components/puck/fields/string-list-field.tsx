'use client';

import type { CustomFieldRender } from '@measured/puck';
import { Textarea } from '@/components/ui/textarea';

type Options = {
  placeholder?: string;
  rows?: number;
};

function toList(value: unknown) {
  if (Array.isArray(value)) {
    return value
      .map((entry) => {
        if (entry === null || entry === undefined) return '';
        if (typeof entry === 'string' || typeof entry === 'number') {
          return String(entry).trim();
        }
        if (typeof entry === 'object') {
          const record = entry as { value?: unknown; slug?: unknown; id?: unknown };
          const candidate = record.value ?? record.slug ?? record.id;
          if (candidate === null || candidate === undefined) return '';
          return String(candidate).trim();
        }
        return '';
      })
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .split(/[\n,]+/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function stringListField(options: Options = {}) {
  const placeholder = options.placeholder || 'One value per line';
  const rows = options.rows || 4;

  const render: CustomFieldRender<string[]> = ({ value, onChange }) => {
    const list = toList(value);
    return (
      <Textarea
        rows={rows}
        value={list.join('\n')}
        placeholder={placeholder}
        onChange={(event) => {
          const next = toList(event.target.value);
          onChange(next);
        }}
      />
    );
  };

  return {
    type: 'custom',
    render
  } as const;
}
