export const DEMO_SESSION_COOKIE = "vd_demo_session"
export const DEMO_SESSION_VALUE = "active"

type CookieReader = {
  get(name: string): { value?: string } | undefined
}

export function hasDemoSession(cookieStore: CookieReader) {
  return cookieStore.get(DEMO_SESSION_COOKIE)?.value === DEMO_SESSION_VALUE
}

export function getDemoSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/"
  }
}
