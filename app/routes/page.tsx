import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoRoutesPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/routes")

export const metadata: Metadata = {
  title: "Routes Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS routes planner with fictional itineraries, linked stays, and disposable demo-only edits.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Routes Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS routes planner with fictional itineraries, linked stays, and disposable demo-only edits.",
    url: canonical
  },
  twitter: {
    title: "Routes Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS routes planner with fictional itineraries, linked stays, and disposable demo-only edits."
  }
}

export default function RoutesDemoPage() {
  return (
    <Suspense fallback={null}>
      <RoutesDemoPageContent />
    </Suspense>
  )
}

async function RoutesDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/routes"))
  }

  return <DemoRoutesPage variant="host" />
}
