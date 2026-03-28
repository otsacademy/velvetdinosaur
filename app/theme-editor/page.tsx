import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoThemeEditorPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/theme-editor")

export const metadata: Metadata = {
  title: "Theme Editor Demo | Velvet Dinosaur",
  description: "Explore the Sauro CMS theme editor with live OKLCH token controls.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Theme Editor Demo | Velvet Dinosaur",
    description: "Explore the Sauro CMS theme editor with live OKLCH token controls.",
    url: canonical
  },
  twitter: {
    title: "Theme Editor Demo | Velvet Dinosaur",
    description: "Explore the Sauro CMS theme editor with live OKLCH token controls."
  }
}

export default function ThemeEditorDemoPage() {
  return (
    <Suspense fallback={null}>
      <ThemeEditorDemoPageContent />
    </Suspense>
  )
}

async function ThemeEditorDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/theme-editor"))
  }

  return <DemoThemeEditorPage variant="host" />
}
