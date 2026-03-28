import type { Metadata } from "next"
import { Suspense } from "react"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { connection } from "next/server"
import { DemoBookingsPage } from "@/components/demo/demo-pages"
import { isDemoRequest, resolveDemoSiteUrl } from "@/lib/demo-site"

const canonical = resolveDemoSiteUrl("/bookings")

export const metadata: Metadata = {
  title: "Booking API Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS booking board with fictional inventory sync, availability, and booking pipeline data.",
  alternates: {
    canonical
  },
  openGraph: {
    title: "Booking API Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS booking board with fictional inventory sync, availability, and booking pipeline data.",
    url: canonical
  },
  twitter: {
    title: "Booking API Demo | Velvet Dinosaur",
    description: "Explore a sandboxed Sauro CMS booking board with fictional inventory sync, availability, and booking pipeline data."
  }
}

export default function BookingsDemoPage() {
  return (
    <Suspense fallback={null}>
      <BookingsDemoPageContent />
    </Suspense>
  )
}

async function BookingsDemoPageContent() {
  await connection()
  const requestHeaders = await headers()
  if (!isDemoRequest(requestHeaders)) {
    redirect(resolveDemoSiteUrl("/bookings"))
  }

  return <DemoBookingsPage variant="host" />
}
