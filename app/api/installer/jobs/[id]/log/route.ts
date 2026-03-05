import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { readInstallerLog } from '@/lib/installer-jobs';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  unstable_noStore();
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }
  const { searchParams } = new URL(request.url);
  const offset = Number(searchParams.get('offset') || '0');
  const result = await readInstallerLog((await params).id, Number.isFinite(offset) ? offset : 0);
  return NextResponse.json(result);
}
