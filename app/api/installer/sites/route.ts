import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { listSites } from '@/lib/installer-io';

export async function GET(request: Request) {
  unstable_noStore();
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }
  const sites = await listSites();
  return NextResponse.json({ sites });
}
