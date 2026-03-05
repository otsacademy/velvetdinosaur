import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireInstallerAdmin } from '@/lib/admin';
import { createEditorSyncJob, ensureEditorSyncDirs } from '@/lib/editor-sync-jobs';
import {
  diffTouchesDenied,
  readEditorSyncManifest,
  resolveSitePath,
  runEditorSyncDryRun
} from '@/lib/editor-sync-service';
import { PLATFORM_ROOT } from '@/lib/installer-paths';
import path from 'node:path';
import { spawn } from 'node:child_process';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

const MAX_BODY_BYTES = 16 * 1024;

const editorSyncSchema = z.object({
  site: z.string().min(1),
  mode: z.enum(['dry-run', 'pr']),
  branch: z.string().optional()
});

function isHttpsRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https';
  }
  return new URL(request.url).protocol === 'https:';
}

function buildBranch(site: string) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
  return `chore/${site}-editor-sync-${stamp}`;
}

export async function POST(request: Request) {
  if (!isHttpsRequest(request)) {
    return NextResponse.json({ error: 'HTTPS required' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status, headers: NO_STORE_HEADERS });
  }

  const contentLength = request.headers.get('content-length');
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413, headers: NO_STORE_HEADERS });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = editorSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400, headers: NO_STORE_HEADERS });
  }

  const { site, mode } = parsed.data;
  resolveSitePath(site);

  const manifest = readEditorSyncManifest();
  const deny = manifest.deny || [];

  if (mode === 'dry-run') {
    const diff = runEditorSyncDryRun(site);
    const denied = diffTouchesDenied(diff, deny);
    if (denied.length > 0 || diff.denied.length > 0) {
      return NextResponse.json(
        { error: 'Denied paths detected', denied: Array.from(new Set([...denied, ...diff.denied])) },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }
    return NextResponse.json({ site, diff }, { headers: NO_STORE_HEADERS });
  }

  await ensureEditorSyncDirs();
  const branch = parsed.data.branch?.trim() || buildBranch(site);
  const session = gate.session as { user?: { email?: string; id?: string } } | null;
  const job = await createEditorSyncJob({
    site: { slug: site },
    mode: 'pr',
    branch,
    createdBy: {
      email: session?.user?.email,
      id: session?.user?.id
    },
    input: { site, mode, branch }
  });

  const runnerScript = path.join('scripts', 'editor-sync-runner.ts');
  const templateRoot = path.join(PLATFORM_ROOT, 'template');
  const child = spawn('bun', [runnerScript, '--job', job.id], {
    cwd: templateRoot,
    env: { ...process.env, VD_PLATFORM_ROOT: PLATFORM_ROOT },
    stdio: 'ignore',
    detached: true
  });
  child.unref();

  return NextResponse.json({ job }, { headers: NO_STORE_HEADERS });
}
