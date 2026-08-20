import { type Filter, ObjectId } from 'mongodb'
import { assertServerOnly } from '@/lib/_server/guard'
import { connectDB } from '@/lib/db'

assertServerOnly('lib/user-account-access.ts')

export const USER_ACCESS_REMOVED_MESSAGE =
  'This account has been removed and can no longer access the website. Please contact an administrator.'

type UserAccessDoc = {
  _id?: ObjectId | string
  accessRemovedAt?: Date | string | null
}

type SessionDoc = {
  userId?: ObjectId | string | null
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function toObjectId(value: string) {
  try {
    return new ObjectId(value)
  } catch {
    return null
  }
}

function buildUserLookupFilter(userId: string): Filter<UserAccessDoc> {
  const normalizedUserId = clean(userId)
  const asObjectId = toObjectId(normalizedUserId)
  if (!asObjectId) {
    return { _id: normalizedUserId }
  }
  return {
    $or: [{ _id: normalizedUserId }, { _id: asObjectId }],
  }
}

function buildSessionLookupFilter(userId: string): Filter<SessionDoc> {
  const normalizedUserId = clean(userId)
  const asObjectId = toObjectId(normalizedUserId)
  if (!asObjectId) {
    return { userId: normalizedUserId }
  }
  return {
    $or: [{ userId: normalizedUserId }, { userId: asObjectId }],
  }
}

export function isUserAccessRemoved(user: UserAccessDoc | null | undefined) {
  const raw = user?.accessRemovedAt
  if (!raw) return false
  const parsed = raw instanceof Date ? raw : new Date(raw)
  return !Number.isNaN(parsed.getTime())
}

export async function findUserAccessState(userId: string) {
  const normalizedUserId = clean(userId)
  if (!normalizedUserId) return null

  const conn = await connectDB()
  const db = conn?.connection?.db
  if (!db) return null

  return db.collection<UserAccessDoc>('user').findOne(buildUserLookupFilter(normalizedUserId), {
    projection: { accessRemovedAt: 1 },
  })
}

export async function revokeUserAccess(input: {
  userId: string
  actorUserId?: string | null
  reason?: string | null
}) {
  const normalizedUserId = clean(input.userId)
  if (!normalizedUserId) {
    throw new Error('User id is required')
  }

  const conn = await connectDB()
  const db = conn?.connection?.db
  if (!db) {
    throw new Error('Database unavailable')
  }

  const removedAt = new Date()
  const accessRemovalReason = clean(input.reason) || 'Removed by admin'

  const [newsArticles, pages, events] = await Promise.all([
    db.collection('newsarticles').countDocuments({ authorUserId: normalizedUserId }),
    db.collection('pages').countDocuments({ createdByUserId: normalizedUserId }),
    db.collection('events').countDocuments({ createdByUserId: normalizedUserId }),
  ])

  await db.collection<UserAccessDoc>('user').updateOne(buildUserLookupFilter(normalizedUserId), {
    $set: {
      accessRemovedAt: removedAt,
      accessRemovedByUserId: clean(input.actorUserId) || null,
      accessRemovalReason,
    },
  })

  await db.collection<SessionDoc>('session').deleteMany(buildSessionLookupFilter(normalizedUserId))

  return {
    removedAt: removedAt.toISOString(),
    preservedContent: {
      newsArticles,
      pages,
      events,
    },
  }
}
