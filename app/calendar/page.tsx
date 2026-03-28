import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoCalendarPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/calendar")

export const metadata: Metadata = {
  title: "Calendar Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS calendar with fictional events, local edits, and disposable demo-only actions.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Calendar Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS calendar with fictional events, local edits, and disposable demo-only actions.",
    url: canonical
  },
  twitter: {
    title: "Calendar Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS calendar with fictional events, local edits, and disposable demo-only actions."
  }
}

export default function CalendarDemoPage() {
  return (
    <Suspense fallback={null}>
      <CalendarDemoPageContent />
    </Suspense>
  )
}

async function CalendarDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/calendar"))
  }

  return <DemoCalendarPage variant="host" />
}
