import type { Metadata } from "next"

import { LegalPage } from "@/components/home/legal-page"
import { TERMS_PAGE } from "@/lib/legal-pages-content"
import { siteName } from "@/lib/site-metadata"

const description =
  "The plain-English Velvet Dinosaur terms of service for website and digital services."

export const metadata: Metadata = {
  title: "Terms of Service",
  description,
  alternates: { canonical: "/terms" },
  openGraph: {
    type: "website",
    url: "/terms",
    siteName,
    title: `Terms of Service | ${siteName}`,
    description,
  },
}

export default function TermsPage() {
  return <LegalPage content={TERMS_PAGE} />
}
