import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { requireInstallerAdmin } from '@/lib/admin';

type OperationsPath = '/admin' | '/admin/fleet';

export async function requireOperationsAdmin(nextPath: OperationsPath) {
  const gate = await requireInstallerAdmin(await headers());
  if (!gate.session) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  if (!gate.ok) {
    redirect('/edit');
  }
  return gate.session;
}
