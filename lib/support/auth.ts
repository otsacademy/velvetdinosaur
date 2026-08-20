import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/auth.ts');

import { getAuth } from '@/lib/auth';
import { requireAdmin } from '@/lib/roles';

type SupportActorRole = 'admin-requester' | 'support-agent' | 'system';

export type SupportSessionUser = {
  id: string;
  email: string;
  name: string;
  actorRole: SupportActorRole;
  isAdmin: boolean;
};

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeEmail(value: unknown) {
  return clean(value).toLowerCase();
}

function parseEmails(raw?: string | null) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isSupportAgentEmail(email?: string | null) {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const configured = parseEmails(process.env.VD_SUPPORT_AGENT_EMAILS);
  return configured.includes(normalized);
}

function resolveActorRole(email: string): SupportActorRole {
  if (isSupportAgentEmail(email)) return 'support-agent';
  return 'admin-requester';
}

function toSessionUser(session: unknown): SupportSessionUser | null {
  const user = (session as { user?: { id?: string; email?: string; name?: string | null } } | null)?.user;
  const id = clean(user?.id);
  if (!id) return null;
  const email = normalizeEmail(user?.email);
  return {
    id,
    email,
    name: clean(user?.name),
    actorRole: resolveActorRole(email),
    isAdmin: false
  };
}

export async function getSessionUserFromHeaders(headersInit: HeadersInit | null | undefined) {
  const auth = getAuth();
  const requestHeaders = new Headers(headersInit || {});
  const session = await auth.api.getSession({ headers: requestHeaders });
  return toSessionUser(session);
}

export async function requireSupportUserFromHeaders(headersInit: HeadersInit | null | undefined) {
  const user = await getSessionUserFromHeaders(headersInit);
  if (!user) return null;
  const allowed = await requireAdmin(user.id, user.email || null);
  return {
    ...user,
    isAdmin: allowed
  };
}

export async function requireAdminFromHeaders(headersInit: HeadersInit | null | undefined) {
  const user = await requireSupportUserFromHeaders(headersInit);
  if (!user) return null;
  return user.isAdmin ? user : null;
}

export function requireSupportAgent(user: SupportSessionUser | null) {
  if (!user) return false;
  return user.actorRole === 'support-agent';
}
