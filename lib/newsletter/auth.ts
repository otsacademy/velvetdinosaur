import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/newsletter/auth.ts');

import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';
import { clean, normalizeEmail } from '@/lib/newsletter/shared';

export type NewsletterSessionUser = {
  id: string;
  email: string;
  name: string;
};

function toSessionUser(session: unknown): NewsletterSessionUser | null {
  const user = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  const id = clean(user?.id);
  const email = normalizeEmail(user?.email);
  if (!id || !email) return null;
  return {
    id,
    email,
    name: clean(user?.name)
  };
}

export async function getSessionUserFromHeaders(headersInit: HeadersInit | null | undefined) {
  const auth = getAuth();
  const requestHeaders = new Headers(headersInit || {});
  const session = await auth.api.getSession({ headers: requestHeaders });
  return toSessionUser(session);
}

export async function requireAdminFromHeaders(headersInit: HeadersInit | null | undefined) {
  const user = await getSessionUserFromHeaders(headersInit);
  if (!user) return null;
  const allowed = await requireAdmin(user.id, user.email);
  return allowed ? user : null;
}
