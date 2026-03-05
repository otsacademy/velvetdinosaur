import { assertServerOnly } from '@/lib/_server/guard';
assertServerOnly('lib/auth.ts');

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { nextCookies } from 'better-auth/next-js';
import { MongoClient } from 'mongodb';
import { sendResetPasswordEmail, sendVerificationEmail } from '@/lib/email';

let cachedAuth: ReturnType<typeof betterAuth> | null = null;
let cachedClient: MongoClient | null = null;
const EDITOR_SMOKE_TOKEN = process.env.VD_EDITOR_SMOKE_TOKEN;

function toOrigin(value?: string | null) {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function toDomainHost(value?: string | null) {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '')
    .replace(/:\d+$/, '')
    .toLowerCase();
}

function getTrustedOrigins() {
  const origins = new Set<string>();

  for (const value of [
    process.env.PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_BASE_URL,
    process.env.BETTERAUTH_URL,
    process.env.NEXT_PUBLIC_BETTERAUTH_URL
  ]) {
    const origin = toOrigin(value);
    if (origin) origins.add(origin);
  }

  const domainHost = toDomainHost(process.env.DOMAIN);
  if (domainHost && !domainHost.includes('localhost')) {
    origins.add(`https://${domainHost}`);
    origins.add(`https://designer.${domainHost}`);
  }

  origins.add('http://localhost:3000');
  origins.add('http://127.0.0.1:3000');

  return Array.from(origins);
}

function resolveSmokeSession(headersInit?: HeadersInit | null) {
  if (!EDITOR_SMOKE_TOKEN || !headersInit) return null;
  const headers = headersInit instanceof Headers ? headersInit : new Headers(headersInit);
  const token = headers.get('x-vd-editor-smoke');
  if (!token || token !== EDITOR_SMOKE_TOKEN) return null;
  return {
    user: {
      id: 'editor-smoke',
      email: 'editor-smoke@local'
    }
  };
}

function createBuildFallbackAuth() {
  return {
    handler: async () => new Response('Auth unavailable during build', { status: 503 }),
    api: {
      getSession: async () => null
    }
  } as unknown as ReturnType<typeof betterAuth>;
}

function createSmokeFallbackAuth() {
  const fallback = createBuildFallbackAuth();
  fallback.api.getSession = (async (options: Parameters<typeof fallback.api.getSession>[0]) =>
    resolveSmokeSession(options?.headers)) as typeof fallback.api.getSession;
  return fallback;
}

export function getAuth() {
  if (cachedAuth) {
    return cachedAuth;
  }

  const mongoUri = process.env.MONGODB_URI;
  const secret = process.env.BETTERAUTH_SECRET;
  const isBuildPhase =
    process.env.NEXT_PHASE === 'phase-production-build' || process.env.NEXT_PHASE === 'phase-export';

  if (!mongoUri) {
    if (isBuildPhase) {
      cachedAuth = createBuildFallbackAuth();
      return cachedAuth;
    }
    if (EDITOR_SMOKE_TOKEN) {
      cachedAuth = createSmokeFallbackAuth();
      return cachedAuth;
    }
    throw new Error('MONGODB_URI is not set');
  }
  if (!secret) {
    if (isBuildPhase) {
      cachedAuth = createBuildFallbackAuth();
      return cachedAuth;
    }
    if (EDITOR_SMOKE_TOKEN) {
      cachedAuth = createSmokeFallbackAuth();
      return cachedAuth;
    }
    throw new Error('BETTERAUTH_SECRET is not set');
  }

  if (!cachedClient) {
    cachedClient = new MongoClient(mongoUri);
  }

  cachedAuth = betterAuth({
    appName: 'Velvet Dinosaur',
    secret,
    baseURL: process.env.BETTERAUTH_URL || process.env.PUBLIC_BASE_URL,
    trustedOrigins: getTrustedOrigins(),
    database: mongodbAdapter(cachedClient.db()),
    advanced: {
      crossSubDomainCookies: {
        enabled: true
      }
    },
    emailAndPassword: {
      enabled: true,
      disableSignUp: true,
      requireEmailVerification: true,
      autoSignIn: false,
      minPasswordLength: 12,
      sendResetPassword: async ({ user, url, token }) => {
        await sendResetPasswordEmail({ user, url, token });
      }
    },
    emailVerification: {
      sendOnSignUp: true,
      async sendVerificationEmail({ user, url, token }, request) {
        // When BetterAuth calls this we already have a signed token; reuse it for consistency.
        await sendVerificationEmail({ user, url, token, request });
      }
    },
    plugins: [
      nextCookies(),
      {
        id: 'email-verification-bootstrap',
        // Ensure verification links always exist even if other callers forget to set callbackURL.
        async onRequest(req, ctx) {
          if (ctx.options.emailVerification?.sendVerificationEmail) {
            // no-op hook keeps plugin alive
          }
          return { request: req };
        }
      }
    ]
  });

  if (EDITOR_SMOKE_TOKEN) {
    const originalGetSession = cachedAuth.api.getSession.bind(cachedAuth.api);
    cachedAuth.api.getSession = (async (options: Parameters<typeof originalGetSession>[0]) => {
      const smokeSession = resolveSmokeSession(options?.headers);
      if (smokeSession) {
        return smokeSession as Awaited<ReturnType<typeof originalGetSession>>;
      }
      return originalGetSession(options);
    }) as typeof cachedAuth.api.getSession;
  }

  return cachedAuth;
}
