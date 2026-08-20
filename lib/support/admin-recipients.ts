import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/support/admin-recipients.ts');

import { connectDB } from '@/lib/db';
import { isConfiguredAdminEmail } from '@/lib/roles';
import { UserRole } from '@/models/UserRole';

type UserDoc = {
  _id: string | { toHexString?: () => string };
  email?: string | null;
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
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean);
}

function toIdString(value: UserDoc['_id'] | null | undefined) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toHexString?.() || '';
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

export async function listAdminRecipientEmails() {
  const configured = parseEmails(process.env.VD_ADMIN_EMAILS);

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) return configured;

  const users = (await db
    .collection<UserDoc>('user')
    .find({}, { projection: { _id: 1, email: 1 } })
    .limit(5000)
    .toArray()) as UserDoc[];

  if (!users.length) return configured;

  const userIds = users.map((user) => toIdString(user._id)).filter(Boolean);
  const roleDocs = (await UserRole.find(
    { userId: { $in: userIds } },
    { userId: 1, role: 1 }
  ).lean()) as Array<{ userId?: string; role?: string }>;

  const adminRoleIds = new Set<string>();
  for (const roleDoc of roleDocs) {
    if (clean(roleDoc.role) !== 'admin') continue;
    const id = clean(roleDoc.userId);
    if (id) adminRoleIds.add(id);
  }

  const adminEmailsFromUsers = users
    .map((user) => {
      const email = normalizeEmail(user.email);
      if (!email) return '';
      const userId = toIdString(user._id);
      if (adminRoleIds.has(userId)) return email;
      return isConfiguredAdminEmail(email) ? email : '';
    })
    .filter(Boolean);

  // Include configured admin emails even if those users have not logged in yet.
  return unique([...configured, ...adminEmailsFromUsers]);
}
