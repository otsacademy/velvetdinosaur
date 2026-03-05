import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { getInstallerJob } from '@/lib/installer-jobs';

type Params = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Params) {
  unstable_noStore();
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status });
  }
  const job = await getInstallerJob((await params).id);
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  return NextResponse.json({ job });
}
