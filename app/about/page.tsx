import type { Metadata } from "next"

import { AboutHero, GoogleReviews, HowIWork } from "@/components/home/about-content"
import { DesignShell } from "@/components/home/design-shell"
import { CtaPanel } from "@/components/home/home-social"
import { siteName } from "@/lib/site-metadata"

const aboutTitle = `About Ian Wickens, web designer near Witney | ${siteName}`
const aboutDescription =
  "Ian Wickens runs Velvet Dinosaur from Minster Lovell, near Witney in Oxfordshire. Managed websites built before you decide, £99 a month with everything included."

export const metadata: Metadata = {
  title: aboutTitle,
  description: aboutDescription,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    url: "/about",
    siteName,
    title: aboutTitle,
    description: aboutDescription,
  },
}

export default function AboutPage() {
  return (
    <DesignShell active="about">
      <AboutHero />
      <HowIWork />
      <GoogleReviews />
      <CtaPanel title="Want to work together?" />
    </DesignShell>
  )
}
