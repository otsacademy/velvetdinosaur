import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { resolve4, resolve6, resolveCname } from 'node:dns/promises';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { requireInstallerAdmin } from '@/lib/admin';

const DOMAIN_SERVICE_ROOTS = [
  process.env.DOMAIN_SERVICE_ROOT,
  '/opt/domain-service.work',
  '/var/www/domain-service.work'
].filter(Boolean) as string[];

function stripQuotes(value: string) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function readExpectedIp() {
  if (process.env.DOMAIN_SERVICE_SERVER_IP) {
    return process.env.DOMAIN_SERVICE_SERVER_IP;
  }
  for (const root of DOMAIN_SERVICE_ROOTS) {
    const envPath = path.join(root, '.env');
    if (!existsSync(envPath)) continue;
    const raw = await fs.readFile(envPath, 'utf8').catch(() => '');
    if (!raw) continue;
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      const key = trimmed.slice(0, idx).trim();
      if (key !== 'SERVER_IP') continue;
      return stripQuotes(trimmed.slice(idx + 1).trim());
    }
  }
  return '';
}

async function safeResolve<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  unstable_noStore();
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }

  const url = new URL(request.url);
  const domain = url.searchParams.get('domain')?.trim();
  if (!domain) {
    return NextResponse.json({ error: 'Missing domain.' }, { status: 400 });
  }

  const [a, aaaa, cname, expectedIp] = await Promise.all([
    safeResolve(() => resolve4(domain)),
    safeResolve(() => resolve6(domain)),
    safeResolve(() => resolveCname(domain)),
    readExpectedIp()
  ]);

  const records = {
    a: (a as string[]) || [],
    aaaa: (aaaa as string[]) || [],
    cname: (cname as string[]) || []
  };
  const ok = records.a.length > 0 || records.aaaa.length > 0 || records.cname.length > 0;

  return NextResponse.json({
    ok,
    domain,
    expectedIp: expectedIp || undefined,
    records,
    error: ok ? undefined : 'No DNS records found (NXDOMAIN).'
  });
}
