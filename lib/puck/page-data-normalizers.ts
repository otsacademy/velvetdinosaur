import type { Data } from '@puckeditor/core';

/**
 * Site-owned normalization seam invoked by lib/pages when loading stored Puck
 * data. Sites with legacy content shapes repair them here (see ASAP's
 * journal/research normalizers); Velvet Dinosaur has no legacy repairs, so
 * this is a passthrough.
 */
export function normalizePageDataForSlug(_slug: string, data: Data): Data {
  return data;
}
