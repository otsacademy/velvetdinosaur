import { redirect } from "next/navigation"

export default function LegacyDemoContentRedirect() {
  redirect("/demo/new")
}
