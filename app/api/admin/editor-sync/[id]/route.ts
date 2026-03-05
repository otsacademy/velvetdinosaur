import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { requireInstallerAdmin } from '@/lib/admin';
import { getEditorSyncJob, readEditorSyncLog } from '@/lib/editor-sync-jobs';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
  Expires: '0'
};

function isHttpsRequest(request: Request) {
  const forwardedProto = request.headers.get('x-forwarded-proto');
  if (forwardedProto) {
    return forwardedProto.split(',')[0]?.trim().toLowerCase() === 'https';
  }
  return new URL(request.url).protocol === 'https:';
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  unstable_noStore();
  if (!isHttpsRequest(request)) {
    return NextResponse.json({ error: 'HTTPS required' }, { status: 400, headers: NO_STORE_HEADERS });
  }
  const gate = await requireInstallerAdmin(request.headers);
  if (!gate.ok) {
    return NextResponse.json({ error: 'Forbidden' }, { status: gate.status, headers: NO_STORE_HEADERS });
  }

  const id = (await params).id;
  const job = await getEditorSyncJob(id);
  if (!job) {
    return NextResponse.json({ error: 'Not found' }, { status: 404, headers: NO_STORE_HEADERS });
  }
  const url = new URL(request.url);
  const offsetRaw = url.searchParams.get('offset');
  const offset = offsetRaw ? Number(offsetRaw) : 0;
  const log = await readEditorSyncLog(id, Number.isFinite(offset) ? offset : 0);

  return NextResponse.json({ job, log }, { headers: NO_STORE_HEADERS });
}
