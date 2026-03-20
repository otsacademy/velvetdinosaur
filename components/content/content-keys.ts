export function contentKey(id: string | undefined, path: string) {
  return id ? `${id}.${path}` : path;
}
