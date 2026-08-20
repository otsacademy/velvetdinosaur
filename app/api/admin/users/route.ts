import { ObjectId } from 'mongodb';
import { unstable_noStore } from 'next/cache';
import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { logAudit } from '@/lib/audit';
import { getChapterName, normalizeChapterSlug, normalizeChapterSlugs } from '@/lib/chapters';
import { connectDB } from '@/lib/db';
import { resolveConfiguredAuthOrigin } from '@/lib/request-origin';
import { revokeUserAccess } from '@/lib/user-account-access';
import { isConfiguredAdminEmail, requireAdmin, setUserRole, type Role } from '@/lib/roles';
import { UserProfile } from '@/models/UserProfile';
import { UserRole } from '@/models/UserRole';

type UserDoc = {
  _id: ObjectId | string;
  name?: string | null;
  email?: string | null;
  createdAt?: Date | string | null;
  accessRemovedAt?: Date | string | null;
};

type SessionAggDoc = {
  _id: ObjectId;
  lastSessionAt?: Date | string | null;
};

type ProfileDoc = {
  userId?: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  orcidId?: string;
  primaryChapterSlug?: string;
  chapterSlugs?: string[];
};

function toObjectId(value: string) {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
}

function toIdString(value: ObjectId | string | null | undefined) {
  if (!value) return '';
  return typeof value === 'string' ? value : value.toHexString();
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function toIsoString(value: Date | string | null | undefined) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

const ACTIVE_USER_FILTER = {
  $or: [{ accessRemovedAt: { $exists: false } }, { accessRemovedAt: null }]
};

function buildUserLookupFilter(userId: string) {
  const asObjectId = toObjectId(userId);
  if (!asObjectId) {
    return { _id: userId };
  }
  return {
    $or: [{ _id: userId }, { _id: asObjectId }]
  };
}

function buildActiveUserLookupFilter(userId: string) {
  return {
    $and: [buildUserLookupFilter(userId), ACTIVE_USER_FILTER]
  };
}

function resolveRole(explicitRole: string | null | undefined, email: string | null | undefined): Role {
  if (explicitRole === 'admin') return 'admin';
  if (isConfiguredAdminEmail(email)) return 'admin';
  return 'user';
}

function buildDisplayName(user: UserDoc, profile: ProfileDoc | undefined) {
  const fromUser = clean(user.name);
  if (fromUser) return fromUser;
  const fromProfile = clean(profile?.displayName);
  if (fromProfile) return fromProfile;
  const firstName = clean(profile?.firstName);
  const lastName = clean(profile?.lastName);
  const combined = `${firstName} ${lastName}`.trim();
  if (combined) return combined;
  const email = clean(user.email);
  return email || 'Unknown user';
}

async function getAdminContext(request: Request) {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: request.headers });
  const user = (session as { user?: { id?: string; email?: string } } | null)?.user;
  const userId = user?.id || null;
  const userEmail = user?.email || null;
  if (!session || !(await requireAdmin(userId, userEmail))) {
    return { ok: false as const, response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return {
    ok: true as const,
    actorUserId: userId,
    actorEmail: userEmail
  };
}

export async function GET(request: Request) {
  unstable_noStore();
  const admin = await getAdminContext(request);
  if (!admin.ok) {
    return admin.response;
  }

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const userDocs = (await db
    .collection<UserDoc>('user')
    .find(
      ACTIVE_USER_FILTER,
      {
        projection: {
          _id: 1,
          name: 1,
          email: 1,
          createdAt: 1
        }
      }
    )
    .sort({ createdAt: -1 })
    .limit(500)
    .toArray()) as UserDoc[];

  const userIds = userDocs.map((doc) => toIdString(doc._id)).filter(Boolean);
  const objectUserIds = userDocs
    .map((doc) => {
      const idString = toIdString(doc._id);
      return toObjectId(idString);
    })
    .filter((value): value is ObjectId => Boolean(value));

  const [roleDocs, profileDocs, sessionAgg] = await Promise.all([
    UserRole.find({ userId: { $in: userIds } }, { userId: 1, role: 1 }).lean(),
    UserProfile.find(
      { userId: { $in: userIds } },
      { userId: 1, displayName: 1, firstName: 1, lastName: 1, orcidId: 1, primaryChapterSlug: 1, chapterSlugs: 1 }
    ).lean(),
    objectUserIds.length > 0
      ? db
          .collection('session')
          .aggregate<SessionAggDoc>([
            { $match: { userId: { $in: objectUserIds } } },
            { $group: { _id: '$userId', lastSessionAt: { $max: '$updatedAt' } } }
          ])
          .toArray()
      : Promise.resolve([])
  ]);

  const roleByUserId = new Map<string, string>();
  for (const row of roleDocs as Array<{ userId?: string; role?: string }>) {
    const id = clean(row.userId);
    if (!id) continue;
    roleByUserId.set(id, clean(row.role));
  }

  const profileByUserId = new Map<string, ProfileDoc>();
  for (const row of profileDocs as ProfileDoc[]) {
    const id = clean(row?.userId);
    if (!id) continue;
    profileByUserId.set(id, row);
  }

  const lastSessionByUserId = new Map<string, string | null>();
  for (const row of sessionAgg) {
    const userId = toIdString(row._id);
    lastSessionByUserId.set(userId, toIsoString(row.lastSessionAt));
  }

  const users = userDocs.map((userDoc) => {
    const id = toIdString(userDoc._id);
    const email = clean(userDoc.email).toLowerCase();
    const explicitRole = roleByUserId.get(id);
    const role = resolveRole(explicitRole, email);
    const profile = profileByUserId.get(id);
    const lastLoginAt = lastSessionByUserId.get(id) || null;
    const primaryChapterSlug = normalizeChapterSlug(profile?.primaryChapterSlug);
    const chapterSlugs = normalizeChapterSlugs(profile?.chapterSlugs, primaryChapterSlug);

    return {
      id,
      name: buildDisplayName(userDoc, profile),
      email,
      role,
      orcidId: clean(profile?.orcidId),
      primaryChapterSlug,
      primaryChapterName: getChapterName(primaryChapterSlug),
      chapterSlugs,
      createdAt: toIsoString(userDoc.createdAt),
      lastLoginAt
    };
  });

  const summary = users.reduce(
    (acc, user) => {
      acc.total += 1;
      if (user.role === 'admin') {
        acc.admins += 1;
      } else {
        acc.users += 1;
      }
      const lastLogin = user.lastLoginAt ? new Date(user.lastLoginAt).getTime() : 0;
      if (lastLogin > Date.now() - 30 * 24 * 60 * 60 * 1000) {
        acc.recentlyActive += 1;
      }
      return acc;
    },
    { total: 0, admins: 0, users: 0, recentlyActive: 0 }
  );

  return NextResponse.json({ users, summary });
}

export async function PATCH(request: Request) {
  const admin = await getAdminContext(request);
  if (!admin.ok) {
    return admin.response;
  }

  const body = await request.json().catch(() => ({}));
  const userId = clean(body?.userId);
  const nextRole = body?.role === 'admin' ? 'admin' : body?.role === 'user' ? 'user' : null;
  if (!userId) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }
  if (!nextRole) {
    return NextResponse.json({ error: 'Role must be user or admin' }, { status: 400 });
  }

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const targetUser = (await db.collection<UserDoc>('user').findOne(buildActiveUserLookupFilter(userId))) as UserDoc | null;
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const allUsers = (await db
    .collection<UserDoc>('user')
    .find(ACTIVE_USER_FILTER, { projection: { _id: 1, email: 1 } })
    .toArray()) as UserDoc[];
  const allUserIds = allUsers.map((doc) => toIdString(doc._id)).filter(Boolean);
  const roleDocs = (await UserRole.find({ userId: { $in: allUserIds } }, { userId: 1, role: 1 }).lean()) as Array<{
    userId?: string;
    role?: string;
  }>;
  const roleByUserId = new Map<string, string>();
  for (const row of roleDocs) {
    const id = clean(row.userId);
    if (!id) continue;
    roleByUserId.set(id, clean(row.role));
  }

  let adminCountAfterUpdate = 0;
  for (const user of allUsers) {
    const id = toIdString(user._id);
    const email = clean(user.email).toLowerCase();
    const explicitRole = id === userId ? nextRole : roleByUserId.get(id);
    if (resolveRole(explicitRole, email) === 'admin') {
      adminCountAfterUpdate += 1;
    }
  }

  if (adminCountAfterUpdate === 0) {
    return NextResponse.json(
      {
        error: 'At least one admin must remain. Promote another user before removing admin access.'
      },
      { status: 400 }
    );
  }

  await setUserRole(userId, nextRole, admin.actorUserId);

  return NextResponse.json({
    ok: true,
    user: {
      id: userId,
      role: resolveRole(nextRole, clean(targetUser.email).toLowerCase())
    }
  });
}

export async function POST(request: Request) {
  const admin = await getAdminContext(request);
  if (!admin.ok) {
    return admin.response;
  }

  const body = await request.json().catch(() => ({}));
  const action = clean(body?.action);
  const userId = clean(body?.userId);
  if (action !== 'send-password-reset') {
    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  }
  if (!userId) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const targetUser = (await db.collection<UserDoc>('user').findOne(buildActiveUserLookupFilter(userId), {
    projection: { _id: 1, email: 1, name: 1 }
  })) as UserDoc | null;
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const email = clean(targetUser.email).toLowerCase();
  if (!email) {
    return NextResponse.json({ error: 'User email is required before sending a password reset.' }, { status: 400 });
  }

  try {
    const authOrigin = resolveConfiguredAuthOrigin(request.url);
    if (!authOrigin) {
      throw new Error('Unable to resolve auth origin');
    }

    const response = await fetch(new URL('/api/auth/forget-password/email-otp', authOrigin), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`auth reset endpoint failed with ${response.status}${detail ? `: ${detail}` : ''}`);
    }
  } catch (error) {
    console.error('[admin-users] password reset send failed', error);
    return NextResponse.json({ error: 'Could not send password reset email.' }, { status: 500 });
  }

  await logAudit({
    action: 'user.password-reset.sent',
    actorUserId: admin.actorUserId,
    targetUserId: userId,
    metadata: { email }
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const admin = await getAdminContext(request);
  if (!admin.ok) {
    return admin.response;
  }

  const body = await request.json().catch(() => ({}));
  const userId = clean(body?.userId);
  if (!userId) {
    return NextResponse.json({ error: 'User id is required' }, { status: 400 });
  }
  if (userId === clean(admin.actorUserId)) {
    return NextResponse.json({ error: 'You cannot remove your own access from this screen.' }, { status: 400 });
  }

  const conn = await connectDB();
  const db = conn?.connection?.db;
  if (!db) {
    return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });
  }

  const targetUser = (await db.collection<UserDoc>('user').findOne(buildActiveUserLookupFilter(userId), {
    projection: { _id: 1, email: 1, name: 1 }
  })) as UserDoc | null;
  if (!targetUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const allUsers = (await db
    .collection<UserDoc>('user')
    .find(ACTIVE_USER_FILTER, { projection: { _id: 1, email: 1 } })
    .toArray()) as UserDoc[];
  const allUserIds = allUsers.map((doc) => toIdString(doc._id)).filter(Boolean);
  const roleDocs = (await UserRole.find({ userId: { $in: allUserIds } }, { userId: 1, role: 1 }).lean()) as Array<{
    userId?: string;
    role?: string;
  }>;

  const roleByUserId = new Map<string, string>();
  for (const row of roleDocs) {
    const id = clean(row.userId);
    if (!id) continue;
    roleByUserId.set(id, clean(row.role));
  }

  let adminCountAfterRemoval = 0;
  for (const user of allUsers) {
    const id = toIdString(user._id);
    if (!id || id === userId) continue;
    const email = clean(user.email).toLowerCase();
    const explicitRole = roleByUserId.get(id);
    if (resolveRole(explicitRole, email) === 'admin') {
      adminCountAfterRemoval += 1;
    }
  }

  if (adminCountAfterRemoval === 0) {
    return NextResponse.json(
      {
        error: 'At least one admin must remain. Promote another user before removing this account.'
      },
      { status: 400 }
    );
  }

  const removal = await revokeUserAccess({
    userId,
    actorUserId: admin.actorUserId,
    reason: 'Removed by admin from user management'
  });

  await logAudit({
    action: 'user.access-removed',
    actorUserId: admin.actorUserId,
    targetUserId: userId,
    metadata: {
      preservedContent: removal.preservedContent
    }
  });

  return NextResponse.json({
    ok: true,
    removedAt: removal.removedAt,
    preservedContent: removal.preservedContent
  });
}
