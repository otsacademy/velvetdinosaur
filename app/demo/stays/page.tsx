import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { DemoStaysPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Stays Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS stays manager with fictional properties, linked routes, disposable uploads, and demo-only edits."
}

export default function DemoStaysRoute() {
  return (
    <Suspense fallback={null}>
      <DemoStaysRouteContent />
    </Suspense>
  )
}

async function DemoStaysRouteContent() {
  await connection()
  return <DemoStaysPage variant="path" />
}
