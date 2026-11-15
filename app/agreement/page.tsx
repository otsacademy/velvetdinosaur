import type { Metadata } from "next"

import { LETTER_SCOPE } from "@/components/home/design-shell"
import { HomeFooter, HomeHeader } from "@/components/home/home-chrome"
import { siteName } from "@/lib/site-metadata"
import { AgreementDoc } from "./agreement-doc.client"

import "./agreement-doc.css"

const agreementTitle = `Service Agreement | ${siteName}`
const agreementDescription =
  "The plain-English Velvet Dinosaur managed website service agreement: £99 a month, everything included, 14-day free demo, 30-day money-back guarantee, and your content always yours."

export const metadata: Metadata = {
  title: agreementTitle,
  description: agreementDescription,
  alternates: { canonical: "/agreement" },
  openGraph: {
    type: "website",
    url: "/agreement",
    siteName,
    title: agreementTitle,
    description: agreementDescription,
  },
}

// The document keeps its own chrome (sidebar, palette, progress bar) and its
// own type, so only the site header and footer take the Letter scope here.
// Both are hidden when printing — see agreement-doc.css.
export default function AgreementPage() {
  return (
    <div className="vd-agreement-shell relative min-h-dvh bg-background text-foreground">
      {/* `contents` gives the header the Letter tokens without adding a box, so
          `sticky` still resolves against the full-height shell */}
      <div data-site-header className={`${LETTER_SCOPE} contents`}>
        <HomeHeader />
      </div>
      <main>
        <AgreementDoc />
      </main>
      {/* offset clears the fixed clause sidebar on large screens */}
      <div data-site-footer className={`${LETTER_SCOPE} lg:ml-[298px]`}>
        <HomeFooter />
      </div>
    </div>
  )
}
