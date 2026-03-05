type SmokeResult = {
  path: string;
  status: number;
};

const OK_STATUSES = new Set([200, 301, 302, 303, 307, 308, 401, 403]);

function resolveBaseUrl() {
  return (
    process.env.EDITOR_SMOKE_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.PUBLIC_BASE_URL ||
    process.env.CANONICAL_ORIGIN ||
    'http://localhost:3000'
  ).replace(/\/$/, '');
}

async function fetchPath(baseUrl: string, path: string): Promise<SmokeResult> {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, { redirect: 'manual' });
  return { path, status: res.status };
}

async function main() {
  const baseUrl = resolveBaseUrl();
  const paths = ['/edit', '/edit/media'];
  const results = await Promise.all(paths.map((path) => fetchPath(baseUrl, path)));
  const failed = results.filter((result) => !OK_STATUSES.has(result.status));

  if (failed.length > 0) {
    const summary = failed.map((result) => `${result.path} -> ${result.status}`).join(', ');
    throw new Error(`Editor runtime smoke failed (${baseUrl}): ${summary}`);
  }

  results.forEach((result) => {
    console.log(`[editor-smoke] ${result.path} -> ${result.status}`);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
