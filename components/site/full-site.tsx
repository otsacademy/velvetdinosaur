import type { ReactNode } from "react"
import { Hero187b } from "@/components/hero187b"
import { SelectedWork } from "./selected-work"
import { SiteFooter } from "./site-footer"
import { mainHeroCopy, mainHeroFeatures, mainHeroSlides } from "@/lib/site-copy"

type RevealWrapper = (content: ReactNode, delay?: number) => ReactNode

async function renderSiteChrome(whatsappHref: string) {
  const [{ EchoNavbar }, { FloatingWhatsApp }] = await Promise.all([
    import("./echo-navbar"),
    import("./floating-whatsapp"),
  ])

  return (
    <>
      <EchoNavbar />
      <FloatingWhatsApp href={whatsappHref} />
    </>
  )
}

async function renderSecondarySections(withReveal: RevealWrapper) {
  const [
    { MyStack },
    { AboutServicesSection },
    { SauroCmsSection },
    { PageSpeedGuaranteeSection },
    { PricingSection },
    { NoLockInSection },
    { ClientReviewSection },
    { ContactSection },
  ] = await Promise.all([
    import("./my-stack"),
    import("./about-services-section"),
    import("./sauro-cms-section"),
    import("./pagespeed-guarantee-section"),
    import("./pricing-section"),
    import("./no-lock-in-section"),
    import("./client-review-section"),
    import("./contact-section"),
  ])

  return (
    <>
      {withReveal(<MyStack />, 100)}

      <div className="bg-[color-mix(in_srgb,var(--vd-accent)_78%,var(--vd-bg))]">
        {withReveal(<AboutServicesSection />, 100)}
      </div>

      <div className="bg-[color-mix(in_srgb,var(--vd-primary)_4%,var(--vd-bg))]">
        {withReveal(<SauroCmsSection />, 100)}
      </div>

      {withReveal(<PageSpeedGuaranteeSection />, 100)}

      {withReveal(<PricingSection />, 100)}

      <div className="bg-[color-mix(in_srgb,var(--vd-accent)_65%,var(--vd-bg))]">
        {withReveal(<NoLockInSection />, 100)}
      </div>

      {withReveal(<ClientReviewSection />, 100)}

      <div className="bg-[color-mix(in_srgb,var(--vd-muted)_84%,var(--vd-bg))]">
        {withReveal(<ContactSection />, 100)}
      </div>
    </>
  )
}

async function renderSelectedWorkSection() {
  const { ScrollReveal } = await import("./scroll-reveal")

  return (
    <ScrollReveal>
      <SelectedWork />
    </ScrollReveal>
  )
}

export async function FullSite() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"
  const siteChrome = isLhci ? null : await renderSiteChrome(whatsappHref)
  const selectedWork = isLhci
    ? <SelectedWork />
    : await renderSelectedWorkSection()
  const secondarySections = isLhci
    ? null
    : await import("./scroll-reveal").then(({ ScrollReveal }) =>
        renderSecondarySections((content, delay) => <ScrollReveal delay={delay}>{content}</ScrollReveal>)
      )

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {siteChrome}

      <main className="pt-20 md:pt-24">
        <section id="home" className="relative px-6 pb-6">
          <div className="pointer-events-none absolute inset-0 -z-10 holding-bg" aria-hidden="true" />
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.22] [background-image:radial-gradient(circle_at_1px_1px,color-mix(in_oklch,oklch(var(--vd-foreground))_18%,transparent)_1px,transparent_0)] [background-size:22px_22px]"
            aria-hidden="true"
          />

          <div className="mx-auto w-full max-w-6xl">
            <Hero187b
              className="py-4 md:py-8 lg:py-6"
              badge={mainHeroCopy.badge}
              heading={mainHeroCopy.heading}
              description={mainHeroCopy.description}
              supportingLine={mainHeroCopy.supportingLine}
              features={mainHeroFeatures.map((feature) => ({
                title: feature.title,
                description: feature.description,
              }))}
              slides={mainHeroSlides}
              autoplay={!isLhci}
              buttons={{
                primary: {
                  text: "Start your project",
                  url: "#contact",
                  buttonClassName: "vd-dino-cta h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
                secondary: {
                  text: "Chat on WhatsApp",
                  url: whatsappHref,
                  buttonClassName: "vd-pill-outline h-12 rounded-full px-7 text-[0.9375rem] font-medium",
                },
              }}
            />
          </div>
        </section>

        {selectedWork}

        {secondarySections}

        <SiteFooter />
      </main>
    </div>
  )
}
