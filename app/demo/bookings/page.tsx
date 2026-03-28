import type { Metadata } from "next"
import { Suspense } from "react"
import { connection } from "next/server"
import { DemoBookingsPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Booking API Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS booking board with fictional inventory sync, availability, and booking pipeline data."
}

export default function DemoBookingsRoute() {
  return (
    <Suspense fallback={null}>
      <DemoBookingsRouteContent />
    </Suspense>
  )
}

async function DemoBookingsRouteContent() {
  await connection()
  return <DemoBookingsPage variant="path" />
}
