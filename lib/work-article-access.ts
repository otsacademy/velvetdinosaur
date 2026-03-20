import { assertServerOnly } from '@/lib/_server/guard'
assertServerOnly('lib/work-article-access.ts')

import { NextResponse } from 'next/server'

import { getAuth } from '@/lib/auth'
import { getUserRole } from '@/lib/roles'
import { isEditorSmokeRequest } from '@/lib/security/editor-smoke'

type SessionLike = {
  user?: {
    id?: string
    email?: unknown
    roles?: unknown
  }
  roles?: unknown
}

type AllowedAccess = {
  ok: true
  userId: string | null
}

type DeniedAccess = {
  ok: false
  response: NextResponse
}

function readRoles(session: unknown) {
  const typed = (session || {}) as SessionLike
  const topLevelRoles = Array.isArray(typed.roles) ? typed.roles : []
  const userRoles = Array.isArray(typed.user?.roles) ? typed.user.roles : []
  const merged = [...topLevelRoles, ...userRoles]

  return merged
    .map((role) => (typeof role === 'string' ? role.trim().toLowerCase() : ''))
    .filter(Boolean)
}

export async function requireWorkArticleWriteAccess(request: Request): Promise<AllowedAccess | DeniedAccess> {
  const auth = getAuth()
  const session = await auth.api.getSession({ headers: request.headers })

  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const user = (session as SessionLike).user
  const userId = (user?.id || null) as string | null
  if (isEditorSmokeRequest(request.headers)) {
    return {
      ok: true,
      userId,
    }
  }
  const userEmail = typeof user?.email === 'string' ? user.email : null
  const roles = readRoles(session)
  const hasSessionAccess = roles.includes('admin') || roles.includes('editor') || roles.includes('user')
  const role = await getUserRole(userId, userEmail)
  const hasRoleAccess = role === 'admin' || role === 'user'

  if (!hasSessionAccess && !hasRoleAccess) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    }
  }

  return {
    ok: true,
    userId,
  }
}
