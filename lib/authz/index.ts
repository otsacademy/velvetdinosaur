import { NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { requireInstallerAdmin as requireInstallerAdminGate } from '@/lib/admin';
import { getUserRole, type RoleResult } from '@/lib/roles';
import { requireThemeEditorToken } from '@/lib/theme-editor-auth';

export type AuthRole = 'user' | 'admin';

export type Capability =
  | 'public'
  | 'session'
  | 'role:user'
  | 'role:admin'
  | 'installer:admin'
  | 'theme:user'
  | 'theme:admin';

type CapabilityChecks = {
  requireSession?: boolean;
  requiredRole?: AuthRole;
  installerAdmin?: boolean;
  allowThemeBearer?: boolean;
};

export const CAPABILITY_REQUIREMENTS: Record<Capability, CapabilityChecks> = {
  public: {},
  session: { requireSession: true },
  'role:user': { requireSession: true, requiredRole: 'user' },
  'role:admin': { requireSession: true, requiredRole: 'admin' },
  'installer:admin': { installerAdmin: true },
  'theme:user': { allowThemeBearer: true, requiredRole: 'user' },
  'theme:admin': { allowThemeBearer: true, requiredRole: 'admin' }
};

type SessionRecord = {
  user?: {
    id?: string;
    email?: string;
  };
} | null;

export type SessionGuard = {
  session: SessionRecord;
  user: {
    id: string | null;
    email: string | null;
  };
};

export type RoleGuard = SessionGuard & {
  role: RoleResult;
};

export type AuthzActor = {
  mode: 'public' | 'session' | 'installer' | 'bearer';
  userId: string | null;
  email: string | null;
  role: RoleResult;
  session: SessionRecord;
  themeToken?: {
    siteOrigin: string;
    userId: string;
    role: string;
  };
};

export type AuthorizeContext = {
  sessionGuard?: SessionGuard;
  roleGuard?: RoleGuard;
  installerActor?: AuthzActor;
  themeActor?: AuthzActor;
};

type AuthorizeSuccess = {
  ok: true;
  actor: AuthzActor | null;
};

type AuthorizeFailure = {
  ok: false;
  response: NextResponse;
};

export type AuthorizeResult = AuthorizeSuccess | AuthorizeFailure;

class AuthzHttpError extends Error {
  response: NextResponse;

  constructor(response: NextResponse) {
    super('Authorization failed');
    this.name = 'AuthzHttpError';
    this.response = response;
  }
}

function authzJson(status: number, error: string) {
  return NextResponse.json(
    { error },
    {
      status,
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}

function throwUnauthorized(message = 'Unauthorized'): never {
  throw new AuthzHttpError(authzJson(401, message));
}

function throwForbidden(message = 'Forbidden'): never {
  throw new AuthzHttpError(authzJson(403, message));
}

function asAuthzFailure(error: unknown): AuthorizeFailure | null {
  if (error instanceof AuthzHttpError) {
    return { ok: false, response: error.response };
  }
  return null;
}

function allowsRole(role: RoleResult, requiredRole: AuthRole) {
  if (requiredRole === 'admin') {
    return role === 'admin';
  }
  return role === 'admin' || role === 'user';
}

function hasBearerAuthorization(request: Request) {
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!authHeader) return false;
  return /^Bearer\s+/i.test(authHeader.trim());
}

export async function requireSession(request: Request, ctx: AuthorizeContext = {}): Promise<SessionGuard> {
  if (ctx.sessionGuard) return ctx.sessionGuard;

  const auth = getAuth();
  const session = (await auth.api.getSession({ headers: request.headers })) as SessionRecord;
  if (!session) {
    throwUnauthorized();
  }

  const user = {
    id: session.user?.id ?? null,
    email: session.user?.email ?? null
  };

  const guard = { session, user };
  ctx.sessionGuard = guard;
  return guard;
}

export async function requireRole(
  request: Request,
  requiredRole: AuthRole,
  ctx: AuthorizeContext = {}
): Promise<RoleGuard> {
  if (ctx.roleGuard && allowsRole(ctx.roleGuard.role, requiredRole)) {
    return ctx.roleGuard;
  }

  const sessionGuard = await requireSession(request, ctx);
  const role = await getUserRole(sessionGuard.user.id);

  if (!allowsRole(role, requiredRole)) {
    throwForbidden();
  }

  const guard: RoleGuard = {
    ...sessionGuard,
    role
  };
  ctx.roleGuard = guard;
  return guard;
}

export async function requireInstallerAdmin(
  request: Request,
  ctx: AuthorizeContext = {}
): Promise<AuthzActor> {
  if (ctx.installerActor) return ctx.installerActor;

  const gate = await requireInstallerAdminGate(request.headers);
  if (!gate.ok) {
    if (gate.status === 401) throwUnauthorized();
    throwForbidden();
  }

  const session = (gate.session || null) as SessionRecord;
  const actor: AuthzActor = {
    mode: 'installer',
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    role: 'admin',
    session
  };

  ctx.installerActor = actor;
  return actor;
}

async function requireThemeActor(
  request: Request,
  requiredRole: AuthRole,
  ctx: AuthorizeContext = {}
): Promise<AuthzActor> {
  if (ctx.themeActor && allowsRole(ctx.themeActor.role, requiredRole)) {
    return ctx.themeActor;
  }

  if (hasBearerAuthorization(request)) {
    const gate = await requireThemeEditorToken(request);
    if (!gate.ok) {
      throw new AuthzHttpError(gate.response);
    }

    const tokenRole = String(gate.payload.role || '').toLowerCase();
    if (tokenRole !== 'admin' && tokenRole !== 'user') {
      throwForbidden();
    }

    if (!allowsRole(tokenRole as RoleResult, requiredRole)) {
      throwForbidden();
    }

    const actor: AuthzActor = {
      mode: 'bearer',
      userId: gate.payload.userId,
      email: null,
      role: tokenRole as RoleResult,
      session: null,
      themeToken: {
        siteOrigin: gate.payload.siteOrigin,
        userId: gate.payload.userId,
        role: tokenRole
      }
    };

    ctx.themeActor = actor;
    return actor;
  }

  const roleGuard = await requireRole(request, requiredRole, ctx);
  const actor: AuthzActor = {
    mode: 'session',
    userId: roleGuard.user.id,
    email: roleGuard.user.email,
    role: roleGuard.role,
    session: roleGuard.session
  };

  ctx.themeActor = actor;
  return actor;
}

export async function authorize(
  request: Request,
  capability: Capability,
  ctx: AuthorizeContext = {}
): Promise<AuthorizeResult> {
  try {
    const checks = CAPABILITY_REQUIREMENTS[capability];

    if (checks.installerAdmin) {
      const actor = await requireInstallerAdmin(request, ctx);
      return { ok: true, actor };
    }

    if (checks.allowThemeBearer) {
      const actor = await requireThemeActor(request, checks.requiredRole || 'user', ctx);
      return { ok: true, actor };
    }

    if (checks.requiredRole) {
      const guard = await requireRole(request, checks.requiredRole, ctx);
      const actor: AuthzActor = {
        mode: 'session',
        userId: guard.user.id,
        email: guard.user.email,
        role: guard.role,
        session: guard.session
      };
      return { ok: true, actor };
    }

    if (checks.requireSession) {
      const guard = await requireSession(request, ctx);
      const actor: AuthzActor = {
        mode: 'session',
        userId: guard.user.id,
        email: guard.user.email,
        role: 'none',
        session: guard.session
      };
      return { ok: true, actor };
    }

    return { ok: true, actor: null };
  } catch (error) {
    const failure = asAuthzFailure(error);
    if (failure) return failure;
    throw error;
  }
}
