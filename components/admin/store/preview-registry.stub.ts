import type { ComponentType } from 'react';

type PreviewComponent = ComponentType<Record<string, unknown>>;

export type PreviewRegistryEntry = {
  id: string;
  type: 'block' | 'primitive';
  importModule: () => Promise<{ default: PreviewComponent }>;
};

const previewRegistry: Record<string, PreviewRegistryEntry> = {};

export function areStorePreviewsEnabled() {
  return false;
}

export async function getPreviewRegistry(): Promise<Record<string, PreviewRegistryEntry>> {
  return previewRegistry;
}
