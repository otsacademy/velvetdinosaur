'use client';

import * as React from 'react';
import { AlertTriangle, Pin, PinOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Puck } from '@puckeditor/core';
import { isLegacyPageComponent } from '@/lib/puck/legacy-page-components';

function PinIcon({ className }: { className?: string }) {
  return <Pin {...(className ? { className } : {})} size={16} strokeWidth={1.75} />;
}

function PinOffIcon({ className }: { className?: string }) {
  return <PinOff {...(className ? { className } : {})} size={16} strokeWidth={1.75} />;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

function normalizeId(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizePathPart(value: unknown): string | null {
  if (Array.isArray(value)) {
    return value.length ? value.map((item) => String(item)).join('.') : null;
  }

  return normalizeId(value);
}

function normalizeNumberLike(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function getSelectedComponentType(selectedItem: unknown): string | null {
  const directType = normalizeId(asRecord(selectedItem)?.type);
  if (directType) return directType;

  const record = asRecord(selectedItem);
  if (!record) return null;

  const nestedCandidates = [
    asRecord(record.item)?.type,
    asRecord(record.data)?.type,
    asRecord(record.props)?.type
  ];

  for (const candidate of nestedCandidates) {
    const resolved = normalizeId(candidate);
    if (resolved) return resolved;
  }

  return null;
}

export function getSelectedKey(selectedItem: unknown): string | null {
  const directId = normalizeId(selectedItem);
  if (directId) return directId;

  const record = asRecord(selectedItem);
  if (!record) return null;

  const nested = [record.id, asRecord(record.props)?.id, asRecord(record.item)?.id, asRecord(record.data)?.id];

  for (const candidate of nested) {
    const resolved = normalizeId(candidate);
    if (resolved) return resolved;
  }

  const nestedPath = [
    asRecord(record.props)?.name,
    asRecord(record.item)?.name,
    asRecord(record.data)?.name,
    record.path
  ];

  for (const candidate of nestedPath) {
    const resolved = normalizeId(candidate);
    if (resolved) return resolved;
  }

  const pathCandidate = [
    normalizePathPart(record.path),
    normalizePathPart(record.key),
    normalizeId(record.idPath),
    normalizeNumberLike(record.index),
    normalizeId(record.itemId)
  ];

  for (const candidate of pathCandidate) {
    if (candidate) return candidate;
  }

  return null;
}

export function buildId(blockType: string, index: number) {
  const safeType = blockType.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const random =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);

  return `${safeType}-${Date.now().toString(36).slice(2)}-${index}-${random}`;
}

export function PropertiesPanel({
  isGlobalRouteLocked,
  onUnlockGlobal,
  selectedItem
}: {
  isGlobalRouteLocked: boolean;
  onUnlockGlobal?: () => void;
  selectedItem: unknown;
}) {
  if (!selectedItem) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-sm text-[var(--vd-muted-fg)]">
        Select a block to edit its settings.
      </div>
    );
  }

  if (isGlobalRouteLocked) {
    return (
      <div className="space-y-3 p-4 text-sm text-[var(--vd-muted-fg)]">
        <div className="rounded-md border border-[var(--vd-border)] bg-[var(--vd-muted)] px-3 py-2">
          This is global content. Changes apply to all pages.
        </div>
        <p>
          Global pages are locked by default to avoid accidental edits that affect every page.
        </p>
        <Button size="sm" variant="outline" className="w-full" onClick={onUnlockGlobal}>
          Unlock global editing
        </Button>
      </div>
    );
  }

  const selectedType = getSelectedComponentType(selectedItem);
  const showLegacyWarning = isLegacyPageComponent(selectedType);

  return (
    <>
      {showLegacyWarning ? (
        <div className="mx-4 mt-4 rounded-md border border-[var(--vd-border)] bg-[var(--vd-muted)] p-3 text-sm text-[var(--vd-muted-fg)]">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 text-[var(--vd-fg)]" />
            <div>
              <p className="font-medium text-[var(--vd-fg)]">Legacy page template</p>
              <p className="mt-1">
                This block is read-only for new inserts. Use <strong>Convert to blocks</strong> in the editor toolbar
                to migrate this page.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      <Puck.Fields />
    </>
  );
}

export { PinIcon, PinOffIcon };
