import type { Metadata } from "next"
import { Suspense } from "react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoLoginWorkspacePage } from "@/components/demo/demo-pages"
import { hasDemoSession } from "@/lib/demo-session"
import {
  getDemoDefaultWorkspacePath,
  getDemoRoutePath,
  isDemoRequest,
  resolveDemoLoginUrl
} from "@/lib/demo-site"

type DemoLoginSearchParams = {
  next?: string
}

export const metadata: Metadata = {
  title: "Demo Login | Velvet Dinosaur",
  description: "Enter the Sauro CMS demo workspace with a disposable session.",
  robots: {
    index: false,
    follow: false
  }
}

export default function LoginRoute({
  searchParams
}: {
  searchParams?: Promise<DemoLoginSearchParams> | DemoLoginSearchParams
}) {
  return (
    <Suspense fallback={null}>
      <LoginRouteContent searchParams={searchParams} />
    </Suspense>
  )
}

async function LoginRouteContent({
  searchParams
}: {
  searchParams?: Promise<DemoLoginSearchParams> | DemoLoginSearchParams
}) {
  await connection()

  const resolvedSearchParams = await Promise.resolve(searchParams)
  const nextPath = getDemoRoutePath(resolvedSearchParams?.next || getDemoDefaultWorkspacePath("host"), "host")
  const requestHeaders = await headers()

  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoLoginUrl(nextPath))
  }

  const cookieStore = await cookies()
  if (hasDemoSession(cookieStore)) {
    redirect(nextPath)
  }

  return <DemoLoginWorkspacePage nextPath={nextPath} variant="host" />
}
