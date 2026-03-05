export function demoKey(id: string | undefined, path: string) {
  return id ? `${id}.${path}` : path;
}

