import { connectDB } from '@/lib/db';
import { logAudit } from '@/lib/audit';
import { UserRole } from '@/models/UserRole';

export type Role = 'admin' | 'user';
export type RoleResult = Role | 'none';

export function roleIsAdmin(role: RoleResult) {
  return role === 'admin';
}

export async function getUserRole(userId?: string | null): Promise<RoleResult> {
  if (!userId) return 'none';
  await connectDB();
  const record = await UserRole.findOne({ userId }).lean();
  if (!record || Array.isArray(record)) return 'none';
  return (record as { role?: string }).role === 'admin' ? 'admin' : 'user';
}

export async function setUserRole(userId: string, role: Role, actorUserId?: string | null) {
  await connectDB();
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

export async function requireAdmin(userId?: string | null) {
  const role = await getUserRole(userId);
  return roleIsAdmin(role);
}
