import type { Field } from '@puckeditor/core';

export type AssetFieldKind = 'image' | 'file';

export function assetField(kind: AssetFieldKind = 'image', options: Partial<Field> = {}): Field {
  return { type: 'text', ...options, assetKind: kind } as unknown as Field;
}
