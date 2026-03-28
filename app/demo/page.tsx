import type { Metadata } from "next"
import { DemoHomePage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Sauro CMS Demo | Velvet Dinosaur",
  description: "Interactive Sauro CMS sandbox with dummy data and non-persistent changes."
}

export default function DemoPage() {
  return <DemoHomePage variant="path" />
}
