import type { ReactNode } from "react"
import { Hero1 } from "@/components/hero1"
import { SelectedWork } from "./selected-work"
import { SiteFooter } from "./site-footer"
import { mainHeroCopy } from "@/lib/site-copy"

type RevealWrapper = (content: ReactNode, delay?: number) => ReactNode

const heroTrustPills = [
  {
    value: "100/100",
    label: "Lighthouse scores",
    desktopPositionClassName: "left-[-8%] top-[5%]",
  },
  {
    value: "5.0 ★",
    label: "Google rated",
    desktopPositionClassName: "left-[-14%] top-[42%]",
  },
  {
    value: "4-6 weeks",
    label: "Delivery",
    desktopPositionClassName: "bottom-[8%] left-[-10%]",
  },
] as const

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

async function renderHeroImageSlot(
  heroMascotSizeClassName: string,
  heroTrustPillClassName: string,
) {
  const { PixelImage } = await import("@/components/holding/pixel-image.client")

  return (
    <div className="relative flex w-full flex-col items-center justify-center gap-4 overflow-visible lg:gap-0">
      <div className="relative">
        <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
          {heroTrustPills.map((pill) => (
            <div
              key={pill.label}
              className={`${heroTrustPillClassName} absolute ${pill.desktopPositionClassName}`}
            >
              <span className="text-[0.95rem] font-bold text-foreground">{pill.value}</span>
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.04em] [color:color-mix(in_oklch,var(--vd-muted-fg)_72%,transparent)]">
                {pill.label}
              </span>
            </div>
          ))}
        </div>
        <div className="absolute inset-[11%] rounded-[2rem] bg-[radial-gradient(circle_at_top,color-mix(in_oklch,var(--vd-primary)_18%,transparent),transparent_62%)] blur-3xl" />
        <div className="relative animate-vd-float [animation-delay:220ms]">
          <PixelImage
            src="/dinosaur.webp"
            alt="Velvet Dinosaur mascot assembling from grayscale to full color"
            grid="8x8"
            grayscaleAnimation
            colorRevealDelay={1500}
            className="vd-hero-mascot drop-shadow-[0_24px_80px_color-mix(in_oklch,var(--vd-fg)_10%,transparent)]"
            sizeClassName={heroMascotSizeClassName}
          />
        </div>
      </div>

      <div className="grid w-full max-w-[28rem] grid-cols-3 gap-2 lg:hidden">
        {heroTrustPills.map((pill) => (
          <div key={pill.label} className={`${heroTrustPillClassName} min-w-0 px-3 py-3`}>
            <span className="text-[0.82rem] font-bold text-foreground sm:text-[0.9rem]">{pill.value}</span>
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.04em] [color:color-mix(in_oklch,var(--vd-muted-fg)_72%,transparent)]">
              {pill.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

async function renderSecondarySections(withReveal: RevealWrapper) {
  const [
    { ServicesSection },
    { MyStack },
    { AboutServicesSection },
    { SelectedWork },
    { SauroCmsSection },
    { PageSpeedGuaranteeSection },
    { PricingSection },
    { NoLockInSection },
    { ClientReviewSection },
    { ContactSection },
  ] = await Promise.all([
    import("./services-section"),
    import("./my-stack"),
    import("./about-services-section"),
    import("./selected-work"),
    import("./sauro-cms-section"),
    import("./pagespeed-guarantee-section"),
    import("./pricing-section"),
    import("./no-lock-in-section"),
    import("./client-review-section"),
    import("./contact-section"),
  ])

  return (
    <>
      {withReveal(<ServicesSection />, 100)}

      {withReveal(<MyStack />, 100)}

      <div className="bg-muted/40">
        {withReveal(<AboutServicesSection />, 100)}
      </div>

      {withReveal(<SelectedWork />, 100)}

      {withReveal(<SauroCmsSection />, 100)}

      {withReveal(<PageSpeedGuaranteeSection />, 100)}

      <div className="bg-muted/40">
        {withReveal(<PricingSection />, 100)}
      </div>

      {withReveal(<NoLockInSection />, 100)}

      {withReveal(<ClientReviewSection />, 100)}

      <div className="bg-muted/40">
        {withReveal(<ContactSection />, 100)}
      </div>
    </>
  )
}

export async function FullSite() {
  const phoneNumber = process.env.NEXT_PUBLIC_PHONE ?? "+447438460437"
  const whatsappDigits = phoneNumber.replace(/\D/g, "")
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent("Hi Ian, I'd like to discuss a website project.")}`
  const isLhci = process.env.VD_LHCI === "true" || process.env.NEXT_PUBLIC_LHCI === "true"
  const heroMascotSizeClassName =
    "h-[min(17rem,65vw)] w-[min(17rem,65vw)] sm:h-[min(21rem,50vw)] sm:w-[min(21rem,50vw)] lg:h-[min(26rem,36vw)] lg:w-[min(26rem,36vw)]"
  const heroTrustPillClassName =
    "vd-hover-lift-sm pointer-events-auto flex flex-col items-start gap-[0.15rem] rounded-[0.875rem] border border-[color-mix(in_oklch,var(--vd-border)_80%,transparent)] bg-[color-mix(in_oklch,var(--vd-bg)_90%,transparent)] px-4 py-[0.65rem] shadow-[0_2px_12px_color-mix(in_oklch,var(--vd-fg)_6%,transparent)] backdrop-blur-xl transition-all"
  const siteChrome = isLhci ? null : await renderSiteChrome(whatsappHref)
  const heroImageSlot = isLhci
    ? undefined
    : await renderHeroImageSlot(heroMascotSizeClassName, heroTrustPillClassName)
  const secondarySections = isLhci
    ? null
    : await import("./scroll-reveal").then(({ ScrollReveal }) =>
        renderSecondarySections((content, delay) => <ScrollReveal delay={delay}>{content}</ScrollReveal>)
      )

  return (
    <div className="relative min-h-dvh overflow-hidden">
      {siteChrome}

      <main className="pt-20 md:pt-24">
        <section id="home" className="relative mb-2 px-6 pb-6">

          <div className="mx-auto w-full max-w-6xl">
            <Hero1
              className="!pt-10 !pb-8"
              badge={mainHeroCopy.badge}
              heading={mainHeroCopy.heading}
              headingStyle={{
                fontFamily: "var(--font-inter)",
                fontSize: "46px",
                lineHeight: "1.08",
                letterSpacing: "-0.02em",
              }}
              description={mainHeroCopy.description}
              descriptionClassName="text-[17px] leading-[1.75]"
              supportingLine={mainHeroCopy.supportingLine}
              supportingLineClassName="text-[17px] leading-[1.75]"
              buttons={{
                primary: {
                  text: "Start your project",
                  url: "#contact",
                  buttonClassName: "vd-dino-cta h-12 rounded-full px-7 text-[17px] font-medium",
                },
                secondary: {
                  text: "Chat on WhatsApp",
                  url: whatsappHref,
                  buttonClassName: "vd-pill-outline h-12 rounded-full px-7 text-[17px] font-medium",
                },
              }}
              imageSlot={heroImageSlot}
            />
          </div>
        </section>

        {isLhci ? <SelectedWork /> : null}

        {secondarySections}

        <SiteFooter />
      </main>
    </div>
  )
}
