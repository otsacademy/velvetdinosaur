import { getAuth } from '@/lib/auth';

function parseEmails(raw?: string | null) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isInstallerAdmin(email?: string | null) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  const installerAdmins = parseEmails(process.env.VD_INSTALLER_ADMINS);
  const fallbackAdmins =
    installerAdmins.length > 0 ? [] : parseEmails(process.env.VD_COMPONENT_STORE_ADMINS);
  const allowed = installerAdmins.length > 0 ? installerAdmins : fallbackAdmins;
  return allowed.includes(normalized);
}

export async function requireInstallerAdmin(headers: Headers) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers });
  if (!session) {
    return { ok: false as const, status: 401 as const, session: null };
  }
  const email = (session as { user?: { email?: string } })?.user?.email || '';
  if (!isInstallerAdmin(email)) {
    return { ok: false as const, status: 403 as const, session };
  }
  return { ok: true as const, status: 200 as const, session };
}
