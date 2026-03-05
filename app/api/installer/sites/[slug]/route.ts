import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { requireInstallerAdmin } from '@/lib/admin';
import { getSiteSummary } from '@/lib/installer-io';
import { INSTALLER_ROOT } from '@/lib/installer-paths';

type Params = {
  params: Promise<{ slug: string }>;
};

const UNINSTALL_SCRIPT =
  process.env.VD_UNINSTALL_SCRIPT || path.join(INSTALLER_ROOT, 'uninstall.sh');

export async function GET(request: Request, { params }: Params) {
  unstable_noStore();
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }
  const slug = (await params).slug;
  const summary = await getSiteSummary(slug);
  return NextResponse.json({ site: summary });
}

function runUninstall(slug: string, domain: string, purge: boolean) {
  return new Promise<{ code: number; output: string }>((resolve) => {
    const args = ['--site-slug', slug];
    if (domain) args.push('--domain', domain);
    if (purge) args.push('--purge');
    const needsSudo = typeof process.getuid === 'function' && process.getuid() !== 0;
    const command = needsSudo ? 'sudo' : 'bash';
    const commandArgs = needsSudo
      ? ['-n', 'bash', UNINSTALL_SCRIPT, ...args]
      : [UNINSTALL_SCRIPT, ...args];
    const child = spawn(command, commandArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    let output = '';
    child.stdout.on('data', (chunk) => {
      output += String(chunk);
    });
    child.stderr.on('data', (chunk) => {
      output += String(chunk);
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 0, output });
    });
  });
}

export async function DELETE(request: Request, { params }: Params) {
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }
  if (!existsSync(UNINSTALL_SCRIPT)) {
    return NextResponse.json(
      { error: 'Uninstall script not found on server.' },
      { status: 500 }
    );
  }

  const url = new URL(request.url);
  const purge = url.searchParams.get('purge') !== 'false';
  const domain = url.searchParams.get('domain')?.trim() || '';
  const slug = (await params).slug;
  const result = await runUninstall(slug, domain, purge);
  if (result.code !== 0) {
    return NextResponse.json(
      { error: `Uninstall failed (exit ${result.code}).`, output: result.output },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
