import { revalidatePath, revalidateTag } from 'next/cache';

// A profile *name* ('default', 'max', ...) means stale-while-revalidate in Next
// 16: the next request still gets the old entry while it refreshes in the
// background, which is how a just-saved draft rendered stale. `{ expire: 0 }`
// expires the tag now and avoids the single-argument deprecation warning.
export function revalidateTagSafe(tag: string) {
  revalidateTag(tag, { expire: 0 });
}

export function revalidateTags(tags: string[]) {
  for (const tag of tags) {
    revalidateTagSafe(tag);
  }
}

export function revalidatePathSafe(path: string, type?: 'layout' | 'page') {
  revalidatePath(path, type);
}
