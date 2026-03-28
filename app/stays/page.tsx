import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoStaysPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/stays")

export const metadata: Metadata = {
  title: "Stays Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS stays manager with fictional properties, linked routes, disposable uploads, and demo-only edits.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Stays Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS stays manager with fictional properties, linked routes, disposable uploads, and demo-only edits.",
    url: canonical
  },
  twitter: {
    title: "Stays Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS stays manager with fictional properties, linked routes, disposable uploads, and demo-only edits."
  }
}

export default function StaysDemoPage() {
  return (
    <Suspense fallback={null}>
      <StaysDemoPageContent />
    </Suspense>
  )
}

async function StaysDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/stays"))
  }

  return <DemoStaysPage variant="host" />
}
