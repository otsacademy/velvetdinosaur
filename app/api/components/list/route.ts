import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import {
  getComponentStoreInstallPolicy,
  getStorePath,
  isAdminEmailAllowed,
  isComponentStoreWriteEnabled,
  readInstalledBlocks,
  readStoreIndex
} from '@/lib/component-store';

export async function GET(request: Request) {
  unstable_noStore();
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const store = await readStoreIndex();
  const installed = await readInstalledBlocks();
  const email = (session as { user?: { email?: string } })?.user?.email;
  const writeEnabled = isComponentStoreWriteEnabled();
  const policy = getComponentStoreInstallPolicy();
  const adminAllowed = isAdminEmailAllowed(email);

  return NextResponse.json({
    activationCommand: policy.activationCommand,
    activationMode: policy.activationMode,
    installBlockedReason: policy.installBlockedReason,
    rebuildAllowed: policy.rebuildAllowed,
    runtimeInstallAllowed: policy.runtimeInstallAllowed,
    store,
    installed,
    storePath: getStorePath(),
    writeEnabled,
    adminAllowed
  });
}
