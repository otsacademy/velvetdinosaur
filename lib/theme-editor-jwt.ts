import { jwtVerify, SignJWT } from 'jose';

export type ThemeEditorJwtPayload = {
  siteOrigin: string;
  userId: string;
  role: string;
  aud: 'theme-editor';
  iss: 'velvet-dinosaur';
  iat: number;
  exp: number;
};

const THEME_EDITOR_AUD = 'theme-editor' as const;
const THEME_EDITOR_ISS = 'velvet-dinosaur' as const;

function getJwtSecretKey() {
  const secret = process.env.THEME_EDITOR_JWT_SECRET;
  if (!secret) {
    throw new Error('THEME_EDITOR_JWT_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, '');
}

export function buildThemeEditorPayload(input: {
  siteOrigin: string;
  userId: string;
  role: string;
  expiresInSeconds?: number;
}): ThemeEditorJwtPayload {
  const issuedAtSeconds = Math.floor(Date.now() / 1000);
  const expiresInSeconds = input.expiresInSeconds ?? 60 * 10;

  return {
    siteOrigin: normalizeOrigin(input.siteOrigin),
    userId: input.userId,
    role: input.role,
    aud: THEME_EDITOR_AUD,
    iss: THEME_EDITOR_ISS,
    iat: issuedAtSeconds,
    exp: issuedAtSeconds + expiresInSeconds
  };
}

export function getRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedProto = request.headers.get('x-forwarded-proto');
  const forwardedHost = request.headers.get('x-forwarded-host');
  const host = forwardedHost ?? request.headers.get('host') ?? url.host;
  const proto = forwardedProto ?? url.protocol.replace(':', '');
  return normalizeOrigin(`${proto}://${host}`);
}

export async function signThemeEditorJwt(input: {
  siteOrigin: string;
  userId: string;
  role: string;
  expiresInSeconds?: number;
}) {
  const payload = buildThemeEditorPayload(input);

  return new SignJWT({
    siteOrigin: payload.siteOrigin,
    userId: payload.userId,
    role: payload.role
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(payload.iat)
    .setExpirationTime(payload.exp)
    .setAudience(THEME_EDITOR_AUD)
    .setIssuer(THEME_EDITOR_ISS)
    .sign(getJwtSecretKey());
}

export async function verifyThemeEditorJwt(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecretKey(), {
    audience: THEME_EDITOR_AUD,
    issuer: THEME_EDITOR_ISS
  });

  const siteOrigin = typeof payload.siteOrigin === 'string' ? payload.siteOrigin : null;
  const userId = typeof payload.userId === 'string' ? payload.userId : null;
  const role = typeof payload.role === 'string' ? payload.role : null;
  const aud = payload.aud;
  const iss = payload.iss;
  const iat = typeof payload.iat === 'number' ? payload.iat : null;
  const exp = typeof payload.exp === 'number' ? payload.exp : null;

  if (!siteOrigin || !userId || !role || !iat || !exp) {
    throw new Error('Invalid token payload');
  }
  if (iss !== THEME_EDITOR_ISS) {
    throw new Error('Invalid token issuer');
  }
  if (typeof aud === 'string' ? aud !== THEME_EDITOR_AUD : Array.isArray(aud) ? !aud.includes(THEME_EDITOR_AUD) : true) {
    throw new Error('Invalid token audience');
  }

  return {
    siteOrigin: normalizeOrigin(siteOrigin),
    userId,
    role,
    aud: THEME_EDITOR_AUD,
    iss: THEME_EDITOR_ISS,
    iat,
    exp
  } satisfies ThemeEditorJwtPayload;
}
