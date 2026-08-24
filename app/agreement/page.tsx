import type { Metadata } from "next"

import { siteName } from "@/lib/site-metadata"
import { AgreementDoc } from "./agreement-doc.client"

import "./agreement-doc.css"

const agreementDescription =
  "The plain-English Velvet Dinosaur managed website service agreement: £99 a month, everything included, 14-day free demo, 30-day money-back guarantee, and your content always yours."

export const metadata: Metadata = {
  title: "Service Agreement",
  description: agreementDescription,
  alternates: { canonical: "/agreement" },
  openGraph: {
    type: "website",
    url: "/agreement",
    siteName,
    title: `Service Agreement | ${siteName}`,
    description: agreementDescription,
  },
}

export default function AgreementPage() {
  return <AgreementDoc />
}
