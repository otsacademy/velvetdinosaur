import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoInboxPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/inbox")

export const metadata: Metadata = {
  title: "Inbox Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS inbox with fictional leads, local reply drafting, and safe demo-only actions.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Inbox Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS inbox with fictional leads, local reply drafting, and safe demo-only actions.",
    url: canonical
  },
  twitter: {
    title: "Inbox Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS inbox with fictional leads, local reply drafting, and safe demo-only actions."
  }
}

export default function InboxDemoPage() {
  return (
    <Suspense fallback={null}>
      <InboxDemoPageContent />
    </Suspense>
  )
}

async function InboxDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/inbox"))
  }

  return <DemoInboxPage variant="host" />
}
