import { unstable_noStore } from "next/cache"
import { NextResponse } from "next/server"
import { DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, getDemoSessionCookieOptions } from "@/lib/demo-session"

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0"
}

export async function POST() {
  unstable_noStore()

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
  response.cookies.set(DEMO_SESSION_COOKIE, DEMO_SESSION_VALUE, getDemoSessionCookieOptions())
  return response
}

export async function DELETE() {
  unstable_noStore()

  const response = NextResponse.json({ ok: true }, { headers: NO_STORE_HEADERS })
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    ...getDemoSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0
  })
  return response
}
