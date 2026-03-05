/* eslint-disable @next/next/no-img-element */
'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type PreviewProps = {
  name: string;
  props: Record<string, unknown>;
  className?: string;
};

function renderValue(value: unknown): ReactNode {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function extractLabel(entry: unknown): string {
  if (entry === null || entry === undefined) return '';
  if (typeof entry === 'string' || typeof entry === 'number') return String(entry).trim();
  if (typeof entry === 'object') {
    const record = entry as Record<string, unknown>;
    const candidate =
      record.value ??
      record.label ??
      record.title ??
      record.name ??
      record.slug ??
      record.id ??
      record.href ??
      record.text;
    if (candidate === null || candidate === undefined) return '';
    return String(candidate).trim();
  }
  return '';
}

function normalizeList(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) {
    return value
      .map((entry) => extractLabel(entry))
      .filter(Boolean);
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const trimmed = String(value).trim();
    return trimmed ? [trimmed] : [];
  }
  if (typeof value === 'object') {
    const trimmed = extractLabel(value);
    return trimmed ? [trimmed] : [];
  }
  return [];
}

function pick(props: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = props[key];
    if (value !== undefined && value !== null && value !== '') {
      return { key, value };
    }
  }
  return null;
}

export function StoreBlockPreview({ name, props, className }: PreviewProps) {
  const title = pick(props, ['title', 'headline', 'heading', 'name']);
  const accent = pick(props, ['accent', 'highlight']);
  const lead = pick(props, ['lead', 'subtitle', 'description', 'body', 'summary']);
  const image = pick(props, ['image', 'src', 'logoUrl', 'logoSrc', 'coverImage', 'banner', 'thumbnail']);
  const listFields = [
    { key: 'items', label: 'Items' },
    { key: 'entries', label: 'Entries' },
    { key: 'sections', label: 'Sections' },
    { key: 'links', label: 'Links' },
    { key: 'navItems', label: 'Navigation' },
    { key: 'ctas', label: 'CTAs' },
    { key: 'stats', label: 'Stats' }
  ];

  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-[var(--vd-border)] bg-white/85 p-5 text-[13px] text-[var(--vd-fg)] shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-black uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
          {name}
        </div>
        <span className="rounded-full bg-[var(--vd-muted)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
          Preview
        </span>
      </div>

      {title || accent ? (
        <h3 className="mt-3 text-lg font-black uppercase tracking-tight">
          {title?.value ? (
            <span>{renderValue(title.value)}</span>
          ) : null}{' '}
          {accent?.value ? (
            <span className="text-[var(--vd-primary)] italic font-display font-normal">
              {renderValue(accent.value)}
            </span>
          ) : null}
        </h3>
      ) : null}

      {lead?.value ? (
        <p className="mt-2 text-sm text-[var(--vd-muted-fg)]">
          {renderValue(lead.value)}
        </p>
      ) : null}

      {image?.value && typeof image.value === 'string' ? (
        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--vd-border)]">
          <img
            src={image.value}
            alt=""
            width={960}
            height={360}
            className="h-36 w-full object-cover"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <div className="mt-4 space-y-2">
        {listFields.map((field) => {
          const items = normalizeList(props[field.key]);
          if (!items.length) return null;
          const visible = items.slice(0, 6);
          const remaining = items.length - visible.length;
          return (
            <div key={field.key}>
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--vd-muted-fg)]">
                {field.label}
              </div>
              <div className="mt-1 flex flex-wrap gap-2">
                {visible.map((item, idx) => (
                  <span
                    key={`${field.key}-${idx}`}
                    className="rounded-full border border-[var(--vd-border)] bg-white px-2 py-0.5 text-[11px]"
                  >
                    {renderValue(item)}
                  </span>
                ))}
                {remaining > 0 ? (
                  <span className="rounded-full border border-[var(--vd-border)] bg-white px-2 py-0.5 text-[11px]">
                    +{remaining} more
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
