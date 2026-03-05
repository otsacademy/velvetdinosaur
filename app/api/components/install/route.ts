import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import {
  installStoreBlock,
  isAdminEmailAllowed,
  isComponentStoreWriteEnabled,
  rebuildAndRestart
} from '@/lib/component-store';

export async function POST(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!isComponentStoreWriteEnabled()) {
    return NextResponse.json({ error: 'Component installs disabled (set VD_COMPONENT_STORE_WRITE=true).' }, { status: 403 });
  }

  const email = (session as { user?: { email?: string } })?.user?.email;
  if (!isAdminEmailAllowed(email)) {
    return NextResponse.json({ error: 'Not allowed to install components.' }, { status: 403 });
  }

  const body = await request.json();
  const id = body?.id as string | undefined;
  const rebuild = Boolean(body?.rebuild);

  if (!id) {
    return NextResponse.json({ error: 'Missing component id' }, { status: 400 });
  }

  try {
    const installed = await installStoreBlock(id);
    let buildResult: { restarted: boolean; name?: string; message?: string } | null = null;

    if (rebuild || process.env.VD_COMPONENT_STORE_AUTO_BUILD === 'true') {
      buildResult = await rebuildAndRestart();
    }

    return NextResponse.json({ ok: true, installed, buildResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Install failed';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
