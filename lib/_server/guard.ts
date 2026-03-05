export function assertServerOnly(moduleName: string) {
  if (typeof window !== 'undefined') {
    throw new Error(`${moduleName} is server-only and must not run in the browser.`);
  }
}
