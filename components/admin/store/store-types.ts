export type StoreItemType = 'block' | 'primitive';

export type StoreItem = {
  id: string;
  name: string;
  key?: string;
  version: string;
  description?: string;
  path?: string;
  preview?: string;
  tags?: string[];
  categories?: string[];
  type: StoreItemType;
  status?: 'ready' | 'beta' | 'experimental';
  source?: string;
};
