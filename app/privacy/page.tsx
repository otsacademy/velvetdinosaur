import type { Metadata } from "next"

import { LegalPage } from "@/components/home/legal-page"
import { PRIVACY_PAGE } from "@/lib/legal-pages-content"
import { siteName } from "@/lib/site-metadata"

const description =
  "How Velvet Dinosaur collects, uses and protects your personal information — the plain-English privacy notice."

export const metadata: Metadata = {
  title: "Privacy Notice",
  description,
  alternates: { canonical: "/privacy" },
  openGraph: {
    type: "website",
    url: "/privacy",
    siteName,
    title: `Privacy Notice | ${siteName}`,
    description,
  },
}

export default function PrivacyPage() {
  return <LegalPage content={PRIVACY_PAGE} />
}
