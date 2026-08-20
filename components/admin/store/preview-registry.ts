import type { ComponentType } from 'react';

type PreviewComponent = ComponentType<Record<string, unknown>>;

export type PreviewRegistryEntry = {
  id: string;
  type: 'block' | 'primitive';
  importModule: () => Promise<{ default: PreviewComponent }>;
};

const PREVIEWS_ENABLED =
  process.env.NODE_ENV !== 'production' || process.env.VD_ENABLE_STORE_PREVIEW === 'true';
let registryPromise: Promise<Record<string, PreviewRegistryEntry>> | null = null;

export function areStorePreviewsEnabled() {
  return PREVIEWS_ENABLED;
}

export async function getPreviewRegistry(): Promise<Record<string, PreviewRegistryEntry>> {
  if (!PREVIEWS_ENABLED) {
    return {};
  }

  if (!registryPromise) {
    registryPromise = import('./preview-registry.full').then((module) => module.previewRegistry);
  }

  return registryPromise;
}
