import type { Metadata } from "next"

import { HomeFooter, HomeHeader } from "@/components/home/home-chrome"
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

// The document keeps its own chrome (sidebar, palette, progress bar), but sits
// inside the site header/footer so readers can get back to the main site.
// Both are hidden when printing — see agreement-doc.css.
export default function AgreementPage() {
  return (
    <div className="vd-agreement-shell vd-home relative min-h-dvh bg-background text-foreground [font-family:var(--font-archivo,var(--vd-font-sans))]">
      {/* direct child so `sticky` resolves against the full-height shell */}
      <HomeHeader />
      <main>
        <AgreementDoc />
      </main>
      {/* offset clears the fixed clause sidebar on large screens */}
      <div data-site-footer className="lg:ml-[298px]">
        <HomeFooter />
      </div>
    </div>
  )
}
