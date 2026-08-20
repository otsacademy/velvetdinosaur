import { connectDB } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { UserRole } from '@/models/UserRole';

export type Role = 'admin' | 'user';
export type RoleResult = Role | 'none';

const LEGACY_DEFAULT_ADMIN_EMAILS = ['ian.wickens@ontourism.academy'];
const useLegacyDefaultAdmin = process.env.VD_ALLOW_LEGACY_DEFAULT_ADMIN === 'true';

function parseEmails(raw?: string | null) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export function isConfiguredAdminEmail(email?: string | null) {
  const normalized = (email || '').trim().toLowerCase();
  if (!normalized) return false;
  const configured = parseEmails(process.env.VD_ADMIN_EMAILS);
  const allowed = configured.length > 0 ? configured : useLegacyDefaultAdmin ? LEGACY_DEFAULT_ADMIN_EMAILS : [];
  return allowed.includes(normalized);
}

export function roleIsAdmin(role: RoleResult) {
  return role === 'admin';
}

export async function getUserRole(userId?: string | null, email?: string | null): Promise<RoleResult> {
  if (isConfiguredAdminEmail(email)) return 'admin';
  if (!userId) return 'none';
  const conn = await connectDB();
  if (!conn) return 'none';
  const record = await UserRole.findOne({ userId }).lean();
  if (!record || Array.isArray(record)) return 'none';
  return (record as { role?: string }).role === 'admin' ? 'admin' : 'user';
}

export async function setUserRole(userId: string, role: Role, actorUserId?: string | null) {
  const conn = await connectDB();
  if (!conn) {
    throw new Error('Database connection not available');
  }
  const updated = await UserRole.findOneAndUpdate(
    { userId },
    { $set: { role } },
    { new: true, upsert: true }
  );
  await logAudit({
    action: 'role.set',
    actorUserId: actorUserId ?? null,
    targetUserId: userId,
    metadata: { role }
  });
  return updated;
}

export async function requireAdmin(userId?: string | null, email?: string | null) {
  const role = await getUserRole(userId, email);
  return roleIsAdmin(role);
}
