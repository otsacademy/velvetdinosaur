import type { ComponentType } from 'react';

type PreviewComponent = ComponentType<Record<string, unknown>>;

export type PreviewRegistryEntry = {
  id: string;
  type: 'block' | 'primitive';
  importModule: () => Promise<{ default: PreviewComponent }>;
};

let registryPromise: Promise<Record<string, PreviewRegistryEntry>> | null = null;

export function areStorePreviewsEnabled() {
  // Production builds alias this module to preview-registry.stub.ts when
  // previews are disabled. Reaching this implementation therefore means the
  // full registry was deliberately included at build time.
  return true;
}

export async function getPreviewRegistry(): Promise<Record<string, PreviewRegistryEntry>> {
  if (!registryPromise) {
    registryPromise = import('./preview-registry.full').then((module) => module.previewRegistry);
  }

  return registryPromise;
}
