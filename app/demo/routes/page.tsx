import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { DemoRoutesPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Routes Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS routes planner with fictional itineraries, linked stays, and disposable demo-only edits."
}

export default function DemoRoutesRoute() {
  return (
    <Suspense fallback={null}>
      <DemoRoutesRouteContent />
    </Suspense>
  )
}

async function DemoRoutesRouteContent() {
  await connection()
  return <DemoRoutesPage variant="path" />
}
