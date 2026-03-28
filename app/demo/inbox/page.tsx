import type { Metadata } from "next"
import { DemoInboxPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Inbox Demo | Velvet Dinosaur",
  description: "Explore a sandboxed Sauro CMS inbox with fictional leads, local reply drafting, and safe demo-only actions."
}

export default function DemoInboxRoute() {
  return <DemoInboxPage variant="path" />
}
