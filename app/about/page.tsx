import type { Metadata } from "next"

import { AboutHero, GoogleReviews, HowIWork } from "@/components/home/about-content"
import { DesignShell } from "@/components/home/design-shell"
import { CtaStrip } from "@/components/home/home-social"
import { siteName } from "@/lib/site-metadata"

const aboutDescription =
  "Ian Wickens runs Velvet Dinosaur, a founder-led studio in Minster Lovell building managed websites — built free before you decide, £99 a month, everything included."

export const metadata: Metadata = {
  title: "About",
  description: aboutDescription,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    siteName,
    title: `About | ${siteName}`,
    description: aboutDescription,
  },
}

export default function AboutPage() {
  return (
    <DesignShell active="about">
      <AboutHero />
      <HowIWork />
      <GoogleReviews />
      <CtaStrip title="Want to work together?" />
    </DesignShell>
  )
}
