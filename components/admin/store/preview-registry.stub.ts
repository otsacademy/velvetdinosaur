export type PreviewRegistryEntry = {
  id: string;
  type: 'block' | 'primitive';
  importModule: () => Promise<unknown>;
};

export const previewRegistry: Record<string, PreviewRegistryEntry> = {};
