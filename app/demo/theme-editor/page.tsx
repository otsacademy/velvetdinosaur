import type { Metadata } from "next"
import { DemoThemeEditorPage } from "@/components/demo/demo-pages"

export const metadata: Metadata = {
  title: "Theme Editor Demo | Velvet Dinosaur",
  description: "Explore the Sauro CMS theme editor with live OKLCH token controls."
}

export default function DemoThemeEditorRoute() {
  return <DemoThemeEditorPage variant="path" />
}
