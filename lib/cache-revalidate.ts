import { revalidatePath, revalidateTag } from 'next/cache';

export function revalidateTagSafe(tag: string) {
  revalidateTag(tag, 'default');
}

export function revalidateTags(tags: string[]) {
  for (const tag of tags) {
    revalidateTagSafe(tag);
  }
}

export function revalidatePathSafe(path: string, type?: 'layout' | 'page') {
  revalidatePath(path, type);
}
