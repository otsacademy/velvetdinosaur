import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { DemoCalendarPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Calendar Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS calendar with fictional events, local edits, and disposable demo-only actions."
}

export default function DemoCalendarRoute() {
  return (
    <Suspense fallback={null}>
      <DemoCalendarRouteContent />
    </Suspense>
  )
}

async function DemoCalendarRouteContent() {
  await connection()
  return <DemoCalendarPage variant="path" />
}
